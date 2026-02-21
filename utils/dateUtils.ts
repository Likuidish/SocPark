// Utility functions for handling dates in Hawaii Time (GMT-10)

// Returns a Date object that represents the current time in Hawaii
// Note: The internal pointer is technically local system time but the values (hours, date) match Hawaii.
export const getHawaiiDate = (): Date => {
  const now = new Date();
  const hawaiiString = now.toLocaleString("en-US", { timeZone: "Pacific/Honolulu" });
  return new Date(hawaiiString);
};

// Returns YYYY-MM-DD string based on the Hawaii date object
export const getHawaiiISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formats a YYYY-MM-DD string for display (DD/MM/YYYY) without timezone shifts
export const formatDateForDisplay = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  // Appending T00:00:00Z forces UTC interpretation. 
  // Then we display it in UTC to ensure we see exactly what is in the string.
  // Alternatively, simpler: just parse the string parts.
  const [year, month, day] = isoDateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Calculates difference in days between two YYYY-MM-DD strings
export const getDaysDifference = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  // Force UTC interpretation for calculation
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffTime = Math.abs(utc2 - utc1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};
