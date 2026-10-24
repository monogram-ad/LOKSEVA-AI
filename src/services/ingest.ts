import {
  IngestParams,
  StoredComplaint,
  SimilarComplaintMatch,
  ComplaintCluster,
  UrgencyLevel,
  DepartmentName,
} from '../types/complaint';
import { classifyComplaintWithGemini, generateComplaintEmbedding } from './gemini';
import { cosineSimilarity, jaccardSimilarity, generateSparseTextVector } from '../utils/similarity';

import { SEED_COMPLAINTS } from '../data/seedComplaints';

export const STORAGE_KEY = 'jansunwai_complaints';

/**
 * Retrieves all stored complaints from localStorage.
 * If empty on first load, seeds with 30 realistic complaints across all 6 departments.
 */
export function getStoredComplaints(): StoredComplaint[] {
  if (typeof window === 'undefined') return SEED_COMPLAINTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First load seed initialization
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      return SEED_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      return SEED_COMPLAINTS;
    }
    // Defensive normalization so legacy records always have unique id, clusterId, and standard status
    return parsed.map((item: any, idx: number) => {
      let normalizedStatus: 'New' | 'In Progress' | 'Resolved' = 'New';
      if (item.status === 'In Progress') normalizedStatus = 'In Progress';
      else if (item.status === 'Resolved') normalizedStatus = 'Resolved';

      return {
        ...item,
        id: item.id || `JS-2026-${1000 + idx}`,
        clusterId: item.clusterId || `CLU-2026-LEGACY-${idx}`,
        status: normalizedStatus,
      };
    });
  } catch (err) {
    console.error('Failed to parse stored complaints:', err);
    return SEED_COMPLAINTS;
  }
}

/**
 * Resets localStorage complaints to the initial pristine seed data.
 */
export function resetDemoData(): StoredComplaint[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      window.dispatchEvent(
        new CustomEvent('jansunwai:data_reset', { detail: SEED_COMPLAINTS })
      );
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    }
  }
  return SEED_COMPLAINTS;
}

/**
 * Evaluates similarity between the new complaint and a previously stored complaint.
 * Uses Cosine Similarity if embedding vectors exist; otherwise falls back to
 * Jaccard keyword overlap.
 */
function computeComplaintSimilarity(
  newTranscript: string,
  newEmbedding: number[] | undefined,
  newTopic: string,
  newLocation: string,
  stored: StoredComplaint
): number {
  // If both have embedding vectors from Gemini
  if (
    newEmbedding &&
    newEmbedding.length > 0 &&
    stored.embedding &&
    stored.embedding.length > 0 &&
    newEmbedding.length === stored.embedding.length
  ) {
    return cosineSimilarity(newEmbedding, stored.embedding);
  }

  // Fallback: Jaccard keyword overlap
  const textSim = jaccardSimilarity(newTranscript, stored.transcript);

  // Compute keyword overlap on topic + location as well
  const metaA = `${newTopic} ${newLocation}`.toLowerCase();
  const metaB = `${stored.topic} ${stored.location}`.toLowerCase();
  const metaSim = jaccardSimilarity(metaA, metaB);

  // If both complaints have identical location or strong topic keywords, evaluate combined score
  const combined = Math.max(textSim, textSim * 0.6 + metaSim * 0.4);

  // If location and specific issue overlap strongly in text
  const locationMatch =
    newLocation &&
    stored.location &&
    (newLocation.toLowerCase().includes(stored.location.toLowerCase()) ||
      stored.location.toLowerCase().includes(newLocation.toLowerCase()));

  if (locationMatch && textSim >= 0.4) {
    // Proportional boost for same locality with strong civic term overlap
    return Math.min(1.0, combined + 0.35);
  }

  return combined;
}

/**
 * Ingests a new complaint:
 * 1. Classifies transcript with Gemini (or fallback).
 * 2. Generates Gemini embedding (or fallback vector).
 * 3. Compares with stored complaints (threshold >= 0.8 & matching department).
 * 4. Assigns clusterId and stores record in localStorage.
 */
export async function ingestComplaint({
  transcript,
  callerId,
  timestamp,
}: IngestParams): Promise<StoredComplaint> {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) {
    throw new Error('Transcript is required for complaint ingestion');
  }

  // 1. Run through AI classification pipeline
  const classification = await classifyComplaintWithGemini(cleanTranscript);

  // 2. Generate embedding (Gemini embedding model or fallback sparse vector)
  let embedding = await generateComplaintEmbedding(cleanTranscript);
  if (!embedding || embedding.length === 0) {
    // Generate deterministic sparse fallback vector so cosine operations remain valid
    embedding = generateSparseTextVector(cleanTranscript, 64);
  }

  // 3. Compare with all stored complaints to detect duplicates/clusters
  const existingComplaints = getStoredComplaints();
  const SIMILARITY_THRESHOLD = 0.8;

  const matches: SimilarComplaintMatch[] = [];

  for (const stored of existingComplaints) {
    // Requirement: similarity is above 0.8 AND the department matches
    if (stored.department !== classification.department) {
      continue;
    }

    const similarity = computeComplaintSimilarity(
      cleanTranscript,
      embedding,
      classification.topic,
      classification.location,
      stored
    );

    if (similarity >= SIMILARITY_THRESHOLD) {
      matches.push({
        id: stored.id,
        topic: stored.topic,
        summary: stored.summary,
        similarity: Math.round(similarity * 100) / 100,
        clusterId: stored.clusterId,
        department: stored.department,
        location: stored.location,
        urgency: stored.urgency,
        timestamp: stored.timestamp,
      });
    }
  }

  // Sort matches by highest similarity first
  matches.sort((a, b) => b.similarity - a.similarity);

  // 4. Assign Cluster ID
  let assignedClusterId: string;
  if (matches.length > 0) {
    // Assign existing cluster of the closest match
    assignedClusterId = matches[0].clusterId;
  } else {
    // Create new cluster
    const clusterCode = Math.floor(1000 + Math.random() * 9000);
    assignedClusterId = `CLU-${new Date().getFullYear()}-${clusterCode}`;
  }

  // 5. Build final record
  const ticketNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `JS-${new Date().getFullYear()}-${ticketNum}`;

  const finalRecord: StoredComplaint = {
    id: ticketId,
    transcript: cleanTranscript,
    callerId: callerId?.trim() || undefined,
    timestamp: timestamp || new Date().toISOString(),
    status: 'New',
    clusterId: assignedClusterId,
    embedding,
    similarComplaints: matches.length > 0 ? matches : undefined,
    ...classification,
  };

  // 6. Persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      const updated = [finalRecord, ...existingComplaints];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Broadcast event so UI updates live
      window.dispatchEvent(
        new CustomEvent('jansunwai:complaint_added', { detail: finalRecord })
      );
    } catch (err) {
      console.error('Failed to persist complaint to localStorage:', err);
    }
  }

  return finalRecord;
}

/**
 * Groups stored complaints into organized clusters.
 */
export function getClusters(complaints?: StoredComplaint[]): ComplaintCluster[] {
  const source = complaints || getStoredComplaints();
  const clusterMap = new Map<string, StoredComplaint[]>();

  for (const comp of source) {
    const list = clusterMap.get(comp.clusterId) || [];
    list.push(comp);
    clusterMap.set(comp.clusterId, list);
  }

  const urgencyPriority: Record<UrgencyLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const clusters: ComplaintCluster[] = [];

  clusterMap.forEach((members, clusterId) => {
    // Sort members chronologically (newest first)
    members.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Determine highest urgency in cluster
    let highestUrgency: UrgencyLevel = 'low';
    for (const m of members) {
      if (urgencyPriority[m.urgency] > urgencyPriority[highestUrgency]) {
        highestUrgency = m.urgency;
      }
    }

    const lead = members[0];

    clusters.push({
      id: clusterId,
      department: lead.department,
      representativeTopic: lead.topic,
      representativeSummary: lead.summary,
      location: lead.location,
      highestUrgency,
      memberComplaints: members,
      createdAt: members[members.length - 1].timestamp,
      updatedAt: lead.timestamp,
    });
  });

  // Sort clusters: multi-complaint clusters first, then by urgency priority, then newest
  return clusters.sort((a, b) => {
    if (b.memberComplaints.length !== a.memberComplaints.length) {
      return b.memberComplaints.length - a.memberComplaints.length;
    }
    const urgencyDiff = urgencyPriority[b.highestUrgency] - urgencyPriority[a.highestUrgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * Updates a complaint in localStorage and dispatches a window event.
 */
export function updateStoredComplaint(updatedRecord: StoredComplaint): StoredComplaint {
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredComplaints();
      const updatedList = existing.map((c) =>
        c.id === updatedRecord.id ? updatedRecord : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

      window.dispatchEvent(
        new CustomEvent('jansunwai:complaint_updated', { detail: updatedRecord })
      );
    } catch (err) {
      console.error('Failed to update complaint:', err);
    }
  }
  return updatedRecord;
}

/**
 * Reassigns the department of a complaint (human officer override).
 */
export function reassignComplaintDepartment(
  complaintId: string,
  newDept: DepartmentName
): StoredComplaint | null {
  const existing = getStoredComplaints();
  const target = existing.find((c) => c.id === complaintId);
  if (!target) return null;

  const updated: StoredComplaint = {
    ...target,
    department: newDept,
    overriddenByOfficer: true,
    overriddenDepartment: newDept,
    overriddenAt: new Date().toISOString(),
  };

  return updateStoredComplaint(updated);
}

/**
 * Updates the status of a complaint (e.g. 'New' | 'In Progress' | 'Resolved').
 */
export function updateComplaintStatus(
  complaintId: string,
  newStatus: 'New' | 'In Progress' | 'Resolved'
): StoredComplaint | null {
  const existing = getStoredComplaints();
  const target = existing.find((c) => c.id === complaintId);
  if (!target) return null;

  const updated: StoredComplaint = {
    ...target,
    status: newStatus,
  };

  return updateStoredComplaint(updated);
}
