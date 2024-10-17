import { CalendarAvailability, CalendarSlot, Weekday } from '../types';

/**
 * Check if a given time slot is available based on the specified availability.
 *
 * @param availability - The calendar availability defining when slots can be
 *   booked.
 * @param slot - The time slot to be checked for availability.
 * @returns True if the slot is available, otherwise false.
 */
export const isSlotAvailable = (availability: CalendarAvailability, slot: CalendarSlot): boolean => {
  const slotDate = slot.start;
  const slotWeekday = getSlotWeekday(slotDate);

  const availableEntry = findAvailabilityForWeekday(availability, slotWeekday);
  if (!availableEntry) return false;

  const [startAvailable, endAvailable] = getAvailabilityTimeRange(slotDate, availableEntry.range);

  const slotEnd = calculateSlotEndTime(slot.start, slot.durationM);

  return isSlotWithinAvailableRange(slot.start, slotEnd, startAvailable, endAvailable);
};

/**
 * Get the weekday of the given date.
 *
 * @param date - The date for which the weekday is to be determined.
 * @returns The weekday as a Weekday enum.
 */
const getSlotWeekday = (date: Date): Weekday => {
  return date.getUTCDay() as Weekday;
};

/**
 * Find the availability entry for a specific weekday.
 *
 * @param availability - The calendar availability.
 * @param weekday - The weekday to search for.
 * @returns The availability entry for the specified weekday, or undefined if
 *   not found.
 */
const findAvailabilityForWeekday = (availability: CalendarAvailability, weekday: Weekday) => {
  return availability.include.find(entry => entry.weekday === weekday);
};

/**
 * Get the start and end time of the availability range for a specific date.
 *
 * @param date - The date for which the availability range is to be calculated.
 * @param range - The time range defining availability.
 * @returns An array containing the start and end availability dates.
 */
const getAvailabilityTimeRange = (date: Date, range: { hours: number; minutes: number }[]) => {
  const startAvailable = new Date(date);
  startAvailable.setUTCHours(range[0].hours, range[0].minutes, 0, 0);

  const endAvailable = new Date(date);
  endAvailable.setUTCHours(range[1].hours, range[1].minutes, 0, 0);

  return [startAvailable, endAvailable];
};

/**
 * Calculate the end time of the given slot based on its start time and
 * duration.
 *
 * @param start - The start date of the slot.
 * @param durationM - The duration of the slot in minutes.
 * @returns The end date of the slot.
 */
const calculateSlotEndTime = (start: Date, durationM: number): Date => {
  const endTime = new Date(start);
  endTime.setMinutes(endTime.getMinutes() + durationM);
  return endTime;
};

/**
 * Check if the slot is within the available range.
 *
 * @param slotStart - The start date of the slot.
 * @param slotEnd - The end date of the slot.
 * @param startAvailable - The start of the available range.
 * @param endAvailable - The end of the available range.
 * @returns True if the slot is within the available range, otherwise false.
 */
const isSlotWithinAvailableRange = (
  slotStart: Date,
  slotEnd: Date,
  startAvailable: Date,
  endAvailable: Date,
): boolean => {
  return slotStart >= startAvailable && slotEnd <= endAvailable;
};
