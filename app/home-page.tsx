'use client'

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import posthog from '@/instrumentation-client';
import { createClient } from '@/lib/supabase/client';
import { widgetsService } from '@/lib/services/widgets';
import { CreateWidgetCard } from '@/components/dashboard/CreateWidgetCard';
import { WidgetCard } from '@/components/dashboard/WidgetCard';
import { UserMenu } from '@/components/ui/user-menu';
import { OverlayType, OverlayItem, FormData, overlayCopy } from '@/lib/types/widget';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeatureRequestList } from '@/components/feature-requests/FeatureRequestList';
import { FeatureRequestWithDetails } from '@/lib/services/feature-requests';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { type Locale } from '@/i18n';
import { useTranslations } from 'next-intl';

interface HomeProps {
  host: string;
  token?: string;
  refreshToken?: string;
  user: any;
  initialWidgets: any[];
  featureRequests: FeatureRequestWithDetails[];
  initialOnboardingProgress?: {
    obsInstalled: 'yes' | 'no' | null;
    sceneReady: 'yes' | 'no' | null;
  };
  locale: Locale;
}

export default function HomePage({ host, token, refreshToken, user, initialWidgets, featureRequests, initialOnboardingProgress, locale }: HomeProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  const [overlays, setOverlays] = useState<OverlayItem[]>(
    initialWidgets.map(w => ({
      id: w.id,
      name: w.name,
      type: w.type,
      link: w.config?.link || `${host}/${w.type}?widgetId=${w.id}`,
      createdAt: new Date(w.created_at).getTime(),
      state: w.state || {},
      config: w.config || {},
    }))
  );

  // Initialize Supabase client only on the client side
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Identify user in PostHog
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.full_name,
      });
    }
  }, [user]);

  // Handle joinRoom parameter - auto-create study room widget and join
  useEffect(() => {
    const joinRoomId = searchParams.get('joinRoom');
    if (!joinRoomId || !user || !supabase) return;

    const handleJoinRoom = async () => {
      try {
        // Check if user already has a study room widget
        const existingStudyRoom = overlays.find(w => w.type === 'study-room');

        if (!existingStudyRoom) {
          // Create a study room widget first
          const { data: room } = await supabase
            .from('study_rooms')
            .select('*')
            .eq('id', joinRoomId)
            .single();

          if (!room) {
            alert('Room not found');
            router.replace('/');
            return;
          }

          const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

          // Create the widget
          const newWidget = await widgetsService.saveWidget({
            id: `study-room-${Date.now()}`,
            name: 'Study Room',
            type: 'study-room',
            link: '',
            createdAt: Date.now(),
            config: {
              roomId: joinRoomId,
              inviteCode: room.invite_code,
              userDisplayName: displayName,
              userAvatar: '😀',
              shareDisplayMode: 'code',
            },
          }, user.id);

          // Join the room as a participant
          await supabase
            .from('room_participants')
            .insert({
              room_id: joinRoomId,
              user_id: user.id,
              display_name: displayName,
              avatar_url: '😀',
              custom_status: null,
            });

          // Redirect to widget edit page so they can customize their widget
          router.replace(`/widget-edit?widgetId=${newWidget.id}`);
        } else {
          // Update existing widget with new room
          const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';

          const { data: room } = await supabase
            .from('study_rooms')
            .select('*')
            .eq('id', joinRoomId)
            .single();

          if (!room) {
            alert('Room not found');
            router.replace('/');
            return;
          }

          await supabase
            .from('widgets')
            .update({
              config: {
                ...existingStudyRoom.config,
                roomId: joinRoomId,
                inviteCode: room.invite_code,
              }
            })
            .eq('id', existingStudyRoom.id);

          // Join the room as a participant
          await supabase
            .from('room_participants')
            .insert({
              room_id: joinRoomId,
              user_id: user.id,
              display_name: displayName,
              avatar_url: '😀',
              custom_status: null,
            });

          // Redirect to widget edit page so they can customize their widget
          router.replace(`/widget-edit?widgetId=${existingStudyRoom.id}`);
        }
      } catch (error) {
        console.error('Failed to join room:', error);
        alert('Failed to join room. Please try again.');
        router.replace('/');
      }
    };

    handleJoinRoom();
  }, [searchParams, user, overlays, router, supabase]);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<FormData>({
    defaultValues: {
      type: token ? 'spotify' : null,
    },
  });

  const type = watch('type');

  const [link, setLink] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasSyncedSpotify, setHasSyncedSpotify] = useState(false);
  const [obsInstalled, setObsInstalled] = useState<'yes' | 'no' | null>(initialOnboardingProgress?.obsInstalled || null);
  const [sceneReady, setSceneReady] = useState<'yes' | 'no' | null>(initialOnboardingProgress?.sceneReady || null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [lastCreatedWidgetId, setLastCreatedWidgetId] = useState<string | null>(null);

  const finalStepIndex = 4;

  // Auto-sync Spotify when callback happens
  useEffect(() => {
    if (token && refreshToken && !hasSyncedSpotify && user) {
      const handleSpotifyCallback = async () => {
        const spotifyLink = `${host}/spotify?token=${token}&refreshToken=${refreshToken}`;
        setLink(spotifyLink);

        const hasExistingSpotify = overlays.some((item) => item.type === 'spotify');

        if (!hasExistingSpotify) {
          const newOverlay: OverlayItem = {
            id: `spotify-${Date.now()}`,
            name: overlayCopy.spotify,
            type: 'spotify',
            link: spotifyLink,
            createdAt: Date.now(),
            config: { token, refreshToken },
          };

          try {
            const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
            newOverlay.id = savedWidget.id;
            newOverlay.link = `${host}/widget?widgetId=${savedWidget.id}`;

            setOverlays((previous) => [newOverlay, ...previous]);
            setLastCreatedWidgetId(savedWidget.id);

            posthog.capture('widget_created', {
              widget_type: 'spotify',
              widget_name: newOverlay.name,
              widget_id: savedWidget.id,
              auto_created: true,
            });
          } catch (error) {
            console.error('Failed to save Spotify widget:', error);
          }
        }

        setStepIndex(finalStepIndex);
        setHasSyncedSpotify(true);
      };

      handleSpotifyCallback();
    }
  }, [host, refreshToken, token, hasSyncedSpotify, finalStepIndex, user, overlays]);

  // Subscribe to widget state updates (for real-time Pomodoro status)
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('widget-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'widgets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setOverlays((prev) =>
            prev.map((widget) =>
              widget.id === payload.new.id
                ? { ...widget, state: payload.new.state }
                : widget
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const copyLink = useCallback((value: string, key?: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedLinkId(key ?? value);
    setTimeout(() => setCopiedLinkId(null), 1800);

    posthog.capture('overlay_link_copied', {
      overlay_type: type,
      link: value,
    });
  }, [type]);

  const deleteWidget = useCallback(async (widgetId: string) => {
    try {
      await widgetsService.deleteWidget(widgetId);
      setOverlays(prev => prev.filter(w => w.id !== widgetId));
      posthog.capture('widget_deleted', { widget_id: widgetId });
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  }, []);

  const handleOverlaySubmit = async (data: FormData) => {
    const { type, workingTime, restTime, enableSound } = data;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSaving(true);

    try {
      if (type === 'pomodoro' && workingTime && restTime) {
        const config = { workingTime, restTime, enableSound: enableSound || false };
        const now = Date.now();
        const newOverlay: OverlayItem = {
          id: `pomodoro-${now}`,
          name: `Pomodoro ${workingTime}/${restTime}`,
          type: 'pomodoro',
          link: '',
          createdAt: now,
          config,
          state: {
            isPaused: false,
            isWorking: true,
            lastActionTime: now,
            lastActionTimeLeft: Number(workingTime) * 60 * 1000,
            pomodorosCompleted: 0
          },
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'pomodoro',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
          working_time: workingTime,
          rest_time: restTime,
        });
      }

      if (type === 'local') {
        const newOverlay: OverlayItem = {
          id: `local-${Date.now()}`,
          name: overlayCopy.local,
          type: 'local',
          link: '',
          createdAt: Date.now(),
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'local',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
        });
      }

      if (type === 'quote') {
        const newOverlay: OverlayItem = {
          id: `quote-${Date.now()}`,
          name: overlayCopy.quote,
          type: 'quote',
          link: '',
          createdAt: Date.now(),
          config: {},
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'quote',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
        });
      }

      if (type === 'goals') {
        const newOverlay: OverlayItem = {
          id: `goals-${Date.now()}`,
          name: overlayCopy.goals,
          type: 'goals',
          link: '',
          createdAt: Date.now(),
          config: {
            styleSettings: {
              displayStyle: 'modern',
              fontFamily: 'Inter',
              fontSize: 16,
              primaryColor: '#8B5CF6',
              secondaryColor: '#10b981',
              backgroundColor: '#ffffff',
              showStats: true,
              showDescription: true,
              showDeadline: true,
              animateProgress: true,
            }
          },
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'goals',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
        });
      }

      if (type === 'todo') {
        const newOverlay: OverlayItem = {
          id: `todo-${Date.now()}`,
          name: overlayCopy.todo,
          type: 'todo',
          link: '',
          createdAt: Date.now(),
          config: {
            todoLists: [
              {
                id: 'default',
                name: 'My Tasks',
                color: '#8B5CF6',
                todos: []
              }
            ],
            activeListId: 'default'
          },
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'todo',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
        });
      }

      if (type === 'study-room') {
        const roomAction = data.roomAction || 'create';
        let room;

        if (roomAction === 'create') {
          // Create new study room
          const roomResponse = await fetch('/api/study-room/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.roomName || 'Study Session',
            }),
          });

          if (!roomResponse.ok) {
            throw new Error('Failed to create study room');
          }

          const roomData = await roomResponse.json();
          room = roomData.room;
        } else {
          // Join existing room
          if (!data.inviteCode || data.inviteCode.trim().length === 0) {
            throw new Error('Please enter an invite code');
          }

          const joinResponse = await fetch('/api/study-room/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inviteCode: data.inviteCode.trim().toUpperCase(),
            }),
          });

          if (!joinResponse.ok) {
            throw new Error('Failed to join room. Check your invite code.');
          }

          const joinData = await joinResponse.json();
          room = joinData.room;
        }

        const newOverlay: OverlayItem = {
          id: `study-room-${Date.now()}`,
          name: room.name,
          type: 'study-room',
          link: '',
          createdAt: Date.now(),
          config: {
            roomId: room.id,
            inviteCode: room.invite_code,
            style: 'compact',
            showAvatars: true,
            showStatus: true,
            backgroundColor: '#1a1a1a',
            textColor: '#ffffff',
            accentColor: '#10b981',
          },
        };

        const savedWidget = await widgetsService.saveWidget(newOverlay, user.id);
        const url = `${host}/widget?widgetId=${savedWidget.id}`;

        newOverlay.id = savedWidget.id;
        newOverlay.link = url;

        setLink(url);
        setOverlays((prev) => [newOverlay, ...prev]);
        setStepIndex(finalStepIndex);
        setLastCreatedWidgetId(savedWidget.id);

        posthog.capture('widget_created', {
          widget_type: 'study-room',
          widget_name: newOverlay.name,
          widget_id: savedWidget.id,
          room_id: room.id,
          invite_code: room.invite_code,
          action: roomAction,
        });
      }
    } catch (error) {
      console.error('Failed to create overlay:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const connectSpotify = () => {
    posthog.capture('spotify_connect_clicked');

    // Ensure redirect_uri matches exactly what's configured in Spotify app
    const redirectUri = host; // Must be the exact URL configured in Spotify app settings

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'fb31251099ec4a96a54f36d223ceb448',
      scope: 'user-read-currently-playing',
      redirect_uri: redirectUri,
    });

    console.log('Spotify auth redirect URI:', redirectUri);
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  const openSheet = (initialType?: OverlayType | null) => {
    if (!user) {
      router.push('/login');
      return;
    }

    reset({
      type: initialType ?? null,
      workingTime: undefined,
      restTime: undefined,
    });
    if (!token || initialType !== 'spotify') {
      setLink('');
    }
    setObsInstalled(null);
    setSceneReady(null);
    setIsSheetOpen(true);
    setStepIndex(0);
    setCopiedLinkId(null);
    setExpandedFAQ(null);
    setLastCreatedWidgetId(null);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setStepIndex(0);
    setObsInstalled(null);
    setSceneReady(null);
    setExpandedFAQ(null);
  };

  const steps = useMemo(() => ([
    {
      key: 'choose',
      title: 'Pick an overlay',
      description: 'Choose what you want to show. We will guide you through the OBS steps right after.',
      actionLabel: 'Continue',
      type: 'selection' as const,
    },
    {
      key: 'install',
      title: 'Install OBS',
      description: 'Do you already have OBS Studio installed on your machine?',
      actionLabel: 'Next step',
      type: 'confirm' as const,
      stateKey: 'obsInstalled' as const,
    },
    {
      key: 'scene',
      title: 'Set up your scene',
      description: 'Is your camera scene ready inside OBS? Make sure it is framed how you want it for your study session.',
      actionLabel: 'Looks good',
      type: 'confirm' as const,
      stateKey: 'sceneReady' as const,
    },
    {
      key: 'configure',
      title: 'Configure overlay settings',
      description: 'Fine tune the overlay details before we drop the link into OBS.',
      type: 'configure' as const,
    },
    {
      key: 'finish',
      title: 'Add it to OBS',
      description: 'Copy the link below, add a Browser Source (1920×200 or 1000×200), and you are ready to study.',
      type: 'finish' as const,
    },
  ]), []);

  const typeError = errors.type?.message ?? (errors.type ? 'Choose an overlay type' : '');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-12 md:py-16">
        <Card className="grid gap-8 p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge className="border-slate-200 bg-slate-100 text-[11px] uppercase tracking-[0.35em] text-slate-500">
              {t('common.studyOverlay')}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-[44px]">
              {t('home.title')}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600">
              {t('home.subtitle')}
            </p>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLocale={locale} />
              {user ? (
                <UserMenu user={user} />
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    {t('home.loginToSave')}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Card className="border-slate-200 bg-gradient-to-br from-slate-100 to-white p-8 shadow-none">
            <CardHeader className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hey! I'm Stefan 👋 This is a <span className="font-semibold text-slate-900">100% free</span> passion project I built for people who study together online. No ads, no premium tiers, just clean overlays that work.
                </p>
                <p className="text-sm text-slate-600">
                  If you have ideas or just want to chat, hit me up{' '}
                  <Link href="https://instagram.com/stfn.c" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
                    @stfn.c
                  </Link>{' '}
                  on Instagram!
                </p>
              </div>
            </CardHeader>
          </Card>
        </Card>

        <main className="mt-16 space-y-16">
          <section className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Active widgets</h2>
                <p className="text-sm text-slate-600">Everything you have generated lives here for quick access.</p>
              </div>
              {user && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Logged in as {user.email?.split('@')[0] || 'User'}</span>
                </div>
              )}
            </div>

            <ul className="grid gap-5 md:grid-cols-3">
              <CreateWidgetCard onClick={() => openSheet()} />
              {overlays.map((item) => (
                <WidgetCard
                  key={item.id}
                  widget={item}
                  onCopyLink={copyLink}
                  onDelete={deleteWidget}
                  copiedLinkId={copiedLinkId}
                />
              ))}
            </ul>

            {overlays.length === 0 && (
              <p className="text-sm text-slate-500">
                You don&apos;t have any widgets yet—use the card above to start your first one.
              </p>
            )}
          </section>

          {/* Feature Requests Section */}
          <section className="mt-16">
            <FeatureRequestList initialRequests={featureRequests} user={user} />
          </section>
        </main>
      </div>

      {/* Configuration Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {/* Progress Bar */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100">
            <div className="h-1 bg-slate-100 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-slate-800 to-slate-600 transition-all duration-500 ease-out"
                style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">
                    Step {stepIndex + 1} of {steps.length}
                  </p>
                  <SheetTitle className="text-2xl font-semibold text-slate-900 mt-1">
                    {steps[stepIndex]?.title || 'Setup your overlay'}
                  </SheetTitle>
                </div>
                <div className="flex items-center gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx <= stepIndex
                          ? "w-6 bg-slate-800"
                          : "w-1.5 bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col gap-6 px-8 pb-10 pt-6">
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isSelectionStep = step.type === 'selection';
                const isConfirmStep = step.type === 'confirm';
                const isConfigureStep = step.type === 'configure';
                const isFinishStep = step.type === 'finish';
                const stepIsActive = index === stepIndex;

                const confirmValue = step.stateKey === 'obsInstalled'
                  ? obsInstalled
                  : step.stateKey === 'sceneReady'
                    ? sceneReady
                    : null;

                const canContinue = isSelectionStep
                  ? Boolean(type)
                  : isConfirmStep
                    ? confirmValue === 'yes'
                    : isConfigureStep
                      ? false
                      : true;

                const canAdvanceOnClick = !isSelectionStep && !isConfigureStep && !isFinishStep && stepIsActive && index < finalStepIndex && canContinue;
                const isCompletedStep = index < stepIndex;

                if (index > stepIndex + 1) return null;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "relative rounded-2xl border transition-all duration-300",
                      stepIsActive
                        ? "border-slate-900 bg-white shadow-md p-6"
                        : index < stepIndex
                        ? "border-emerald-200 bg-emerald-50/30 shadow-sm opacity-80 p-4 cursor-pointer hover:shadow-md"
                        : "border-slate-200 bg-slate-50 opacity-50 p-4",
                      canAdvanceOnClick && "cursor-pointer hover:shadow-lg",
                      stepIsActive && "animate-in fade-in-0 duration-200"
                    )}
                    onClick={() => {
                      if (isCompletedStep) {
                        setStepIndex(index);
                      } else if (canAdvanceOnClick) {
                        setStepIndex(index + 1);
                      }
                    }}
                  >
                    {index < stepIndex && (
                      <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 duration-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className={cn(
                        "transition-all duration-300",
                        !stepIsActive && index !== stepIndex && "opacity-60"
                      )}>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.3em] transition-colors",
                          stepIsActive ? "text-slate-500" : "text-slate-400"
                        )}>
                          {index < stepIndex ? "Completed" : `Step ${index + 1}`}
                        </p>
                        <h3 className={cn(
                          "mt-2 font-semibold transition-all",
                          stepIsActive ? "text-xl text-slate-900" : "text-base text-slate-700"
                        )}>
                          {step.title}
                        </h3>
                        {stepIsActive && (
                          <p className="mt-2 text-sm text-slate-600">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelectionStep && stepIsActive && (
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                          {(['pomodoro', 'goals', 'spotify', 'local', 'quote', 'todo', 'study-room'] as OverlayType[]).map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={cn(
                                "w-full flex items-center justify-between gap-3 rounded-xl px-5 py-4 text-left transition-all duration-200",
                                type === option
                                  ? "border-2 border-slate-900 bg-slate-900 text-white shadow-md"
                                  : "border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              )}
                              onClick={(event) => {
                                event.stopPropagation();
                                setValue('type', option, { shouldValidate: true });
                              }}
                            >
                              <div>
                                <span className={cn(
                                  "font-semibold block",
                                  type === option ? "text-white" : "text-slate-900"
                                )}>
                                  {overlayCopy[option]}
                                </span>
                                <span className={cn(
                                  "text-xs mt-0.5 block",
                                  type === option ? "text-white/70" : "text-slate-500"
                                )}>
                                  {option === 'pomodoro' && "Focus timer with breaks"}
                                  {option === 'goals' && "Track study objectives"}
                                  {option === 'spotify' && "Show what's playing"}
                                  {option === 'local' && "Display current time"}
                                  {option === 'quote' && "Daily motivation"}
                                  {option === 'todo' && "Task tracker"}
                                  {option === 'study-room' && "Study with friends"}
                                </span>
                              </div>
                              {type === option && (
                                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center animate-in zoom-in-50 duration-200">
                                  <div className="h-2 w-2 rounded-full bg-slate-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {type === 'spotify' && (
                          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm">
                            <div className="flex items-start gap-3">
                              <span className="text-lg">⚠️</span>
                              <div className="flex-1">
                                <p className="font-semibold text-amber-900 mb-1">Spotify Integration Pending Approval</p>
                                <p className="text-amber-800 mb-2">
                                  The Spotify app is currently waiting for approval from Spotify. It won't work for new users yet, but should be ready in a couple of days.
                                </p>
                                <p className="text-amber-800">
                                  <strong>Need access now?</strong> Message me on Instagram{' '}
                                  <a
                                    href="https://instagram.com/stfn.c"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-semibold hover:text-amber-900"
                                  >
                                    @stfn.c
                                  </a>
                                  {' '}and I can manually add you.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isConfirmStep && stepIsActive && (
                      <div className="mt-6 space-y-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className={cn(
                              "flex-1 rounded-xl px-5 py-3 font-medium transition-all duration-200",
                              confirmValue === 'yes'
                                ? "bg-emerald-500 text-white shadow-md"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (step.stateKey === 'obsInstalled') {
                                setObsInstalled('yes');
                                if (user) {
                                  try {
                                    await fetch('/api/onboarding', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ obsInstalled: 'yes' })
                                    });
                                  } catch (error) {
                                    console.error('Failed to save onboarding progress:', error);
                                  }
                                }
                              }
                              if (step.stateKey === 'sceneReady') {
                                setSceneReady('yes');
                                if (user) {
                                  try {
                                    await fetch('/api/onboarding', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ sceneReady: 'yes' })
                                    });
                                  } catch (error) {
                                    console.error('Failed to save onboarding progress:', error);
                                  }
                                }
                              }
                            }}
                          >
                            ✓ Yes, ready
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "flex-1 rounded-xl px-5 py-3 font-medium transition-all duration-200",
                              confirmValue === 'no'
                                ? "bg-slate-900 text-white shadow-md"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (step.stateKey === 'obsInstalled') {
                                setObsInstalled('no');
                                if (user) {
                                  try {
                                    await fetch('/api/onboarding', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ obsInstalled: 'no' })
                                    });
                                  } catch (error) {
                                    console.error('Failed to save onboarding progress:', error);
                                  }
                                }
                              }
                              if (step.stateKey === 'sceneReady') {
                                setSceneReady('no');
                                if (user) {
                                  try {
                                    await fetch('/api/onboarding', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ sceneReady: 'no' })
                                    });
                                  } catch (error) {
                                    console.error('Failed to save onboarding progress:', error);
                                  }
                                }
                              }
                            }}
                          >
                            ✕ Not yet
                          </button>
                        </div>
                        {confirmValue === 'no' && step.stateKey === 'obsInstalled' && (
                          <p className="w-full text-xs text-slate-500">
                            Grab OBS here →{' '}
                            <Link className="font-medium text-slate-700 underline-offset-4 hover:underline" href="https://obsproject.com/">
                              obsproject.com
                            </Link>
                          </p>
                        )}
                        {confirmValue === 'no' && step.stateKey === 'sceneReady' && (
                          <p className="w-full text-xs text-slate-500">
                            Add a Scene in OBS, drop in your camera source, and arrange your layout before continuing.
                          </p>
                        )}

                        {/* FAQ Section for Scene Setup */}
                        {step.stateKey === 'sceneReady' && (
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700 mb-3">Having issues setting up your scene?</p>
                            <div className="space-y-2">
                              {[
                                {
                                  q: "How do I add a scene in OBS?",
                                  a: "In the Scenes panel (bottom left), click the + button and name it something like 'Study Session'. This will be your main layout for studying together."
                                },
                                {
                                  q: "How do I add my camera?",
                                  a: "Click + in Sources → Video Capture Device → Select your camera from the dropdown. If it's black, try selecting a different device or restarting OBS."
                                },
                                {
                                  q: "My camera looks stretched or wrong size",
                                  a: "Right-click your camera source → Transform → Fit to Screen, or drag the red corners while holding Shift to maintain aspect ratio."
                                },
                                {
                                  q: "How should I position my camera?",
                                  a: "Most people put their camera in the bottom corner or center-bottom. Leave space at the bottom for the overlay (about 200px height)."
                                },
                                {
                                  q: "My camera is mirrored/flipped",
                                  a: "Right-click the camera source → Transform → Flip Horizontal. This makes it mirror-like which feels more natural for study sessions."
                                }
                              ].map((faq, index) => (
                                <div
                                  key={index}
                                  className="rounded border border-slate-200 bg-white overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedFAQ(expandedFAQ === index ? null : index);
                                    }}
                                  >
                                    <span>{faq.q}</span>
                                    <svg
                                      className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                                        expandedFAQ === index && "rotate-180"
                                      )}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  <div
                                    className={cn(
                                      "transition-all duration-200 overflow-hidden border-t border-slate-100 bg-slate-50",
                                      expandedFAQ === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0 border-t-0"
                                    )}
                                  >
                                    <div className="px-3 py-2 text-xs text-slate-600">
                                      {faq.a}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-600">
                                Still confused? Check our{' '}
                                <Link href="/obs-help" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                                  complete OBS setup guide
                                </Link>{' '}
                                with solutions to every problem.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isConfigureStep && stepIsActive && (
                      <div className="mt-6 space-y-6">
                        <form onSubmit={handleSubmit(handleOverlaySubmit)} className="space-y-6">
                          <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-slate-800">Choose your overlay</legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {(['pomodoro', 'goals', 'spotify', 'local', 'quote', 'todo', 'study-room'] as OverlayType[]).map((overlayType) => (
                                <label
                                  key={overlayType}
                                  className={`rounded-xl border px-4 py-4 text-sm transition cursor-pointer ${
                                    type === overlayType
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    {...register('type', { required: 'Choose an overlay type' })}
                                    type="radio"
                                    value={overlayType}
                                    className="sr-only"
                                  />
                                  <span className="font-semibold">{overlayCopy[overlayType].split(' ')[0]}</span>
                                  <span
                                    className={`mt-1 block text-xs ${
                                      type === overlayType ? 'text-white/70' : 'text-slate-500'
                                    }`}
                                  >
                                    {overlayType === 'pomodoro' && 'Work & rest timer'}
                                    {overlayType === 'goals' && 'Progress tracking'}
                                    {overlayType === 'spotify' && 'Now playing'}
                                    {overlayType === 'local' && 'Minimal clock'}
                                    {overlayType === 'quote' && 'Daily motivation'}
                                    {overlayType === 'todo' && 'Track your tasks'}
                                    {overlayType === 'study-room' && 'Study with friends'}
                                  </span>
                                </label>
                              ))}

                              {/* Coming Soon Card */}
                              <div className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm bg-slate-50/50 cursor-not-allowed opacity-75">
                                <span className="font-semibold text-slate-600">More coming soon</span>
                                <span className="mt-1 block text-xs text-slate-500">
                                  Got ideas? Add them below! 👇
                                </span>
                              </div>
                            </div>
                            {typeError && <p className="text-xs text-rose-500">{typeError}</p>}
                          </fieldset>

                          {type === 'spotify' && (
                            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm">
                              <div className="flex items-start gap-3">
                                <span className="text-lg">⚠️</span>
                                <div className="flex-1">
                                  <p className="font-semibold text-amber-900 mb-1">Spotify Integration Pending Approval</p>
                                  <p className="text-amber-800 mb-2">
                                    The Spotify app is currently waiting for approval from Spotify. It won't work for new users yet, but should be ready in a couple of days.
                                  </p>
                                  <p className="text-amber-800">
                                    <strong>Need access now?</strong> Message me on Instagram{' '}
                                    <a
                                      href="https://instagram.com/stfn.c"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline font-semibold hover:text-amber-900"
                                    >
                                      @stfn.c
                                    </a>
                                    {' '}and I can manually add you.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {type === 'pomodoro' && (
                            <>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-2 text-sm text-slate-700">
                                  <span className="font-medium">Work duration (minutes)</span>
                                  <input
                                    {...register('workingTime', { required: true })}
                                    type="number"
                                    min="1"
                                    placeholder="25"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                  />
                                  {errors.workingTime && (
                                    <span className="text-xs text-rose-500">Add how long you want to focus.</span>
                                  )}
                                </label>
                                <label className="space-y-2 text-sm text-slate-700">
                                  <span className="font-medium">Break duration (minutes)</span>
                                  <input
                                    {...register('restTime', { required: true })}
                                    type="number"
                                    min="1"
                                    placeholder="5"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                  />
                                  {errors.restTime && (
                                    <span className="text-xs text-rose-500">Add the length of your break.</span>
                                  )}
                                </label>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                                <div>
                                  <span className="text-sm font-medium text-slate-700">Sound notifications</span>
                                  <p className="text-xs text-slate-500 mt-0.5">Play a ding when sessions complete</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setValue('enableSound', !watch('enableSound'))}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    watch('enableSound') ? 'bg-slate-900' : 'bg-slate-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      watch('enableSound') ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </>
                          )}

                          {type === 'study-room' && (
                            <div className="space-y-4">
                              {/* Choose: Create or Join */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">What would you like to do?</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setValue('roomAction', 'create')}
                                    className={`px-4 py-3 rounded-lg text-sm transition-all ${
                                      watch('roomAction') === 'create' || !watch('roomAction')
                                        ? 'bg-emerald-600 text-white font-medium'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    Create New Room
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setValue('roomAction', 'join')}
                                    className={`px-4 py-3 rounded-lg text-sm transition-all ${
                                      watch('roomAction') === 'join'
                                        ? 'bg-emerald-600 text-white font-medium'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    Join Existing Room
                                  </button>
                                </div>
                              </div>

                              {/* Create Room */}
                              {(!watch('roomAction') || watch('roomAction') === 'create') && (
                                <label className="space-y-2 text-sm text-slate-700">
                                  <span className="font-medium">Room name</span>
                                  <input
                                    {...register('roomName')}
                                    type="text"
                                    placeholder="My Study Session"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                  />
                                </label>
                              )}

                              {/* Join Room */}
                              {watch('roomAction') === 'join' && (
                                <label className="space-y-2 text-sm text-slate-700">
                                  <span className="font-medium">Invite code</span>
                                  <input
                                    {...register('inviteCode')}
                                    type="text"
                                    placeholder="STUDY-XY7K"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 uppercase font-mono"
                                  />
                                </label>
                              )}

                              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <span className="text-lg">👥</span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-emerald-900 mb-1">Study Together in Real-Time</p>
                                    <p className="text-emerald-800 mb-2">
                                      {(!watch('roomAction') || watch('roomAction') === 'create')
                                        ? 'Create a room and share the invite code with friends.'
                                        : 'Enter the invite code your friend shared with you.'
                                      } You'll all appear in the widget and can see who's actively studying (OBS running) or away.
                                    </p>
                                    <ul className="text-emerald-800 text-xs space-y-1">
                                      <li>• Active status updates every 30 seconds</li>
                                      <li>• Custom status messages and avatars</li>
                                      <li>• Anyone can join or leave anytime</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {type === 'spotify' && (
                            <>
                              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <span className="text-lg">⚠️</span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-amber-900 mb-1">Spotify Integration Pending Approval</p>
                                    <p className="text-amber-800 mb-2">
                                      The Spotify app is currently waiting for approval from Spotify. It won't work for new users yet, but should be ready in a couple of days.
                                    </p>
                                    <p className="text-amber-800">
                                      <strong>Need access now?</strong> Message me on Instagram{' '}
                                      <a
                                        href="https://instagram.com/stfn.c"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline font-semibold hover:text-amber-900"
                                      >
                                        @stfn.c
                                      </a>
                                      {' '}and I can manually add you.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 text-sm text-slate-600">
                                {token
                                  ? 'Spotify is already connected. Refresh if you need a new link.'
                                  : 'Connect with Spotify Premium so we can pull your now playing data.'}
                              </div>
                            </>
                          )}

                          {link && (
                            <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 text-sm text-slate-700">
                              <p className="text-xs uppercase tracking-wide text-slate-500">Most recent link</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="border border-slate-300 bg-white px-3"
                                  onClick={() => copyLink(link)}
                                >
                                  {copiedLinkId === link ? 'Copied' : 'Copy link'}
                                </Button>
                                <span className="flex-1 break-all font-mono text-xs text-slate-600">{link}</span>
                              </div>
                            </div>
                          )}

                          {type !== 'spotify' && (
                            <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                              {isSaving ? 'Creating...' : 'Generate overlay link'}
                            </Button>
                          )}

                          {type === 'spotify' && (
                            <Button
                              type="button"
                              onClick={connectSpotify}
                              className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
                              size="lg"
                            >
                              {token ? 'Refresh Spotify connection' : 'Connect Spotify account'}
                            </Button>
                          )}
                        </form>
                      </div>
                    )}

                    {isFinishStep && stepIsActive && (
                      <div className="mt-6 space-y-5">
                        {link ? (
                          <>
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Your overlay link</p>
                                <span className="text-xs text-emerald-600">✓ Ready to use</span>
                              </div>
                              <div className="flex flex-col gap-3">
                                <code className="block p-3 bg-white rounded-lg font-mono text-xs text-slate-700 break-all border border-emerald-100">
                                  {link}
                                </code>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className={cn(
                                      "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                                      copiedLinkId === link
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    )}
                                    onClick={() => copyLink(link)}
                                  >
                                    {copiedLinkId === link ? '✓ Copied!' : 'Copy to clipboard'}
                                  </button>
                                  <Link
                                    href={`/widget-edit?widgetId=${overlays.find(o => o.link === link)?.id}`}
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all"
                                  >
                                    Edit settings
                                  </Link>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">OBS Setup Guide</p>
                              <ol className="space-y-2 text-sm text-slate-600">
                                <li className="flex gap-2">
                                  <span className="font-bold text-slate-900">1.</span>
                                  <span>Add a Browser Source in OBS (1920×200 or 1000×200)</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-slate-900">2.</span>
                                  <span>Paste your overlay link and click OK</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-slate-900">3.</span>
                                  <span>Position it on your stream layout</span>
                                </li>
                              </ol>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <p className="text-sm text-slate-600">
                              Generate your link in the previous step to see it here
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl border-2 border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-all"
                            onClick={() => setStepIndex(Math.max(finalStepIndex - 1, 0))}
                          >
                            ← Back to settings
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800 shadow-lg transition-all"
                            onClick={() => {
                              if (lastCreatedWidgetId) {
                                router.push(`/widget-edit?widgetId=${lastCreatedWidgetId}`);
                              } else {
                                closeSheet();
                              }
                            }}
                          >
                            Customize widget →
                          </button>
                        </div>
                      </div>
                    )}

                    {!isConfigureStep && !isFinishStep && index < finalStepIndex && stepIsActive && (
                      <button
                        type="button"
                        className={cn(
                          "mt-6 w-full rounded-xl px-5 py-3 font-medium transition-colors duration-200",
                          canContinue
                            ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                        disabled={!canContinue}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!canContinue) return;
                          setStepIndex((current) => Math.min(current + 1, finalStepIndex));
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {step.actionLabel ?? 'Continue'}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}