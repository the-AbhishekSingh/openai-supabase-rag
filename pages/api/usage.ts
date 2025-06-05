import type { NextApiRequest, NextApiResponse } from 'next';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

async function fetchOpenAIUsage(start: string, end: string) {
  const res = await fetch(
    `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error('Failed to fetch usage');
  return res.json();
}

async function fetchOpenAISubscription() {
  const res = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch subscription');
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get usage for the current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = now.toISOString().slice(0, 10);

    const [usage, subscription] = await Promise.all([
      fetchOpenAIUsage(start, end),
      fetchOpenAISubscription(),
    ]);

    res.status(200).json({ usage, subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch OpenAI usage' });
  }
} 