/**
 * Formatting utilities for the dashboard
 */

/**
 * Format a timestamp to a human-readable relative time string
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Human-readable time string (e.g., "2 minutes ago", "1 hour ago")
 */
export function formatTimestamp(timestamp) {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Handle future dates
    if (diffMs < 0) {
      return 'In the future';
    }
    
    // Less than a minute
    if (diffSeconds < 60) {
      return diffSeconds === 1 ? '1 second ago' : `${diffSeconds} seconds ago`;
    }
    
    // Less than an hour
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    
    // Less than a day
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    
    // Less than a week
    if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
    
    // Less than a month
    if (diffDays < 30) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    }
    
    // Less than a year
    if (diffDays < 365) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    }
    
    // Years
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format a confidence score as a percentage with one decimal place
 * @param {number} confidence - The confidence score (0.0 to 1.0)
 * @returns {string} Formatted percentage string (e.g., "82.3%")
 */
export function formatConfidence(confidence) {
  // Handle invalid inputs
  if (typeof confidence !== 'number' || isNaN(confidence)) {
    return '0.0%';
  }
  
  // Clamp to valid range [0, 1]
  const clamped = Math.max(0, Math.min(1, confidence));
  
  // Convert to percentage with one decimal place
  const percentage = (clamped * 100).toFixed(1);
  
  return `${percentage}%`;
}
