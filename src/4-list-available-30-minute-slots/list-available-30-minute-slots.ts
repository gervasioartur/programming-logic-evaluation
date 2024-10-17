import { CalendarAvailability, CalendarEvent } from '../types';

export function listAvailable30MinuteSlots(
  availability: CalendarAvailability,
  events: CalendarEvent[],
  [startRange, endRange]: [Date, Date],
) {
  const availableSlots: { start: Date; durationM: number }[] = [];

  // Loop through each day in the provided range
  for (
    let currentDate = new Date(startRange);
    currentDate <= endRange;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const currentWeekday = currentDate.getUTCDay(); // Get the current weekday

    // Check if the current weekday is in the availability
    const dayAvailability = availability.include.find(day => day.weekday === currentWeekday);
    if (!dayAvailability) continue; // If no availability for that day, continue

    // Loop through the available ranges for the day
    dayAvailability.range.forEach(range => {
      let currentSlotStart = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          range.hours,
          range.minutes,
        ),
      );

      // Check if the start of the slot is before the end of the range
      const rangeEndTime = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          range.hours + 30,
          range.minutes,
        ),
      );

      while (currentSlotStart < rangeEndTime) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + 30 * 60 * 1000);

        // Ensure the slot is within the date range provided
        if (currentSlotStart < startRange || currentSlotEnd > endRange) {
          break;
        }

        // Check for conflicts with events
        const hasConflict = events.some(event => {
          const bufferBefore = event.buffer?.before || 0;
          const bufferAfter = event.buffer?.after || 0;

          const eventStart = new Date(event.start.getTime() - bufferBefore * 60 * 1000);
          const eventEnd = new Date(event.end.getTime() + bufferAfter * 60 * 1000);

          return (
            (currentSlotStart >= eventStart && currentSlotStart < eventEnd) ||
            (currentSlotEnd > eventStart && currentSlotEnd <= eventEnd) ||
            (currentSlotStart <= eventStart && currentSlotEnd >= eventEnd)
          );
        });

        // If no conflict, add the slot
        if (!hasConflict) {
          availableSlots.push({ start: new Date(currentSlotStart), durationM: 30 });
        }

        // Move to the next slot (30-minute intervals)
        currentSlotStart = currentSlotEnd;
      }
    });
  }

  return availableSlots;
}
