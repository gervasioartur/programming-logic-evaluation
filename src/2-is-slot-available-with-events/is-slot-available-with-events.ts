import { CalendarAvailability, CalendarEvent, CalendarSlot, Weekday } from '../types';

/**
 * Check if a given time slot is available based on the specified availability
 * and existing events.
 *
 * @param availability - The calendar availability defining when slots can be
 *   booked.
 * @param events - The array of existing calendar events.
 * @param slot - The time slot to be checked for availability.
 * @returns True if the slot is available, otherwise false.
 */
export const isSlotAvailableWithEvents = (
  availability: CalendarAvailability,
  events: Array<Omit<CalendarEvent, 'buffer'>>,
  slot: CalendarSlot,
): boolean => {
  const slotStart = slot.start;
  const slotEnd = calculateSlotEndTime(slotStart, slot.durationM);

  if (!isSlotWithinAvailability(slotStart, slotEnd, availability)) {
    return false; // Slot is outside the availability range
  }

  if (isSlotConflictedWithEvents(slotStart, slotEnd, events)) {
    return false; // Slot conflicts with existing events
  }

  return true; // Slot is available
};

/**
 * Calculate the end time of a given slot based on its start time and duration.
 *
 * @param start - The start date of the slot.
 * @param durationM - The duration of the slot in minutes.
 * @returns The end date of the slot.
 */
const calculateSlotEndTime = (start: Date, durationM: number): Date => {
  return new Date(start.getTime() + durationM * 60000); // Calculates the slot end time
};

/**
 * Check if the slot is within the doctor's availability.
 *
 * @param slotStart - The start date of the slot.
 * @param slotEnd - The end date of the slot.
 * @param availability - The calendar availability.
 * @returns True if the slot is within the availability, otherwise false.
 */
const isSlotWithinAvailability = (slotStart: Date, slotEnd: Date, availability: CalendarAvailability): boolean => {
  const slotWeekday = slotStart.getUTCDay() as Weekday; // Get the weekday in UTC
  const availabilityForDay = availability.include.find(avail => avail.weekday === slotWeekday);

  if (!availabilityForDay) {
    return false; // No availability found for this weekday
  }

  const { range } = availabilityForDay;
  const [startRange, endRange] = range;

  const availableStart = new Date(slotStart);
  availableStart.setUTCHours(startRange.hours, startRange.minutes, 0, 0);

  const availableEnd = new Date(slotStart);
  availableEnd.setUTCHours(endRange.hours, endRange.minutes, 0, 0);

  return slotStart >= availableStart && slotEnd <= availableEnd; // Check if the slot is within available range
};

/**
 * Check if the requested slot conflicts with any existing events.
 *
 * @param slotStart - The start date of the requested slot.
 * @param slotEnd - The end date of the requested slot.
 * @param events - The array of existing calendar events.
 * @returns True if there is a conflict, otherwise false.
 */
const isSlotConflictedWithEvents = (
  slotStart: Date,
  slotEnd: Date,
  events: Array<Omit<CalendarEvent, 'buffer'>>,
): boolean => {
  return events.some(event => {
    const eventStart = event.start;
    const eventEnd = event.end;

    // Check if the requested slot overlaps with an existing event
    return slotStart < eventEnd && slotEnd > eventStart;
  });
};
