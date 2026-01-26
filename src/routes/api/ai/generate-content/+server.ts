import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BUSINESS_CONTEXT = `
You are a social media content creator for "Mr. Guy Mobile Detail", a professional mobile car detailing service in South Florida (West Broward area). 

Business details:
- Mobile detailing service that comes to customers
- Services: Exterior wash, interior cleaning, full detail, ceramic coating
- Target audience: Busy professionals, car enthusiasts, luxury car owners
- Brand voice: Professional but approachable, quality-focused
- Location: West Broward, South Florida
- Phone: Available for booking

The business is known for convenience (they come to you) and quality work.
`;

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	const { session } = await locals.safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const { postType, tone, topic } = await request.json();

	if (!topic || !postType || !tone) {
		throw error(400, 'Missing required fields');
	}

	const toneInstructions: Record<string, string> = {
		professional: 'Use a professional, trustworthy tone. Be informative and authoritative.',
		friendly: 'Use a warm, friendly, conversational tone. Be approachable and relatable.',
		enthusiastic: 'Use an energetic, excited tone. Show passion for car care!',
		luxury: 'Use an elegant, premium tone. Emphasize quality, exclusivity, and attention to detail.'
	};

	const postTypeInstructions: Record<string, string> = {
		promo: 'Create a promotional post about a special offer, discount, or limited-time deal.',
		tip: 'Share a helpful car care tip that provides value to followers.',
		'before-after': 'Describe a dramatic transformation result from a recent detail job.',
		testimonial: 'Create a post highlighting positive customer feedback (make it realistic but fictional).',
		seasonal: 'Create content related to current season or upcoming holiday, tied to car care.'
	};

	const prompt = `${BUSINESS_CONTEXT}

Create a social media post with the following specifications:

POST TYPE: ${postTypeInstructions[postType] || postType}
TONE: ${toneInstructions[tone] || tone}
TOPIC/IDEA: ${topic}

Requirements:
- Keep it concise (under 280 characters for Twitter compatibility, or provide both short and long versions)
- Include relevant hashtags (3-5 hashtags)
- Include a call-to-action when appropriate
- Make it engaging and shareable
- Do NOT use emojis excessively (1-3 max)

Provide ONLY the social media post content, ready to copy and paste. No explanations or preamble.`;

	// Use Groq API (generous free tier)
	const GROQ_API_KEY = env.GROQ_API_KEY;
	if (!GROQ_API_KEY) {
		throw error(503, 'AI service not configured. Please add GROQ_API_KEY.');
	}

	try {
		const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GROQ_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'llama-3.3-70b-versatile',
				messages: [
					{ role: 'user', content: prompt }
				],
				max_tokens: 500,
				temperature: 0.7
			})
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			console.error('Groq API error:', err);
			throw error(500, err.error?.message || 'AI request failed');
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || '';

		return json({ content: text });
	} catch (e) {
		console.error('AI generation error:', e);
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Failed to generate content');
	}
};
