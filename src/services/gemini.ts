import { ComplaintClassification } from '../types/complaint';
import { classifyWithKeywords } from './fallbackClassifier';

/**
 * Classifies a complaint transcript using the server-side Gemini 3.8 Flash pipeline
 * with JSON response schema. Automatically falls back to the keyword classifier if the
 * server endpoint fails, network is unavailable, or quota is exceeded.
 */
export async function classifyComplaintWithGemini(transcript: string): Promise<ComplaintClassification> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    throw new Error('Complaint transcript is empty');
  }

  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: trimmed }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`[LokSeva AI] Server API call failed with status ${response.status}. Using keyword fallback.`);
      return classifyWithKeywords(trimmed);
    }

    const data = await response.json();
    if (data && data.classification && isValidClassification(data.classification)) {
      return data.classification;
    }

    console.warn('[LokSeva AI] Server response missing valid classification. Using keyword fallback.');
    return classifyWithKeywords(trimmed);
  } catch (err) {
    console.warn('[LokSeva AI] Network/API error connecting to Gemini service:', err);
    return classifyWithKeywords(trimmed);
  }
}

/**
 * Generates an embedding for a complaint transcript using Gemini embedding model.
 * Returns the numerical vector or null if the API call fails or times out.
 */
export async function generateComplaintEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmed }),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && Array.isArray(data.embedding) && data.embedding.length > 0) {
      return data.embedding;
    }
    return null;
  } catch (err) {
    console.warn('[LokSeva AI] Embedding API call failed or timed out:', err);
    return null;
  }
}

function isValidClassification(obj: any): obj is ComplaintClassification {
  const validUrgencies = ['low', 'medium', 'high', 'critical'];
  const validDepartments = [
    'Water Board',
    'Electricity Department',
    'Roads & PWD',
    'Sanitation',
    'Police',
    'Health',
    'General',
  ];

  return (
    obj &&
    typeof obj.topic === 'string' &&
    validUrgencies.includes(obj.urgency) &&
    validDepartments.includes(obj.department) &&
    typeof obj.location === 'string' &&
    typeof obj.summary === 'string' &&
    typeof obj.reason === 'string' &&
    typeof obj.confidence === 'number' &&
    typeof obj.isMultiIssue === 'boolean'
  );
}
