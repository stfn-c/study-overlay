import PomodoroClient from './pomodoro-client';

export default async function PomodoroPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const workingTime = typeof searchParams.workingTime === 'string' ? searchParams.workingTime : undefined;
  const restTime = typeof searchParams.restTime === 'string' ? searchParams.restTime : undefined;
  const startTime = typeof searchParams.startTime === 'string' ? searchParams.startTime : undefined;

  if (!workingTime || !restTime) {
    return (
      <div>
        <h1>Whoops, looks like there's some missing parameters! Go back to the main page to generate this link with proper parameters</h1>
      </div>
    );
  }

  return <PomodoroClient workingTime={workingTime} restTime={restTime} startTime={startTime || ''} />;
}
