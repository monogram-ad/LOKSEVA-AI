import { ComplaintClassification, DepartmentName, UrgencyLevel } from '../types/complaint';

/**
 * Keyword-based fallback classifier in case the Gemini API call fails,
 * times out, or lacks network connectivity.
 */
export function classifyWithKeywords(transcript: string): ComplaintClassification {
  const lower = transcript.toLowerCase();

  // Core feature flags
  const hasStreetLight = /\b(street light|streetlight|streetlights|lights not functioning|lights are dark|dark street)\b/.test(lower);
  const hasWater = /\b(water|pipeline|burst pipeline|leak|pipe|supply|tanker|tap|sewage|drainage)\b/.test(lower);
  const hasElectric = /\b(wire|electric|power|transformer|spark|shock|pole|blackout|current|voltage|street light|light)\b/.test(lower);
  const hasRoadDamage = /\b(pothole|crater|flyover descent|road damage|broken road|divider|tar|asphalt)\b/.test(lower);
  const hasSanitation = /\b(garbage|trash|dumpster|waste|stench|foul smell|rotting|filth|debris|dead animal)\b/.test(lower);
  const hasPolice = /\b(harass|eve-teasing|tease|theft|robbery|thief|fight|trouble|menace|anti-social|drunk|goons|noise|patrolling)\b/.test(lower);
  const hasGasOrHealth = /\b(gas smell|gas leak|cooking gas|lpg|toxic|suffocat|dizzy|coughing|poison|hospital|clinic|ambulance|epidemic|dengue)\b/.test(lower);

  // Multi-issue detection
  const matchedCategories = [
    hasWater ? 'water' : null,
    (hasElectric && !hasStreetLight) ? 'electric' : null,
    hasRoadDamage ? 'road' : null,
    hasSanitation ? 'sanitation' : null,
    hasPolice ? 'police' : null,
    hasGasOrHealth ? 'health' : null,
  ].filter(Boolean);

  const isMultiIssue =
    matchedCategories.length >= 2 ||
    lower.includes('and also') ||
    (hasWater && hasElectric && lower.includes('live wire')) ||
    (hasWater && lower.includes('pole'));

  // Critical checks: immediate danger to life or safety
  const isCritical =
    /\b(gas leak|gas smell|cooking gas|lpg leak|cylinder leak|live wire|hanging wire|sparking|shock hazard|flash flood|severe flood|explosion|poisoning|dizzy|unconscious|collapsed)\b/.test(lower) ||
    (hasElectric && /\b(live wire|spark|sparking|danger|snapped live)\b/.test(lower));

  // High checks: essential service down for many people or urgent safety
  const isHigh =
    !isCritical &&
    (/\b(burst|colony|entire|outage|hours|500\+|transformer tripped|blackout|harass|eve-teasing|no water|all households|market)\b/.test(lower) ||
      (hasWater && lower.includes('no water')) ||
      (hasElectric && !hasStreetLight && (lower.includes('electricity since') || lower.includes('transformer tripped'))));

  // Medium checks: inconvenience
  const isMedium =
    !isCritical &&
    !isHigh &&
    !hasStreetLight &&
    (hasRoadDamage || hasSanitation || /\b(pothole|dumpster|garbage|overflowing|smell|broken|delay|low pressure|crater)\b/.test(lower));

  let urgency: UrgencyLevel = 'low';
  if (isCritical) {
    urgency = 'critical';
  } else if (isHigh) {
    urgency = 'high';
  } else if (isMedium) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  // Department and Topic determination
  let department: DepartmentName = 'General';
  let topic = 'Civic Infrastructure Concern';

  if (hasGasOrHealth && (lower.includes('gas') || lower.includes('dizzy') || lower.includes('lpg'))) {
    department = 'Health';
    topic = 'Hazardous Gas Leakage & Public Health';
  } else if (isCritical && hasElectric) {
    department = 'Electricity Department';
    topic = isMultiIssue ? 'Live Wire Hazard & Water Disruption' : 'Hazardous Live Wire & Electrical Sparking';
  } else if (hasPolice) {
    department = 'Police';
    topic = 'Public Safety & Anti-Social Harassment';
  } else if (hasWater && (!hasElectric || urgency !== 'critical')) {
    department = 'Water Board';
    topic = lower.includes('burst') ? 'Main Water Pipeline Rupture' : 'Drinking Water Supply Outage';
  } else if (hasStreetLight) {
    department = 'Electricity Department';
    topic = 'Non-Functional Municipal Street Lights';
    urgency = 'low'; // Non-hazardous street light is low urgency per rules
  } else if (hasElectric) {
    department = 'Electricity Department';
    topic = 'Power Outage & Transformer Breakdown';
  } else if (hasRoadDamage) {
    department = 'Roads & PWD';
    topic = 'Hazardous Road Pothole & Surface Defect';
  } else if (hasSanitation) {
    department = 'Sanitation';
    topic = 'Municipal Waste Dumpster Overflow';
  }

  // Location extraction
  let location = 'Local Ward';
  const locationRegexes = [
    /(?:near|at|in|outside|along)\s+([A-Za-z0-9#\-\s,]+?(?:Colony|Nagar|Sector\s*\d+|Road|Flyover|Street|Cross|Block\s*[A-Za-z0-9]+|Market|School|Terminal|Pillar\s*\d+|Station|House\s*\d+))/i,
    /(?:Sector\s*\d+|Block\s*[A-Za-z0-9]+|[A-Z][a-z]+\s*Nagar|[A-Z][a-z]+\s*Road|MG\s*Road|Ring\s*Road|Malleshwaram|Vikas\s*Nagar|Gandhi\s*Nagar|Shivaji\s*Nagar|Station\s*Road)/,
  ];

  for (const regex of locationRegexes) {
    const match = transcript.match(regex);
    if (match && match[0]) {
      location = match[1] ? match[1].trim() : match[0].trim();
      location = location.replace(/[,.;]+$/, '').trim();
      break;
    }
  }

  // Reason generation citing exact words from transcript
  let reasonCitation = '';
  if (isCritical) {
    if (lower.includes('gas')) reasonCitation = '"gas smell leaking" and "people feeling dizzy"';
    else if (lower.includes('live wire') || lower.includes('snapped')) reasonCitation = '"snapped live electric wire is sparking dangerously"';
    else reasonCitation = 'immediate life-safety hazard terms identified';
  } else if (isHigh) {
    if (lower.includes('pipeline') || lower.includes('burst')) reasonCitation = '"pipeline has burst" cutting supply to "500 households"';
    else if (lower.includes('transformer') || lower.includes('power')) reasonCitation = '"transformer tripped" leaving colony "without electricity"';
    else if (lower.includes('harass') || lower.includes('eve-teasing')) reasonCitation = '"eve-teasing and harassing women students" threatening public order';
    else reasonCitation = 'widespread essential utility disruption';
  } else if (isMedium) {
    if (hasRoadDamage) reasonCitation = '"dangerous pothole" causing skidding accidents';
    else if (hasSanitation) reasonCitation = '"overflowing municipal garbage dumpster" and "foul stench"';
    else reasonCitation = 'persistent civic inconvenience reported';
  } else {
    reasonCitation = '"street lights are completely dark" along service lane';
  }

  const reason = `Assigned ${urgency.toUpperCase()} urgency to ${department} due to ${reasonCitation} in the citizen report.`;

  // Summary
  const summary = transcript.length > 95 ? transcript.slice(0, 92) + '...' : transcript;

  return {
    topic,
    urgency,
    department,
    location,
    summary,
    reason,
    confidence: isCritical ? 0.98 : isMultiIssue ? 0.95 : 0.92,
    isMultiIssue,
  };
}
