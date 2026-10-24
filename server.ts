import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { classifyWithKeywords } from './src/services/fallbackClassifier.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function createServer() {
  const app = express();
  app.use(express.json());

  // API Route for Complaint Classification
  app.post('/api/classify', async (req, res) => {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Valid transcript string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      console.log('[LokSeva AI] No Gemini API key provided. Using keyword fallback classifier.');
      const fallback = classifyWithKeywords(transcript);
      return res.json({ classification: fallback, source: 'keyword_fallback' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Wrap with 5 second timeout
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Citizen Complaint Transcript:\n"${transcript}"\n\nClassify this civic complaint according to the system rules and return the JSON schema.`,
        config: {
          systemInstruction: `You are LokSeva AI, an intelligent civic complaint classification and automated routing engine for state and municipal grievance redressal departments.
Complaints arrive as transcripts of citizen reports.

Carefully evaluate the complaint using these strict rules:
1. URGENCY:
- critical: Immediate danger to human life or safety (e.g., flammable gas leak/smell, snapped live electric wire, flash flooding, severe medical emergency, building collapse hazard, active violence).
- high: Essential utility or public service down for many people or whole colony (e.g., main water supply pipeline burst, transformer blown causing widespread blackout, blocked major arterial road).
- medium: Inconvenience impacting daily life (e.g., pothole on street, overflowing garbage dumpster, low water pressure, broken localized sewer line).
- low: Minor or informational issues (e.g., non-working street light during daylight, general civic enquiry, minor foliage issue).

2. DEPARTMENT ROUTING:
- "Water Board": Drinking water supply outages, pipeline ruptures, water contamination, sewer backflow.
- "Electricity Department": Power outages, transformer faults, electric poles, live wires, hazardous electrical sparks, streetlights.
- "Roads & PWD": Potholes, damaged flyovers, cracked pavements, broken dividers, road culverts.
- "Sanitation": Overflowing garbage dumps, uncollected waste, street cleaning, foul waste odors.
- "Police": Crime, eve-teasing, harassment, public nuisance, noise violations, traffic extortion, anti-social elements.
- "Health": Gas leaks, toxic odors causing dizziness/nausea, epidemics, public health hazards, hospital/clinic complaints.
- "General": Multi-department or unclassified administrative inquiries.

3. REASON:
Must be exactly ONE concise sentence that explicitly quotes or cites specific words/phrases from the citizen transcript to explain why that urgency and department were chosen.

4. MULTI-ISSUE:
Set isMultiIssue to true if the citizen reports two or more separate civic issues (e.g., "no water since morning AND a live wire is hanging"). If multi-issue, prioritize routing to the department responsible for the highest urgency threat (e.g. Electricity Department for a live wire over a water outage).

5. CONFIDENCE:
A float between 0.70 and 0.99 representing classification confidence.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: {
                type: Type.STRING,
                description: 'Short standardized civic grievance topic',
              },
              urgency: {
                type: Type.STRING,
                description: 'Urgency level: low, medium, high, or critical',
              },
              department: {
                type: Type.STRING,
                description: 'Department: Water Board, Electricity Department, Roads & PWD, Sanitation, Police, Health, or General',
              },
              location: {
                type: Type.STRING,
                description: 'Specific location, ward, colony, street, or landmark mentioned, or Unknown Location',
              },
              summary: {
                type: Type.STRING,
                description: 'Crisp one-line summary of the complaint',
              },
              reason: {
                type: Type.STRING,
                description: 'One short sentence citing words from the complaint justifying urgency and department',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0.0 and 1.0',
              },
              isMultiIssue: {
                type: Type.BOOLEAN,
                description: 'True if citizen raises two or more distinct issues',
              },
            },
            required: [
              'topic',
              'urgency',
              'department',
              'location',
              'summary',
              'reason',
              'confidence',
              'isMultiIssue',
            ],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 2s')), 2000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const responseText = response.text ? response.text.trim() : '';
      if (!responseText) {
        throw new Error('Empty response received from Gemini model');
      }

      const classification = JSON.parse(responseText);
      return res.json({ classification, source: 'gemini' });
    } catch (err: any) {
      console.warn('[Gemini API Server Notice - Using Fallback]:', err?.message || err);
      const fallback = classifyWithKeywords(transcript);
      return res.json({
        classification: fallback,
        source: 'keyword_fallback',
        warning: err?.message || 'Gemini pipeline error',
      });
    }
  });

  // API Route for Complaint Embedding
  app.post('/api/embed', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      return res.json({ embedding: null, fallback: true, reason: 'No Gemini API key' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding request timed out')), 2000)
      );

      const embedPromise = ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });

      const response = await Promise.race([embedPromise, timeoutPromise]);
      const rawRes = response as any;
      const embedding = rawRes.embedding?.values || rawRes.embeddings?.[0]?.values || null;
      return res.json({ embedding, source: 'gemini' });
    } catch (err: any) {
      console.warn('[Gemini Embedding Server Notice - Fallback]:', err?.message || err);
      return res.json({ embedding: null, fallback: true, warning: err?.message });
    }
  });

  // Proxy endpoint to poll messages from ntfy.sh (avoids any browser-level adblockers or CORS)
  app.get('/api/ntfy/poll', async (req, res) => {
    try {
      const topic = (req.query.topic as string) || 'jan-suvidha-alerts';
      const since = (req.query.since as string) || 'all';
      const response = await fetch(
        `https://ntfy.sh/${encodeURIComponent(topic)}/json?poll=1&since=${encodeURIComponent(since)}`
      );
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch from ntfy.sh' });
      }
      const text = await response.text();
      const items = text
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      return res.json({ topic, items });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  // Endpoint to test-publish to ntfy.sh directly from LokSeva AI
  app.post('/api/ntfy/publish', async (req, res) => {
    try {
      const topic = req.body.topic || 'jan-suvidha-alerts';
      const message = req.body.message || '';
      const title = req.body.title || 'Live Citizen Grievance';
      const priority = req.body.priority || 'default';
      const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: String(priority),
        },
        body: message,
      });
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to publish to ntfy' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LokSeva AI Server',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LokSeva AI Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
