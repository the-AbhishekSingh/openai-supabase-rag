import type { NextApiRequest, NextApiResponse } from 'next';
import { answerQuestion } from '../../src/rag';
import Cors from 'cors';

// Initialize the cors middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  origin: '*', // Allow all origins
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');

  try {
    // Run the CORS middleware
    await runMiddleware(req, res, cors);

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        method: req.method,
        allowedMethods: ['POST']
      });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: 'Request body must be a JSON object'
      });
    }

    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid question',
        details: 'Question must be a non-empty string'
      });
    }

    // Process the question
    const answer = await answerQuestion(question);
    
    // Ensure answer is a string
    if (typeof answer !== 'string') {
      return res.status(500).json({ 
        error: 'Invalid response format',
        details: 'Answer must be a string'
      });
    }

    // Send successful response
    return res.status(200).json({ answer });

  } catch (err) {
    console.error('Error in API route:', err);
    
    // Ensure error response is properly formatted
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 