import { getSql } from './db.mjs';
import { chatCompletion } from './llm.mjs';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';
const REVIEW_LINK = process.env.GBP_REVIEW_LINK?.trim() ?? 'https://g.page/r/CblCJYB4IplSEAI/review';

function fallbackReviewSms({ clientName, serviceName, city }) {
  const name = clientName?.split(' ')[0] ?? 'there';
  return `Hey ${name}, hope you're loving the ${serviceName.toLowerCase()}! If you have a sec, a quick review means the world to us and helps other ${city} drivers find Mr. Guy. ${REVIEW_LINK}`;
}

async function generateReviewMessage({ clientName, serviceName, city }) {
  const system = `You are the voice of Mr. Guy Mobile Detail — friendly, casual, and local to South Florida.
Write a short review request message asking for a Google review.
Rules:
- Use the customer's first name only
- Mention the service they got
- Mention the city if available
- Include the review link exactly as provided
- Do not use emojis
- Sign off casually, not corporate`;

  const user = `Customer: ${clientName}
Service: ${serviceName}
City: ${city ?? 'West Broward'}
Review link: ${REVIEW_LINK}

Write the review request now.`;

  const result = await chatCompletion({ system, user, model: 'gemini-2.0-flash', temperature: 0.6 });
  if (!result.ok) return result;

  let text = result.content.trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }
  if (!text.includes(REVIEW_LINK)) {
    text += `\n${REVIEW_LINK}`;
  }
  return { ok: true, status: 'ok', text };
}

export async function runReviewHarvester() {
  const sql = getSql();
  const actions = [];
  const sent = [];
  const skipped = [];
  const errors = [];
  let llmUsed = false;

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const rows = await sql`
      SELECT
        b.id AS "booking_id",
        b."clientName",
        b."serviceName",
        b.contact,
        b.date,
        b.status
      FROM bookings b
      WHERE b.brand_id = ${MRGUY_BRAND_ID}
        AND b.status = 'completed'
        AND b.date >= ${since.split('T')[0]}
        AND NOT EXISTS (
          SELECT 1 FROM marketing_review_requests r
          WHERE r.booking_id = b.id
        )
      ORDER BY b.date DESC, b.time DESC NULLS LAST
      LIMIT 10
    `;

    if (rows.length === 0) {
      return {
        ok: true,
        status: 'ok',
        processed: 0,
        sent: [],
        skipped: [],
        errors: [],
        llmUsed: false,
        actions: [],
      };
    }

    for (const row of rows) {
      const phone = row.contact?.trim();
      if (!phone || phone.length < 10) {
        skipped.push({ bookingId: row.booking_id, reason: 'invalid_phone' });
        continue;
      }

      const firstName = row.clientName?.split(' ')[0] ?? 'there';
      const city = 'West Broward'; // Could be inferred from notes/address in future

      let messageResult = await generateReviewMessage({
        clientName: firstName,
        serviceName: row.serviceName,
        city,
      });

      if (!messageResult.ok) {
        messageResult = {
          ok: true,
          status: 'fallback',
          text: fallbackReviewSms({ clientName: firstName, serviceName: row.serviceName, city }),
        };
      } else {
        llmUsed = true;
      }

      await sql`
        INSERT INTO marketing_review_requests (
          booking_id,
          brand_id,
          contact,
          message_body,
          status
        ) VALUES (
          ${row.booking_id},
          ${MRGUY_BRAND_ID},
          ${phone},
          ${messageResult.text},
          ${'draft'}
        )
      `;

      sent.push({ bookingId: row.booking_id, phone, mode: 'draft_logged' });
    }

    if (sent.length > 0) {
      actions.push({
        severity: 'low',
        message: `Review Harvester: sent/logged ${sent.length} review request(s).`,
      });
    }
    if (errors.length > 0) {
      actions.push({
        severity: 'medium',
        message: `Review Harvester: ${errors.length} error(s) — check logs.`,
      });
    }

    return {
      ok: true,
      status: 'ok',
      processed: rows.length,
      sent,
      skipped,
      errors,
      llmUsed,
      actions,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
      processed: 0,
      sent: [],
      skipped: [],
      errors: [{ reason: error instanceof Error ? error.message : String(error) }],
      llmUsed: false,
      actions: [{
        severity: 'high',
        message: `Review Harvester failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runReviewHarvester();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
