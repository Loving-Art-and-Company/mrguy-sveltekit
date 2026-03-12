import { describe, expect, it } from 'vitest';
import { createLeadSinkSignature } from './leadSink';
import { verifyLeadSinkRequest } from './googleSheetsLeadSink';

describe('googleSheetsLeadSink', () => {
  it('verifies a valid signed request', () => {
    const timestamp = new Date().toISOString();
    const rawBody = '{"leadId":"abc123"}';
    const secret = 'top-secret';
    const signature = createLeadSinkSignature(secret, timestamp, rawBody);

    expect(
      verifyLeadSinkRequest({
        secret,
        timestamp,
        signature,
        rawBody,
      }),
    ).toBe(true);
  });
});
