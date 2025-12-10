/**
 * Parse a date string in DD-MM-YYYY HH:mm A format to a Date object
 * @param dateString - Date string in format "DD-MM-YYYY HH:mm A" (e.g., "23-11-2025 03:10 PM")
 * @returns Date object (interprets time as IST/UTC+5:30)
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

  // Create date object in IST (UTC+5:30)
  // First create the date string in ISO format with IST timezone offset
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minute.padStart(2, '0');

  // IST is UTC+5:30, so we use +05:30 offset
  const isoString = `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00+05:30`;
  return new Date(isoString);
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

/**
 * Format a date in compact format (e.g., "15 Jan 2024")
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDateCompact(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Calculate word count from markdown content
 * @param content - Markdown content string
 * @returns Word count
 */
export function getWordCount(content: string): number {
  if (!content) return 0;

  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');

  // Remove code blocks
  const withoutCodeBlocks = withoutFrontmatter.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  const withoutInlineCode = withoutCodeBlocks.replace(/`[^`]+`/g, '');

  // Remove markdown links but keep the text
  const withoutLinks = withoutInlineCode.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove images
  const withoutImages = withoutLinks.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');

  // Remove HTML tags
  const withoutHtml = withoutImages.replace(/<[^>]+>/g, '');

  // Remove markdown formatting characters
  const withoutFormatting = withoutHtml
    .replace(/[#*_~`]/g, '')
    .replace(/^\s*[-+*]\s+/gm, '') // list markers
    .replace(/^\s*\d+\.\s+/gm, ''); // numbered list markers

  // Split by whitespace and filter out empty strings
  const words = withoutFormatting
    .split(/\s+/)
    .filter(word => word.length > 0);

  return words.length;
}

/**
 * Format word count for display (e.g., "500W" for 500 words)
 * @param count - Word count number
 * @returns Formatted string
 */
export function formatWordCount(count: number): string {
  return `${count}W`;
}

/**
 * Calculate estimated reading time based on word count
 * @param wordCount - Number of words
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Calculate age from birth date
 * @param birthDate - Birth date string in YYYY-MM-DD format
 * @returns Current age in years
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago";
}
