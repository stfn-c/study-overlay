'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Category =
  | 'getting-started'
  | 'camera-issues'
  | 'overlay-setup'
  | 'audio-problems'
  | 'session-issues'
  | 'performance';

interface FAQ {
  q: string;
  a: string;
  tags?: string[];
}

export default function OBSHelpPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: Category; label: string; description: string }[] = [
    { id: 'getting-started', label: 'Getting Started', description: 'First time setup and basics' },
    { id: 'camera-issues', label: 'Camera Issues', description: 'Vertical camera, black screen, positioning' },
    { id: 'overlay-setup', label: 'Overlay Setup', description: 'Adding and positioning overlays' },
    { id: 'audio-problems', label: 'Audio Problems', description: 'Mic, desktop audio, sync issues' },
    { id: 'session-issues', label: 'Session Issues', description: 'Connection, quality, recording problems' },
    { id: 'performance', label: 'Performance', description: 'Lag, dropped frames, CPU usage' },
  ];

  const faqs: Record<Category, FAQ[]> = {
    'getting-started': [
      {
        q: 'How do I download and install OBS?',
        a: 'Visit obsproject.com and download OBS Studio (not Streamlabs OBS). Run the installer and follow the setup wizard. You can skip platform selection if you\'re just using it for study sessions with friends.',
        tags: ['download', 'install', 'setup']
      },
      {
        q: 'What are Scenes and Sources?',
        a: 'Scenes are different layouts you can switch between (like "Study Session", "Break Time", "Starting Soon"). Sources are the elements in each scene (camera, overlays, images, text). Think of Scenes as slides and Sources as things on each slide.',
        tags: ['basics', 'scenes', 'sources']
      },
      {
        q: 'How do I create my first scene?',
        a: 'In the Scenes panel (bottom left), click + → Name it "Study Session" or "Main" → Click + in Sources → Add Video Capture Device for camera → Add Browser Source for overlay → Arrange them by dragging in the preview.',
        tags: ['scene', 'create', 'first']
      },
      {
        q: 'What settings should I use?',
        a: 'Go to Settings → Video → Base resolution: your monitor size, Output resolution: 1920x1080 or 1280x720 → FPS: 30. For Discord/Zoom screenshare, these default settings work great. Use Auto-Configuration Wizard for best results.',
        tags: ['settings', 'configuration', 'resolution']
      },
      {
        q: 'How do I use this with Discord or Zoom?',
        a: 'In Discord: User Settings → Voice & Video → Camera → Select "OBS Virtual Camera". In Zoom: Video Settings → Camera → Select "OBS Virtual Camera". Make sure to Start Virtual Camera in OBS first!',
        tags: ['discord', 'zoom', 'virtual camera']
      },
    ],
    'camera-issues': [
      {
        q: 'How do I set up a vertical/overhead camera?',
        a: 'Add Video Capture Device for your camera → Right-click camera → Transform → Rotate 90° CW or CCW (depending on camera orientation) → Resize and position as needed. Perfect for showing your desk/notes from above!',
        tags: ['vertical', 'overhead', 'rotate', 'desk camera']
      },
      {
        q: 'My camera shows a black screen',
        a: 'Close other apps using the camera (Zoom, Discord, browser) → In OBS, remove and re-add the Video Capture Device → Try different Device selections in the dropdown → Restart OBS → Check camera permissions in system settings.',
        tags: ['black screen', 'camera', 'no video']
      },
      {
        q: 'Camera not detected in OBS',
        a: 'Ensure camera is plugged in → Check Device Manager (Windows) or System Information (Mac) → Update camera drivers → Try different USB port → Disable then re-enable camera in system settings → Run OBS as administrator.',
        tags: ['not detected', 'missing', 'camera']
      },
      {
        q: 'Camera is upside down or mirrored',
        a: 'Right-click camera source → Transform → Flip Horizontal (for mirror) or Flip Vertical (for upside down). Most streamers use Flip Horizontal for a natural mirror effect.',
        tags: ['flipped', 'mirrored', 'upside down']
      },
      {
        q: 'Camera quality is poor/pixelated',
        a: 'Right-click camera → Properties → Resolution: Set to highest available → FPS: 30 or 60 → Video Format: Try MJPEG or YUV → Deactivate "Buffering". Also check physical: Clean lens, good lighting, camera focus.',
        tags: ['quality', 'pixelated', 'blurry']
      },
      {
        q: 'Camera freezes or lags',
        a: 'Lower camera resolution in Properties → Disable camera buffering → Close other apps → Try different USB port (USB 3.0 preferred) → Update camera drivers → Check CPU usage isn\'t too high.',
        tags: ['freeze', 'lag', 'stuttering']
      },
      {
        q: 'Camera looks stretched or squashed',
        a: 'Right-click camera → Transform → Reset Transform → Then: Transform → Fit to Screen. Or manually: Hold Shift while dragging corners to maintain aspect ratio.',
        tags: ['stretched', 'aspect ratio', 'distorted']
      },
      {
        q: 'How do I set up multiple camera angles?',
        a: 'Add each camera as a separate Video Capture Device source → Name them clearly (e.g., "Face Camera", "Desk Camera") → Toggle visibility with eye icon or use hotkeys to switch between angles during study sessions.',
        tags: ['multiple', 'angles', 'switch', 'two cameras']
      },
      {
        q: 'Best camera position for desk/note-taking shots?',
        a: 'Mount camera directly overhead pointing down at desk (vertical setup) → Ensures notes/writing are visible and properly oriented → Use a boom arm or desk mount for stability → Adjust height to frame entire workspace → Good lighting from sides prevents shadows from hands.',
        tags: ['vertical', 'desk setup', 'overhead', 'notes', 'positioning']
      },
      {
        q: 'How do I fix vertical video orientation issues?',
        a: 'Right-click camera → Transform → Rotate 90° CW/CCW until correct → If image is mirrored: Transform → Flip Horizontal → Test with visible text/numbers to ensure proper orientation → Save Transform to preset for quick setup.',
        tags: ['vertical', 'rotate', 'orientation', 'sideways']
      },
      {
        q: 'Green screen not working',
        a: 'Right-click camera → Filters → + → Chroma Key → Select green color with picker → Adjust Similarity (400-450) and Smoothness (15-50) → Ensure good, even lighting on green screen with no shadows.',
        tags: ['green screen', 'chroma key', 'background']
      },
    ],
    'overlay-setup': [
      {
        q: 'How do I add the Study Overlay?',
        a: 'Copy your overlay link from the website → In OBS Sources, click + → Browser Source → Name it "Overlay" → Paste URL → Width: 1920, Height: 200 → OK. Position it at the bottom of your scene.',
        tags: ['overlay', 'browser source', 'add']
      },
      {
        q: 'Overlay is not showing up',
        a: 'Check the eye icon next to the source is visible → Ensure overlay is above camera in sources list (top = front) → Right-click → Properties → Ensure URL is correct → Try Refresh Cache of Current Page.',
        tags: ['not showing', 'invisible', 'missing']
      },
      {
        q: 'Overlay is the wrong size',
        a: 'Right-click overlay → Properties → Width: 1920, Height: 200 (or 1000×200 for compact) → If still wrong: Transform → Reset Transform → Then manually resize by dragging corners.',
        tags: ['size', 'dimensions', 'too big', 'too small']
      },
      {
        q: 'How do I position the overlay?',
        a: 'Click the overlay in preview → Drag to desired position (usually bottom) → Hold Alt while dragging to crop → Right-click → Transform → Edit Transform for precise positioning (Y: 880 for bottom on 1080p).',
        tags: ['position', 'move', 'placement']
      },
      {
        q: 'Overlay has white/black background',
        a: 'Right-click overlay → Properties → Check "Shutdown source when not visible" and "Refresh browser when scene becomes active" → Custom CSS: body { background-color: transparent !important; }',
        tags: ['background', 'transparent', 'white', 'black']
      },
      {
        q: 'Multiple overlays setup',
        a: 'Add each as separate Browser Source → Stack them vertically or arrange as needed → Use different scenes for different layouts → Can show/hide with eye icon or hotkeys.',
        tags: ['multiple', 'several', 'many']
      },
      {
        q: 'Overlay not updating (Spotify/Pomodoro)',
        a: 'Right-click → Interact → Check if it\'s working there → Properties → Refresh Cache → Ensure you\'re logged in on the website → Check internet connection → Try removing and re-adding.',
        tags: ['not updating', 'frozen', 'static']
      },
    ],
    'audio-problems': [
      {
        q: 'No microphone audio',
        a: 'Check Audio Mixer panel → Mic/Aux should show levels when speaking → Settings → Audio → Mic/Auxiliary Device: Select your mic → Unmute if muted (click speaker icon) → Check Windows/Mac sound settings.',
        tags: ['no mic', 'microphone', 'no audio']
      },
      {
        q: 'Desktop audio not captured',
        a: 'Settings → Audio → Desktop Audio Device: Select Default or your speakers → On Mac: Install BlackHole or iShowU Audio Capture → Audio Mixer: Check Desktop Audio isn\'t muted.',
        tags: ['desktop audio', 'game audio', 'no sound']
      },
      {
        q: 'Echo or feedback issues',
        a: 'Use headphones instead of speakers → Mute desktop audio if using mic → Add Noise Suppression filter to mic → Position mic away from speakers → Disable "listen to this device" in system settings.',
        tags: ['echo', 'feedback', 'repeating']
      },
      {
        q: 'Audio out of sync with video',
        a: 'Right-click audio source → Advanced Audio Properties → Sync Offset: Add delay (positive ms) if audio is ahead, negative if behind. Start with 50-100ms adjustments. Common for webcams.',
        tags: ['sync', 'delay', 'out of sync', 'lip sync']
      },
      {
        q: 'Microphone too quiet/loud',
        a: 'Audio Mixer → Adjust slider for Mic/Aux → Right-click → Filters → Add Gain (boost quiet mic) or Limiter (prevent clipping) → Aim for yellow peaks, avoid red → Check mic distance and positioning.',
        tags: ['volume', 'quiet', 'loud', 'levels']
      },
      {
        q: 'Background noise in microphone',
        a: 'Right-click mic → Filters → Add Noise Suppression (RNNoise best) → Add Noise Gate (opens at -30dB, closes at -40dB) → Physical: Use pop filter, treat room acoustics, close windows.',
        tags: ['noise', 'background', 'hiss', 'static']
      },
      {
        q: 'Multiple audio sources setup',
        a: 'Add Audio Input/Output Capture sources for specific devices → Use Audio Mixer to balance levels → Advanced Audio Properties for routing → Can separate tracks for recording.',
        tags: ['multiple', 'sources', 'mixing']
      },
    ],
    'session-issues': [
      {
        q: 'Virtual Camera not working in Discord/Zoom',
        a: 'In OBS: Start Virtual Camera (bottom right) → Close and reopen Discord/Zoom → Select "OBS Virtual Camera" in video settings → If still not working: Restart your computer, some apps cache camera list.',
        tags: ['virtual camera', 'discord', 'zoom', 'not working']
      },
      {
        q: 'How do I record my study session?',
        a: 'File → Settings → Output → Recording → Choose MP4 or MKV → Select folder location → Click "Start Recording" in OBS main window. Recording saves locally, no internet needed!',
        tags: ['recording', 'save', 'local']
      },
      {
        q: 'Session is laggy/choppy for others',
        a: 'Lower Output Resolution to 720p → Reduce FPS to 30 → Close bandwidth-heavy apps → Use ethernet instead of WiFi → In Discord: Lower video quality in Voice settings.',
        tags: ['laggy', 'choppy', 'buffering']
      },
      {
        q: 'Recording file is huge/takes lots of space',
        a: 'Settings → Output → Recording Format: Use MP4 → Encoder: x264 → Rate Control: CBR, Bitrate: 2500-4000 → Lower resolution to 720p if needed. Balance quality vs file size.',
        tags: ['file size', 'huge', 'storage', 'compress']
      },
      {
        q: 'Quality looks bad on Discord/Zoom',
        a: 'Increase Output Resolution (1080p) → Ensure good lighting for camera → Settings → Video → Downscale Filter: Lanczos → Discord Nitro gives better quality streaming.',
        tags: ['quality', 'pixelated', 'blurry']
      },
      {
        q: 'OBS Virtual Camera not showing up',
        a: 'Install OBS VirtualCam plugin if using OBS older than 26.1 → Restart computer after installation → Check in Device Manager (Windows) that OBS Virtual Camera driver is installed.',
        tags: ['virtual camera', 'plugin', 'missing']
      },
    ],
    'performance': [
      {
        q: 'OBS using too much CPU',
        a: 'Settings → Output → Encoder: Use Hardware (NVENC/AMD/QuickSync) if available → Lower Output Resolution → Reduce FPS → Close unnecessary sources/scenes → Disable preview when not needed.',
        tags: ['cpu', 'high usage', 'processor']
      },
      {
        q: 'Encoding overloaded warning',
        a: 'Lower settings: 720p instead of 1080p → 30fps instead of 60 → Faster encoder preset → Turn off unnecessary sources → Close other programs → Consider upgrading hardware.',
        tags: ['encoding', 'overloaded', 'warning']
      },
      {
        q: 'OBS crashes frequently',
        a: 'Update OBS to latest version → Update graphics drivers → Remove problematic plugins → Run as Administrator → Check Windows Event Viewer for errors → Reset settings: Help → Log Files → Upload Last Log File for analysis.',
        tags: ['crash', 'close', 'stops working']
      },
      {
        q: 'Computer slows down when OBS is open',
        a: 'Settings → Advanced → Process Priority: Normal (not Above Normal) → Close unnecessary browser tabs and apps → Lower Output Resolution to 720p → Reduce FPS to 30 → Disable preview when not actively using it.',
        tags: ['slow', 'computer lag', 'fps drop', 'performance']
      },
      {
        q: 'Preview lag in OBS',
        a: 'Right-click preview → Scale Preview → 50% or lower → Disable preview when not needed → Close other scenes → Reduce source count → Check GPU usage.',
        tags: ['preview', 'lag', 'stuttering']
      },
      {
        q: 'Best OBS settings for my PC?',
        a: 'Tools → Auto-Configuration Wizard → Choose "Optimize for recording" → Apply recommended settings → Fine-tune: Start conservative (720p30) and increase until issues appear. For Discord/Zoom, 720p30 is usually perfect.',
        tags: ['settings', 'optimize', 'configuration']
      },
    ],
  };

  // Filter FAQs based on search
  const getFilteredFAQs = () => {
    if (!searchQuery.trim()) {
      return faqs[activeCategory];
    }

    const query = searchQuery.toLowerCase();
    const allFAQs: { category: Category; faq: FAQ }[] = [];

    Object.entries(faqs).forEach(([category, categoryFAQs]) => {
      categoryFAQs.forEach(faq => {
        if (
          faq.q.toLowerCase().includes(query) ||
          faq.a.toLowerCase().includes(query) ||
          faq.tags?.some(tag => tag.toLowerCase().includes(query))
        ) {
          allFAQs.push({ category: category as Category, faq });
        }
      });
    });

    return allFAQs.map(item => item.faq);
  };

  const filteredFAQs = getFilteredFAQs();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link href="/">
            <Badge className="mb-4 border-slate-200 bg-slate-100 text-[11px] uppercase tracking-[0.35em] text-slate-500 cursor-pointer hover:bg-slate-200">
              ← Back to Study Overlay
            </Badge>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Complete OBS Setup Guide</h1>
          <p className="mt-2 text-slate-600">Solutions to every OBS problem for your study sessions</p>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search for issues... (e.g., 'black screen', 'audio', 'lag')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-2 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {!searchQuery && (
          <Card className="mb-6 border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {categories.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </Card>
        )}

        {searchQuery && (
          <p className="mb-4 text-sm text-slate-600">
            Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}

        {/* FAQs */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => {
            const faqId = `${activeCategory}-${index}`;
            return (
              <Card
                key={faqId}
                className="border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
                  }}
                  className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 pr-4">{faq.q}</h3>
                    <svg
                      className={cn(
                        "w-5 h-5 text-slate-400 transition-transform shrink-0",
                        expandedFAQ === faqId && "rotate-180"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={cn(
                    "border-t border-slate-100 bg-slate-50 transition-all duration-200 overflow-hidden",
                    expandedFAQ === faqId ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-4">
                    <p className="text-sm text-slate-700 whitespace-pre-line">{faq.a}</p>
                    {faq.tags && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <Card className="border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">No results found for "{searchQuery}"</p>
            <p className="mt-2 text-sm text-slate-500">Try different keywords or browse categories above</p>
          </Card>
        )}

        {/* Extra Resources */}
        <Card className="mt-12 border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
          <h3 className="text-lg font-semibold mb-4">Still need help?</h3>
          <div className="space-y-3 text-sm">
            <p className="text-slate-200">
              • Official OBS Forums: <a href="https://obsproject.com/forum/" className="underline hover:text-white">obsproject.com/forum</a>
            </p>
            <p className="text-slate-200">
              • OBS Discord: <a href="https://discord.gg/obsproject" className="underline hover:text-white">discord.gg/obsproject</a>
            </p>
            <p className="text-slate-200">
              • Video Tutorials: Search "OBS Studio Tutorial" on YouTube
            </p>
            <p className="text-slate-200">
              • Need help with overlays? I'm Stefan, just DM me <a href="https://instagram.com/stfn.c" className="underline hover:text-white">@stfn.c</a> on Instagram
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}