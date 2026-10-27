import { describe, expect, it } from 'vitest';
import { adminDateWindow } from '../adminDates';

describe('admin date filters', () => {
  it('uses Vietnam midnight across the UTC year boundary', () => {
    expect(adminDateWindow('today', new Date('2026-12-31T18:00:00Z'))).toEqual({start:'2026-12-31T17:00:00.000Z',end:'2027-01-01T17:00:00.000Z'});
    expect(adminDateWindow('this_month', new Date('2026-12-31T18:00:00Z'))).toEqual({start:'2026-12-31T17:00:00.000Z',end:'2027-01-31T17:00:00.000Z'});
  });
  it('covers whole calendar days and leaves all-time unbounded', () => {
    const now = new Date('2026-10-26T06:30:00Z');
    expect(adminDateWindow('7days',now)).toEqual({start:'2026-10-19T17:00:00.000Z',end:'2026-10-26T17:00:00.000Z'});
    const window = adminDateWindow('30days',now)!;
    expect(Date.parse(window.end)-Date.parse(window.start)).toBe(30*86400000);
    expect(adminDateWindow('all',now)).toBeNull();
  });
});
