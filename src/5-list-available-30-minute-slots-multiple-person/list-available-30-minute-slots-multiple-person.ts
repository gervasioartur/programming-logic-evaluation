import { CalendarAvailability, CalendarEvent, CalendarSlot, Weekday } from '../types';

export const listAvailable30MinuteSlotsMultiplePerson = (
  attendees: Array<{
    availability: CalendarAvailability;
    events: Array<CalendarEvent>;
  }>,
  range: [Date, Date],
): Array<CalendarSlot> => {
  const [startRange, endRange] = range;
  const availableSlots: CalendarSlot[] = [];

  // Iterate over each day within the given date range
  for (
    let currentDate = new Date(startRange);
    currentDate <= endRange;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const currentWeekday = currentDate.getUTCDay() as Weekday;

    // Find the available time ranges for all attendees on the current day
    const commonAvailableRanges = attendees
      .map(({ availability }) => availability.include.find(day => day.weekday === currentWeekday)?.range)
      .filter(Boolean) as { hours: number; minutes: number }[][];

    // If not all attendees have availability for this day, skip it
    if (commonAvailableRanges.length !== attendees.length) continue;

    // Find the common available range between all attendees for the current day
    const commonRange = commonAvailableRanges.reduce((acc, curr) => {
      return acc ? intersectRanges(acc, curr) : curr;
    });

    if (!commonRange) continue;

    // Check for available 30-minute slots within the common range
    for (let i = 0; i < commonRange.length - 1; i += 2) {
      const rangeStart = commonRange[i];
      const rangeEnd = commonRange[i + 1];

      let currentSlotStart = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          rangeStart.hours,
          rangeStart.minutes,
        ),
      );

      const rangeEndTime = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          rangeEnd.hours,
          rangeEnd.minutes,
        ),
      );

      // Iterate through each 30-minute slot within the time range
      while (currentSlotStart < rangeEndTime && currentSlotStart < endRange) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + 30 * 60 * 1000);

        // Check if all attendees are available during this slot
        const isAvailableForAll = attendees.every(({ events }) =>
          events.every(event => {
            const bufferBefore = event.buffer?.before || 0;
            const bufferAfter = event.buffer?.after || 0;
            const eventStart = new Date(event.start.getTime() - bufferBefore * 60 * 1000);
            const eventEnd = new Date(event.end.getTime() + bufferAfter * 60 * 1000);

            // Ensure the slot does not overlap with any event
            return currentSlotEnd <= eventStart || currentSlotStart >= eventEnd;
          }),
        );

        // Add the slot to the list if all attendees are available
        if (isAvailableForAll) {
          availableSlots.push({ start: new Date(currentSlotStart), durationM: 30 });
        }

        currentSlotStart = currentSlotEnd; // Move to the next 30-minute slot
      }
    }
  }

  return availableSlots;
};

// Helper function to find the intersection of two time ranges
function intersectRanges(rangeA: { hours: number; minutes: number }[], rangeB: { hours: number; minutes: number }[]) {
  const result: { hours: number; minutes: number }[] = [];

  let i = 0,
    j = 0;
  while (i < rangeA.length && j < rangeB.length) {
    const startA = rangeA[i];
    const endA = rangeA[i + 1];
    const startB = rangeB[j];
    const endB = rangeB[j + 1];

    // Determine the maximum start time and the minimum end time
    const maxStart = startA.hours * 60 + startA.minutes > startB.hours * 60 + startB.minutes ? startA : startB;
    const minEnd = endA.hours * 60 + endA.minutes < endB.hours * 60 + endB.minutes ? endA : endB;

    // If the ranges overlap, add the common part to the result
    if (maxStart.hours * 60 + maxStart.minutes < minEnd.hours * 60 + minEnd.minutes) {
      result.push(maxStart, minEnd);
    }

    // Move to the next interval
    if (endA.hours * 60 + endA.minutes < endB.hours * 60 + endB.minutes) {
      i += 2;
    } else {
      j += 2;
    }
  }

  return result;
}
