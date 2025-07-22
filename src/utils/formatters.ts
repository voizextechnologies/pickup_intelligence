/**
 * Formats a number to display with a maximum of 3 decimal places
 * Removes trailing zeros for cleaner display
 * @param value - The number to format
 * @param maxDecimals - Maximum number of decimal places (default: 3)
 * @returns Formatted string
 */
export const formatCredits = (value: number, maxDecimals: number = 3): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  
  // Round to the specified decimal places and remove trailing zeros
  return parseFloat(value.toFixed(maxDecimals)).toString();
};

/**
 * Formats currency values with proper decimal places
 * @param value - The number to format
 * @param currency - Currency symbol (default: '₹')
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: string = '₹'): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return `${currency}0`;
  }
  
  return `${currency}${parseFloat(value.toFixed(2)).toLocaleString()}`;
};

/**
 * Formats percentage values
 * @param value - The number to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  
  return `${parseFloat(value.toFixed(decimals))}%`;
};