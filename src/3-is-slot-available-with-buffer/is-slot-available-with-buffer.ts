import { CalendarAvailability, CalendarEvent, CalendarSlot, Weekday } from '../types';

/**
 * Check if a given time slot is available considering the specified
 * availability, events, and buffer times.
 *
 * @param availability - The calendar availability defining when slots can be
 *   booked.
 * @param events - The array of calendar events, which may have buffer times.
 * @param slot - The time slot to be checked for availability.
 * @returns True if the slot is available, otherwise false.
 */
export const isSlotAvailableWithBuffer = (
  availability: CalendarAvailability,
  events: Array<CalendarEvent>,
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
  return availability.include.some(entry => {
    const isCorrectWeekday = entry.weekday === (slotStart.getUTCDay() as Weekday); // Get the weekday in UTC
    return isCorrectWeekday && isSlotInRange(slotStart, slotEnd, entry.range);
  });
};

/**
 * Check if the slot is within the specified range of the availability entry.
 *
 * @param slotStart - The start date of the slot.
 * @param slotEnd - The end date of the slot.
 * @param ranges - The array of time ranges for availability.
 * @returns True if the slot is within one of the ranges, otherwise false.
 */
const isSlotInRange = (slotStart: Date, slotEnd: Date, ranges: Array<{ hours: number; minutes: number }>): boolean => {
  return ranges.some(range => {
    const rangeStart = new Date(slotStart);
    rangeStart.setHours(range.hours, range.minutes, 0, 0);
    const rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60 * 1000); // Next day's start

    return slotStart >= rangeStart && slotEnd <= rangeEnd; // Check if the slot is within the range
  });
};

/**
 * Check if the requested slot conflicts with any existing events considering
 * buffer times.
 *
 * @param slotStart - The start date of the requested slot.
 * @param slotEnd - The end date of the requested slot.
 * @param events - The array of existing calendar events.
 * @returns True if there is a conflict, otherwise false.
 */
const isSlotConflictedWithEvents = (slotStart: Date, slotEnd: Date, events: Array<CalendarEvent>): boolean => {
  return events.some(event => {
    const eventStartWithBuffer = calculateEventStartWithBuffer(event);
    const eventEndWithBuffer = calculateEventEndWithBuffer(event);

    // Check if the requested slot overlaps with an existing event including buffer
    return slotStart < eventEndWithBuffer && slotEnd > eventStartWithBuffer;
  });
};

/**
 * Calculate the start time of an event considering the buffer time before the
 * event.
 *
 * @param event - The calendar event.
 * @returns The adjusted start date of the event with buffer.
 */
const calculateEventStartWithBuffer = (event: CalendarEvent): Date => {
  const bufferBefore = event.buffer?.before || 0;
  return new Date(event.start.getTime() - bufferBefore * 60 * 1000);
};

/**
 * Calculate the end time of an event considering the buffer time after the
 * event.
 *
 * @param event - The calendar event.
 * @returns The adjusted end date of the event with buffer.
 */
const calculateEventEndWithBuffer = (event: CalendarEvent): Date => {
  const bufferAfter = event.buffer?.after || 0;
  return new Date(event.end.getTime() + bufferAfter * 60 * 1000);
};
