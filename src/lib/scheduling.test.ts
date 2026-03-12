import { describe, expect, it } from 'vitest';
import {
  BLOCKED_SLOT_MINUTES,
  buildAvailabilitySlots,
  buildBookableTimeSlots,
  findConflictingHold,
  hasScheduleOverlap,
  isBookableDate,
} from './scheduling';

describe('scheduling policy', () => {
  it(`blocks overlapping starts inside the ${BLOCKED_SLOT_MINUTES}-minute window`, () => {
    expect(hasScheduleOverlap('14:00', '15:00')).toBe(true);
    expect(hasScheduleOverlap('14:00', '16:00')).toBe(true);
  });

  it('allows back-to-back starts at the blocked boundary', () => {
    expect(hasScheduleOverlap('14:00', '16:30')).toBe(false);
    expect(hasScheduleOverlap('16:30', '14:00')).toBe(false);
  });

  it('returns weekday slots from 2 PM through 6 PM', () => {
    expect(buildBookableTimeSlots('2026-03-11').map((slot) => slot.value)).toEqual([
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ]);
  });

  it('returns Saturday slots from 9 AM through 6 PM', () => {
    expect(buildBookableTimeSlots('2026-03-14').map((slot) => slot.value)).toEqual([
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ]);
  });

  it('treats Sundays as closed', () => {
    expect(isBookableDate('2026-03-15')).toBe(false);
    expect(buildBookableTimeSlots('2026-03-15')).toEqual([]);
  });

  it('treats pending, confirmed, and rescheduled bookings as blocking', () => {
    const pendingConflict = findConflictingHold([{ id: 'a', time: '14:00', status: 'pending' }], '15:00');
    const confirmedConflict = findConflictingHold([{ id: 'b', time: '14:00', status: 'confirmed' }], '15:00');
    const rescheduledConflict = findConflictingHold([{ id: 'c', time: '14:00', status: 'rescheduled' }], '15:00');

    expect(pendingConflict?.id).toBe('a');
    expect(confirmedConflict?.id).toBe('b');
    expect(rescheduledConflict?.id).toBe('c');
  });

  it('ignores cancelled and completed bookings for availability', () => {
    expect(findConflictingHold([{ id: 'a', time: '14:00', status: 'cancelled' }], '15:00')).toBeNull();
    expect(findConflictingHold([{ id: 'b', time: '14:00', status: 'completed' }], '15:00')).toBeNull();
  });

  it('marks only valid weekday slots unavailable when they overlap blocking holds', () => {
    const slots = buildAvailabilitySlots(
      [
        { id: 'pending-1', time: '14:00', status: 'pending' },
        { id: 'confirmed-1', time: '17:00', status: 'confirmed' },
        { id: 'done-1', time: '15:00', status: 'completed' },
      ],
      '2026-03-11'
    );

    expect(slots.find((slot) => slot.value === '14:00')?.available).toBe(false);
    expect(slots.find((slot) => slot.value === '15:00')?.available).toBe(false);
    expect(slots.find((slot) => slot.value === '16:00')?.available).toBe(false);
    expect(slots.find((slot) => slot.value === '17:00')?.available).toBe(false);
    expect(slots.find((slot) => slot.value === '18:00')?.available).toBe(false);
    expect(slots).toHaveLength(5);
  });

  it('returns no availability slots on Sundays', () => {
    expect(buildAvailabilitySlots([], '2026-03-15')).toEqual([]);
  });
});
