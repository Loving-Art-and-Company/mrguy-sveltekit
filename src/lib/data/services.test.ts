import { describe, expect, it } from 'vitest';
import { resolveServiceSelection } from './services';

describe('resolveServiceSelection', () => {
  it('resolves current homepage service ids', () => {
    expect(resolveServiceSelection('basic')).toEqual({
      id: 'basic',
      name: 'The "Quick Refresh"',
      priceHigh: 75,
    });
  });

  it('resolves legacy cached service ids from older homepage bundles', () => {
    expect(resolveServiceSelection('exterior_wash')).toEqual({
      id: 'exterior_wash',
      name: 'Exterior Wash',
      priceHigh: 47,
    });
  });

  it('returns null for unknown service ids', () => {
    expect(resolveServiceSelection('does_not_exist')).toBeNull();
  });
});
