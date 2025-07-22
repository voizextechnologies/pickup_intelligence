/**
 * Format a number to a specified number of decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted number as string
 */
export const formatCredits = (value: number, decimals: number = 3): string => {
  return Number(value).toFixed(decimals);
};

/**
 * Format a number for display, removing unnecessary trailing zeros
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted number as string
 */
export const formatCreditsClean = (value: number, decimals: number = 3): string => {
  return parseFloat(Number(value).toFixed(decimals)).toString();
};