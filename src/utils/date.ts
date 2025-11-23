/**
 * Parse a date string in DD-MM-YYYY HH:mm A format to a Date object
 * @param dateString - Date string in format "DD-MM-YYYY HH:mm A" (e.g., "23-11-2025 03:10 PM")
 * @returns Date object
 */
export function parseCustomDate(dateString: string | Date): Date {
  // If already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }

  // If not a string, try to convert it
  if (typeof dateString !== 'string') {
    console.warn(`Invalid date type, returning current date:`, dateString);
    return new Date();
  }

  // Skip template placeholders
  if (dateString.includes('{{') || dateString.includes('}}')) {
    return new Date();
  }

  // Parse DD-MM-YYYY HH:mm A format
  const regex = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
  const match = dateString.match(regex);

  if (!match) {
    // Fallback to standard Date parsing
    console.warn(`Date format not recognized, falling back to standard parsing: ${dateString}`);
    const fallbackDate = new Date(dateString);
    // If the fallback fails, return current date
    if (isNaN(fallbackDate.getTime())) {
      return new Date();
    }
    return fallbackDate;
  }

  const [, day, month, year, hour, minute, period] = match;
  
  // Convert to 24-hour format
  let hours = parseInt(hour, 10);
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  // Create date object (month is 0-indexed in JavaScript)
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    hours,
    parseInt(minute, 10)
  );
}

/**
 * Format a date to show only the date part (e.g., "Saturday, 23 November 2025")
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDateOnly(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Format a date for display in card view (shorter format)
 * @param date - Date object
 * @returns Formatted date string (e.g., "Nov 23, 2025")
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date for blog post header (longer format)
 * @param date - Date object
 * @returns Formatted date string (e.g., "November 23, 2025")
 */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
