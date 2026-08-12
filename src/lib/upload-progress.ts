/**
 * Uploads go through Next.js Server Actions (a plain async function call,
 * not an XHR/fetch request we control), so there's no real "bytes sent"
 * event to hook into. To still give the user a sense of motion during the
 * network round trip, `withSimulatedProgress` ticks a percentage upward on
 * an interval while the action is in flight, then snaps to 100 the instant
 * it resolves. It's an honest approximation, not a measured progress value.
 */
export async function withSimulatedProgress<T>(
  task: () => Promise<T>,
  onProgress: (percent: number) => void,
  { intervalMs = 150, ceiling = 92 }: { intervalMs?: number; ceiling?: number } = {},
): Promise<T> {
  let percent = 0;
  onProgress(percent);

  const timer = setInterval(() => {
    // Approach the ceiling asymptotically so it never looks "stuck" at a
    // fixed number while genuinely slow uploads are still in progress.
    percent += (ceiling - percent) * 0.15;
    onProgress(Math.round(percent));
  }, intervalMs);

  try {
    const result = await task();
    return result;
  } finally {
    clearInterval(timer);
    onProgress(100);
  }
}
