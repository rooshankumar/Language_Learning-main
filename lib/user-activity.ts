
'use client';

// Function to update the user's last active timestamp
export async function updateLastActive() {
  try {
    await fetch('/api/user/last-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to update last active status:', error);
  }
}

// Format the last seen time in a human-readable way
export function formatLastSeen(lastSeenDate: Date | string | null | undefined): string {
  if (!lastSeenDate) return 'Never';
  
  const date = new Date(lastSeenDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    // Format as date for older times
    return date.toLocaleDateString();
  }
}
