import { getSql } from './db.mjs';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export async function getMarketingSnapshot() {
  const sql = getSql();

  try {
    const [reviewStats, gbpStats, recentDrafts] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
          COUNT(*) FILTER (WHERE review_received = true) AS received_count,
          COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS recent_count
        FROM marketing_review_requests
        WHERE brand_id = ${MRGUY_BRAND_ID}
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
          COUNT(*) FILTER (WHERE status = 'published') AS published_count,
          COUNT(*) FILTER (WHERE generated_at > now() - interval '7 days') AS recent_count
        FROM marketing_gbp_posts
        WHERE brand_id = ${MRGUY_BRAND_ID}
      `,
      sql`
        SELECT post_type, content
        FROM marketing_gbp_posts
        WHERE brand_id = ${MRGUY_BRAND_ID}
          AND status = 'draft'
        ORDER BY generated_at DESC
        LIMIT 3
      `,
    ]);

    const actions = [];
    const draftCount = Number(gbpStats[0]?.draft_count ?? 0);
    const reviewSent7d = Number(reviewStats[0]?.recent_count ?? 0);

    if (draftCount >= 5) {
      actions.push({
        severity: 'medium',
        message: `GBP post queue has ${draftCount} drafts waiting. Time to publish some.`,
      });
    }

    return {
      ok: true,
      status: 'ok',
      reviews: {
        sentTotal: Number(reviewStats[0]?.sent_count ?? 0),
        receivedTotal: Number(reviewStats[0]?.received_count ?? 0),
        sentLast7Days: reviewSent7d,
      },
      gbp: {
        drafts: draftCount,
        published: Number(gbpStats[0]?.published_count ?? 0),
        generatedLast7Days: Number(gbpStats[0]?.recent_count ?? 0),
        recentDrafts: recentDrafts.map(d => ({
          type: d.post_type,
          preview: d.content.slice(0, 60) + '...',
        })),
      },
      actions,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
      reviews: {},
      gbp: {},
      actions: [{
        severity: 'medium',
        message: `Marketing snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
