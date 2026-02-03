export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0m';
  }
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
