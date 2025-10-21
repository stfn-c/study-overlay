import { notFound } from 'next/navigation';
import StudyGoalsOverlay from '@/components/overlays/StudyGoalsOverlay';
import TaskListOverlay from '@/components/overlays/TaskListOverlay';
import QuoteOverlay from '@/components/overlays/QuoteOverlay';
import { OverlayConfig } from '@/lib/types/overlay';

// This would normally fetch from a database
// For now, we'll use mock data
const getMockOverlay = (id: string): OverlayConfig | null => {
  // Mock data for demonstration
  const mockOverlays: Record<string, OverlayConfig> = {
    'demo-goals': {
      id: 'demo-goals',
      name: 'Study Goals Demo',
      type: 'study-goals',
      version: 'v2',
      themeId: 'dark',
      goals: [
        {
          id: '1',
          title: 'Complete Math Assignment',
          target: 120,
          current: 75,
          unit: 'minutes',
        },
        {
          id: '2',
          title: 'Read History Chapter',
          target: 50,
          current: 50,
          unit: 'minutes',
        },
        {
          id: '3',
          title: 'Practice Programming',
          target: 180,
          current: 90,
          unit: 'minutes',
        },
      ],
      showProgress: true,
      opacity: 1,
    },
    'demo-tasks': {
      id: 'demo-tasks',
      name: 'Task List Demo',
      type: 'task-list',
      version: 'v2',
      themeId: 'neon',
      tasks: [
        {
          id: '1',
          title: 'Review lecture notes',
          completed: true,
          priority: 'high',
        },
        {
          id: '2',
          title: 'Submit assignment',
          completed: false,
          priority: 'high',
        },
        {
          id: '3',
          title: 'Prepare for quiz',
          completed: false,
          priority: 'medium',
        },
        {
          id: '4',
          title: 'Read chapter 5',
          completed: false,
          priority: 'low',
        },
      ],
      maxVisible: 5,
      showCompleted: true,
      opacity: 1,
    },
    'demo-quote': {
      id: 'demo-quote',
      name: 'Quote Demo',
      type: 'quote',
      version: 'v2',
      themeId: 'pastel',
      quotes: [
        "The only way to do great work is to love what you do.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
      ],
      rotationInterval: 10,
      showAuthor: true,
      opacity: 1,
    },
  };

  return mockOverlays[id] || null;
};

export default async function OverlayPage({
  params,
}: {
  params: { id: string };
}) {
  const overlay = getMockOverlay(params.id);

  if (!overlay) {
    notFound();
  }

  // Render the appropriate overlay component based on type
  switch (overlay.type) {
    case 'study-goals':
      return <StudyGoalsOverlay config={overlay as any} />;
    case 'task-list':
      return <TaskListOverlay config={overlay as any} />;
    case 'quote':
      return <QuoteOverlay config={overlay as any} />;
    default:
      notFound();
  }
}
