
'use client';

/**
 * Fetches user details from the API
 * @param userId - The ID of the user to fetch
 * @returns The user details or a default object if fetch fails
 */
export async function getUserDetails(userId: string) {
  if (!userId) {
    return { name: "Unknown User", status: "Offline", isOnline: false };
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching user:", errorData);
      throw new Error(errorData.error || "Failed to fetch user");
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { 
      name: "Unknown User", 
      status: "Offline", 
      isOnline: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetches multiple users' details at once
 * @param userIds - Array of user IDs to fetch
 * @returns Array of user details
 */
export async function getMultipleUserDetails(userIds: string[]) {
  if (!userIds || !userIds.length) {
    return [];
  }
  
  const userPromises = userIds.map(id => getUserDetails(id));
  const users = await Promise.all(userPromises);
  
  return users;
}
