export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalHourKey(date: Date = new Date()): string {
  const dateKey = getLocalDateKey(date);
  const hour = String(date.getHours()).padStart(2, '0');
  return `${dateKey}T${hour}`;
}

export function getDayOfWeekFromKey(hourKey: string): number {
  const [datePart] = hourKey.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function getHourFromKey(hourKey: string): number {
  const [, hourPart] = hourKey.split('T');
  return parseInt(hourPart, 10);
}

export function getDateFromHourKey(hourKey: string): string {
  return hourKey.split('T')[0];
}
