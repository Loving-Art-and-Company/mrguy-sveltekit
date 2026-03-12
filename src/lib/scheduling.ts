export const MINIMUM_SERVICE_MINUTES = 90;
export const TRAVEL_BUFFER_MINUTES = 60;
export const BLOCKED_SLOT_MINUTES = MINIMUM_SERVICE_MINUTES + TRAVEL_BUFFER_MINUTES;

export const WEEKDAY_BOOKABLE_START_HOUR = 14;
export const WEEKDAY_BOOKABLE_END_HOUR = 18;
export const SATURDAY_BOOKABLE_START_HOUR = 9;
export const SATURDAY_BOOKABLE_END_HOUR = 18;

export const BLOCKING_BOOKING_STATUSES = ['pending', 'confirmed', 'rescheduled'] as const;

export interface ScheduleHold {
  id?: string;
  time: string | null;
  status: string | null;
}

export interface TimeSlotOption {
  value: string;
  label: string;
}

export interface AvailabilitySlot extends TimeSlotOption {
  available: boolean;
}

interface BookableHours {
  startHour: number;
  endHour: number;
}

export function getBookableHoursForDate(dateInput: string | Date): BookableHours | null {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput}T12:00:00`) : new Date(dateInput);
  const day = date.getDay();

  if (day === 0) return null;
  if (day === 6) {
    return {
      startHour: SATURDAY_BOOKABLE_START_HOUR,
      endHour: SATURDAY_BOOKABLE_END_HOUR,
    };
  }

  return {
    startHour: WEEKDAY_BOOKABLE_START_HOUR,
    endHour: WEEKDAY_BOOKABLE_END_HOUR,
  };
}

export function isBookableDate(dateInput: string | Date): boolean {
  return getBookableHoursForDate(dateInput) !== null;
}

export function buildBookableDates(days = 30, start = new Date()): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];

  for (let offset = 1; offset <= days; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);

    if (date.getDay() === 0) continue;

    dates.push({
      value: formatLocalDate(date),
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    });
  }

  return dates;
}

export function buildBookableTimeSlots(dateInput: string | Date): TimeSlotOption[] {
  const hours = getBookableHoursForDate(dateInput);

  if (!hours) return [];

  return Array.from({ length: hours.endHour - hours.startHour + 1 }, (_, index) => {
    const hour = hours.startHour + index;
    return {
      value: `${String(hour).padStart(2, '0')}:00`,
      label: formatTimeLabel(`${String(hour).padStart(2, '0')}:00`),
    };
  });
}

export function formatTimeLabel(time: string): string {
  const [hours] = time.split(':');
  const hour = Number.parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function isBlockingBookingStatus(status: string | null | undefined): boolean {
  return Boolean(status && BLOCKING_BOOKING_STATUSES.includes(status as (typeof BLOCKING_BOOKING_STATUSES)[number]));
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function hasScheduleOverlap(existingTime: string, candidateTime: string): boolean {
  const existingStart = timeToMinutes(existingTime);
  const candidateStart = timeToMinutes(candidateTime);

  return candidateStart < existingStart + BLOCKED_SLOT_MINUTES
    && existingStart < candidateStart + BLOCKED_SLOT_MINUTES;
}

export function findConflictingHold(
  holds: ScheduleHold[],
  candidateTime: string,
  excludeBookingId?: string
): ScheduleHold | null {
  return holds.find((hold) => {
    if (!hold.time || !isBlockingBookingStatus(hold.status)) return false;
    if (excludeBookingId && hold.id === excludeBookingId) return false;
    return hasScheduleOverlap(hold.time, candidateTime);
  }) ?? null;
}

export function buildAvailabilitySlots(
  holds: ScheduleHold[],
  dateInput: string | Date,
  excludeBookingId?: string
): AvailabilitySlot[] {
  return buildBookableTimeSlots(dateInput).map((slot) => ({
    ...slot,
    available: !findConflictingHold(holds, slot.value, excludeBookingId),
  }));
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
