/**
 * Computes the cosine similarity between two numerical vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Keyword-based Jaccard similarity fallback between two text transcripts.
 * Evaluates token overlap of meaningful keywords (words >= 3 characters, minus common stop words).
 */
export function jaccardSimilarity(textA: string, textB: string): number {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'was', 'this', 'that', 'with', 'from',
    'have', 'has', 'had', 'not', 'but', 'out', 'all', 'any', 'been',
    'near', 'there', 'here', 'into', 'over', 'such', 'what', 'when',
  ]);

  const tokenize = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stopWords.has(w))
    );
  };

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;

  return intersection / union;
}

/**
 * Generates a deterministic pseudo-embedding vector for text based on char-trigrams
 * and hash buckets. Used as a high-dimension fallback when API is offline so
 * cosine similarity can also operate consistently.
 */
export function generateSparseTextVector(text: string, dimensions = 64): number[] {
  const vec = new Array(dimensions).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean.length < 3) return vec;

  for (let i = 0; i < clean.length - 2; i++) {
    const trigram = clean.substring(i, i + 3);
    let hash = 0;
    for (let j = 0; j < trigram.length; j++) {
      hash = (hash << 5) - hash + trigram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  }

  // Normalize vector to unit length
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}
