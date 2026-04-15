import { getSql } from './db.mjs';
import { chatCompletion } from './llm.mjs';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

function getFallbackPosts(context) {
  return {
    posts: [
      {
        type: 'story',
        title: 'Recent Transformation',
        body: `Another happy customer in West Broward! We just finished a full interior and exterior detail that left this ride looking showroom fresh. Whether it's daily dust or post-road-trip grime, Mr. Guy comes to you. Book your detail today: 954-804-4747`,
      },
      {
        type: 'offer',
        title: 'This Week in Weston',
        body: `We're detailing in Weston this week and have a few spots open. Skip the car wash line and let us handle the dirt at your home or office. Call or text 954-804-4747 to grab your spot before the weekend fills up.`,
      },
      {
        type: 'tip',
        title: 'Florida Sun Tip',
        body: `South Florida sun is no joke. If your dashboard is fading or your paint feels rough, it's time for a detail. Regular wax and interior UV protection can add years to your car's look. Questions? Call Mr. Guy at 954-804-4747.`,
      },
    ],
  };
}

async function generateGbpPosts(context) {
  const system = `You are the social media voice of Mr. Guy Mobile Detail — a friendly, expert mobile car detailing service in South Florida.
Generate 3 Google Business Profile post ideas for the week.

Post types to include:
1. BEFORE/AFTER story featuring a recent job
2. LOCAL OFFER or urgency post tied to a specific city
3. EDUCATIONAL TIP about car care in Florida heat/sun/salt

Each post should be:
- 120-200 words
- Include a clear CTA with the phone number 954-804-4747
- Sound local and authentic, not corporate
- Do not use emojis (GBP posts render them inconsistently)

Return ONLY a JSON object in this exact format:
{
  "posts": [
    {"type": "story", "title": "...", "body": "..."},
    {"type": "offer", "title": "...", "body": "..."},
    {"type": "tip", "title": "...", "body": "..."}
  ]
}`;

  const user = `Recent jobs context: ${context ?? 'General mobile detailing in Weston, Pembroke Pines, and Miramar.'}

Generate the 3 GBP posts as JSON.`;

  return chatCompletion({
    system,
    user,
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    jsonMode: true,
  });
}

export async function runGbpBot() {
  const sql = getSql();
  const actions = [];
  let llmUsed = false;

  try {
    const recentJobs = await sql`
      SELECT "clientName", "serviceName", date
      FROM bookings
      WHERE brand_id = ${MRGUY_BRAND_ID}
        AND status = 'completed'
      ORDER BY date DESC
      LIMIT 3
    `;

    const context = recentJobs.length > 0
      ? recentJobs.map(j => `${j.clientName?.split(' ')[0]} got ${j.serviceName} on ${j.date}`).join('; ')
      : 'General mobile detailing in Weston, Pembroke Pines, and Miramar.';

    let aiResult = await generateGbpPosts(context);
    let parsed;

    if (aiResult.ok) {
      try {
        parsed = JSON.parse(aiResult.content);
        llmUsed = true;
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      parsed = getFallbackPosts(context);
    }

    const posts = parsed.posts ?? [];
    let inserted = 0;

    for (const post of posts) {
      if (!post.body) continue;
      await sql`
        INSERT INTO marketing_gbp_posts (brand_id, post_type, content, status)
        VALUES (
          ${MRGUY_BRAND_ID},
          ${post.type ?? 'general'},
          ${post.body},
          'draft'
        )
      `;
      inserted++;
    }

    if (inserted > 0) {
      actions.push({
        severity: 'low',
        message: `GBP Bot generated ${inserted} new post draft(s)${llmUsed ? ' via AI' : ' (template fallback)'}.`,
      });
    }

    return {
      ok: true,
      status: 'ok',
      postsGenerated: inserted,
      posts: posts.map(p => p.body?.slice(0, 80) + '...'),
      llmUsed,
      actions,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
      postsGenerated: 0,
      llmUsed: false,
      actions: [{
        severity: 'high',
        message: `GBP Bot failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runGbpBot();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
