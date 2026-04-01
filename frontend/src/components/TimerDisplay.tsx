interface TimerDisplayProps {
  remainingSeconds: number;
}


export default function TimerDisplay({ remainingSeconds }: TimerDisplayProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">Timer</p>
      <h2>Round Timer</h2>
      <p aria-live="polite">{remainingSeconds}s remaining</p>
    </section>
  );
}
