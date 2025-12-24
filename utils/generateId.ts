/**
 * Generates a unique identifier string.
 * Uses a random alphanumeric string of 9 characters.
 * @returns A unique identifier string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * Truncates an ID for display purposes.
 * @param id The full ID string
 * @param length Number of characters to show (default: 4)
 * @returns Truncated ID string
 */
export const truncateId = (id: string, length = 4): string => {
  return id.substring(0, length);
};
