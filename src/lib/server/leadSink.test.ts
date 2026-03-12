import { describe, expect, it } from 'vitest';
import { createLeadSinkSignature } from './leadSink';

describe('leadSink', () => {
  it('creates stable signatures for the same payload', () => {
    const signature = createLeadSinkSignature(
      'secret-key',
      '2026-03-08T12:00:00.000Z',
      '{"leadId":"abc123"}',
    );

    expect(signature).toBe('c6ec294d9e8a09f571aa0ae35c92558d6b7dcd7cee98c10a53fc0d420137bee6');
  });
});
