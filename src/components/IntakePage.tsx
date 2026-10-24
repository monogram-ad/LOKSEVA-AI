import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Phone,
  Send,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
  Zap,
  Radio,
  Play,
  Pause,
  MapPin,
  Layers,
  ArrowRight,
  UserCheck,
  Boxes,
} from 'lucide-react';
import { IngestParams, StoredComplaint } from '../types/complaint';
import { ingestComplaint } from '../services/ingest';
import { ProgressAnimation } from './ProgressAnimation';
import { ResultCard } from './ResultCard';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';
import { AUTO_FEED_POOL } from '../data/autoFeedPool';
import { NtfyLiveReceiver } from './NtfyLiveReceiver';
import { NtfyAlert } from '../services/ntfyLiveStream';

export const SAMPLE_COMPLAINTS = [
  {
    id: 'water-outage',
    label: 'Water Outage',
    icon: '💧',
    category: 'Water Board',
    callerId: '+91 98450 12839',
    text: 'Main drinking water pipeline has burst near Sector 14 market, completely cutting off supply to more than 500 households for the past 18 hours. Water pressure is zero in blocks C and D.',
  },
  {
    id: 'power-cut',
    label: 'Power Cut',
    icon: '⚡',
    category: 'Electricity',
    callerId: '+91 98201 44521',
    text: 'High-voltage distribution transformer tripped at Gandhi Nagar Block C with loud sparks. Entire colony has been plunged into darkness since 2 PM without electricity.',
  },
  {
    id: 'garbage',
    label: 'Garbage Dump',
    icon: '🗑️',
    category: 'Sanitation',
    callerId: '+91 94481 99012',
    text: 'Overflowing municipal garbage dumpster on 4th Cross, Malleshwaram has not been cleared for 5 consecutive days. Foul stench is unbearable, blocking pedestrian movement and attracting stray animals.',
  },
  {
    id: 'pothole',
    label: 'Pothole Hazard',
    icon: '🕳️',
    category: 'Roads & PWD',
    callerId: '+91 97110 33284',
    text: 'A dangerous 2-foot deep pothole has opened up on the MG Road flyover descent near metro pillar 142. It has already caused several two-wheelers to skid and is an imminent road accident hazard.',
  },
  {
    id: 'street-light',
    label: 'Street Light',
    icon: '💡',
    category: 'Electricity',
    callerId: '+91 99532 88410',
    text: 'Five consecutive street lights are completely dark along the outer Ring Road service lane between Sector 9 and Sector 10. The stretch is pitch dark and unsafe for night commuters.',
  },
  {
    id: 'harassment',
    label: 'Harassment',
    icon: '🚨',
    category: 'Police',
    callerId: '+91 91104 55923',
    text: 'A group of aggressive youths are eve-teasing and harassing women college students daily near the main bus terminal on Station Road after 7 PM. Immediate patrolling requested.',
  },
  {
    id: 'gas-smell',
    label: 'Gas Smell',
    icon: '⚠️',
    category: 'Health / Safety',
    callerId: '+91 98300 77156',
    text: 'Strong pungent cooking gas smell leaking from an underground utility line near Central School, Shivaji Nagar. Local residents and schoolchildren are coughing and feeling severe dizziness.',
  },
  {
    id: 'multi-issue',
    label: 'Multi-Issue (Water + Live Wire)',
    icon: '⚡💧',
    category: 'Multi-Department',
    callerId: '+91 98840 61129',
    text: 'No water supply since morning in Vikas Nagar and a snapped live electric wire is hanging down and sparking near the transformer pole outside house 42.',
  },
  {
    id: 'duplicate-water',
    label: '💧 Duplicate: Water Call #2',
    icon: '🔄',
    category: 'Duplicate Test',
    callerId: '+91 97412 88390',
    text: 'Calling from Sector 14 market area. The main water supply pipeline burst here is still not fixed, 500 households have zero water since yesterday.',
  },
];

interface IntakePageProps {
  onComplaintIngested: (complaint: StoredComplaint) => void;
  recentComplaints: StoredComplaint[];
  onViewCluster?: (clusterId: string) => void;
}

export const IntakePage: React.FC<IntakePageProps> = ({
  onComplaintIngested,
  recentComplaints,
  onViewCluster,
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [callerId, setCallerId] = useState<string>('');
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  // Flow states: 'idle' | 'animating' | 'done'
  const [flowState, setFlowState] = useState<'idle' | 'animating' | 'done'>('idle');
  const [pendingComplaint, setPendingComplaint] = useState<StoredComplaint | null>(null);
  const [currentResult, setCurrentResult] = useState<StoredComplaint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-feed demo state
  const [autoFeedActive, setAutoFeedActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [latestFeedId, setLatestFeedId] = useState<string | null>(null);
  const usedFeedIndices = useRef<Set<number>>(new Set());

  // Live ntfy.sh stream state
  const [highlightTextarea, setHighlightTextarea] = useState(false);
  const [autoRouteLiveStream, setAutoRouteLiveStream] = useState<boolean>(true);
  const autoRouteTimeoutRef = useRef<any>(null);
  const [streamNotice, setStreamNotice] = useState<{
    ref?: string;
    category?: string;
    text: string;
    autoRouting?: boolean;
  } | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoRouteTimeoutRef.current) {
        clearTimeout(autoRouteTimeoutRef.current);
      }
    };
  }, []);

  const handleNtfyAlertReceived = (alert: NtfyAlert) => {
    // If previously displaying a result card or processing, return to idle form so field is visibly filled
    if (flowState !== 'idle') {
      setFlowState('idle');
      setCurrentResult(null);
      setPendingComplaint(null);
    }

    // Direct assignment to the complaint transcript text field
    setTranscript(alert.extractedText);
    if (alert.callerId) {
      setCallerId(alert.callerId);
    }
    setSelectedChipId(null);
    setErrorMessage(null);

    // Visual glow feedback on the input textarea
    setHighlightTextarea(true);
    setStreamNotice({
      ref: alert.callerId,
      category: alert.category,
      text: alert.extractedText,
      autoRouting: autoRouteLiveStream,
    });

    setTimeout(() => {
      setHighlightTextarea(false);
    }, 4000);

    // Automatically trigger "Classify and Route Grievance" if auto-route is active
    if (autoRouteLiveStream && alert.extractedText.trim()) {
      if (autoRouteTimeoutRef.current) {
        clearTimeout(autoRouteTimeoutRef.current);
      }
      // 600ms delay so user sees the text populate in the transcript box before the routing flow executes
      autoRouteTimeoutRef.current = setTimeout(() => {
        handleClassify(undefined, alert.extractedText, alert.callerId);
      }, 600);
    }
  };

  // Auto-feed interval effect
  useEffect(() => {
    if (!autoFeedActive) {
      setCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoFeedSubmission();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoFeedActive]);

  const triggerAutoFeedSubmission = async () => {
    // Pick next unseen sample from pool
    const poolSize = AUTO_FEED_POOL.length;
    let chosenIdx = Math.floor(Math.random() * poolSize);

    if (usedFeedIndices.current.size < poolSize) {
      while (usedFeedIndices.current.has(chosenIdx)) {
        chosenIdx = (chosenIdx + 1) % poolSize;
      }
      usedFeedIndices.current.add(chosenIdx);
    }

    const sample = AUTO_FEED_POOL[chosenIdx];

    try {
      const record = await ingestComplaint({
        transcript: sample.transcript,
        callerId: sample.callerId,
        timestamp: new Date().toISOString(),
      });

      setLatestFeedId(record.id);
      onComplaintIngested(record);

      // Trigger critical toast alert if emergency
      if (record.urgency === 'critical') {
        window.dispatchEvent(
          new CustomEvent('jansunwai:critical_alert', { detail: record })
        );
      }

      // Clear animation highlight after 3 seconds
      setTimeout(() => {
        setLatestFeedId((curr) => (curr === record.id ? null : curr));
      }, 3000);
    } catch (err) {
      console.warn('Auto-feed ingest notice:', err);
    }
  };

  const handleSelectSample = (sample: (typeof SAMPLE_COMPLAINTS)[0]) => {
    setTranscript(sample.text);
    setCallerId(sample.callerId);
    setSelectedChipId(sample.id);
    setErrorMessage(null);
  };

  const handleClassify = async (
    e?: React.FormEvent,
    overrideTranscript?: string,
    overrideCallerId?: string
  ) => {
    if (e) e.preventDefault();
    const textToUse = (overrideTranscript !== undefined ? overrideTranscript : transcript).trim();
    const callerToUse = (overrideCallerId !== undefined ? overrideCallerId : callerId).trim() || undefined;

    if (!textToUse) {
      setErrorMessage('Please enter a complaint transcript or pick one of the sample chips.');
      return;
    }

    setErrorMessage(null);
    setFlowState('animating');

    try {
      const record = await ingestComplaint({
        transcript: textToUse,
        callerId: callerToUse,
        timestamp: new Date().toISOString(),
      });

      setPendingComplaint(record);
      onComplaintIngested(record);

      if (record.urgency === 'critical') {
        window.dispatchEvent(
          new CustomEvent('jansunwai:critical_alert', { detail: record })
        );
      }
    } catch (err: any) {
      console.error('Ingest error:', err);
      setErrorMessage(err?.message || 'Classification failed. Please retry.');
      setFlowState('idle');
    }
  };

  const handleAnimationComplete = () => {
    if (pendingComplaint) {
      setCurrentResult(pendingComplaint);
      setFlowState('done');
    } else {
      setFlowState('idle');
    }
  };

  const handleReset = () => {
    setTranscript('');
    setCallerId('');
    setSelectedChipId(null);
    setCurrentResult(null);
    setPendingComplaint(null);
    setFlowState('idle');
    setErrorMessage(null);
  };

  // 10 most recent complaints for right panel queue
  const incomingQueue = recentComplaints.slice(0, 10);

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* "How It Works" 5-Stage Explainer Panel */}
      <div className="bg-white rounded-[12px] p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              How LokSeva AI Works
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Automated Grievance Lifecycle
          </span>
        </div>

        {/* 5-Step Pipeline Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-[#F4F6FA] border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                01
              </span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-xs text-slate-900">Transcript</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Citizen hotline call transcribed directly to text.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-[#F4F6FA] border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                02
              </span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="font-bold text-xs text-slate-900">Classify</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Gemini AI models score urgency & assign department.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-[#F4F6FA] border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                03
              </span>
              <Boxes className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="font-bold text-xs text-slate-900">Detect Duplicates</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Embeddings &gt; 0.80 merge reports into clusters.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-[#F4F6FA] border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                04
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="font-bold text-xs text-slate-900">Route</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Automated dispatch to agency SLA work queue.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                05
              </span>
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="font-bold text-xs text-purple-950">Human Override</div>
            <p className="text-[11px] text-purple-800 leading-tight">
              Officers can reassign agency or update statuses.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: Left Input / Result & Right Incoming Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Intake Input / Animation / Result Card (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Live Audio / Call Recording Receiver from ntfy.sh */}
          <NtfyLiveReceiver
            onAlertReceived={handleNtfyAlertReceived}
            autoRouteEnabled={autoRouteLiveStream}
            onToggleAutoRoute={setAutoRouteLiveStream}
          />

          {/* Sample Chips Panel */}
          <div className="bg-white rounded-[12px] p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                Quick Test Scenarios (8 Civic Categories)
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Click any chip to populate
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_COMPLAINTS.map((sample) => {
                const isSelected = selectedChipId === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                        : 'bg-[#F4F6FA] text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{sample.icon}</span>
                    <span>{sample.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complaint Intake Form */}
          {flowState === 'idle' && (
            <form
              onSubmit={handleClassify}
              className="bg-white rounded-[12px] p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Citizen Grievance Call Intake</span>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Channel
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Paste or edit the plain text transcript of the citizen report. The AI engine will extract locations, measure urgency, and assign the proper department.
                </p>
              </div>

              {/* Live Injected Alert Banner */}
              {streamNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] mr-1.5">
                        {streamNotice.autoRouting
                          ? '⚡ Auto-Classifying & Routing Live Grievance'
                          : 'Live Stream Injected'}
                      </span>
                      {streamNotice.ref && (
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] text-emerald-700 border border-emerald-200 mr-1.5">
                          {streamNotice.ref}
                        </span>
                      )}
                      <span className="text-emerald-700 truncate">
                        {streamNotice.autoRouting
                          ? 'Transcript populated — running AI classification and routing automatically...'
                          : 'Directly added to transcript field below.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStreamNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-emerald-100 cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="transcript"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Complaint Transcript <span className="text-rose-500">*</span>
                  </label>
                  {highlightTextarea && (
                    <span className="text-[11px] font-semibold text-emerald-600 animate-pulse flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-500" />
                      Live recording incoming...
                    </span>
                  )}
                </div>
                <textarea
                  id="transcript"
                  rows={4}
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (selectedChipId) setSelectedChipId(null);
                  }}
                  placeholder="Paste transcribed citizen call here (e.g., 'Main pipeline burst near Sector 14 market, no water for 500 households...')"
                  className={`w-full p-3.5 text-xs rounded-xl border transition-all duration-300 font-sans leading-relaxed text-slate-800 placeholder:text-slate-400 ${
                    highlightTextarea
                      ? 'border-emerald-500 ring-4 ring-emerald-300/50 bg-emerald-50/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
              </div>

              {/* Optional Caller ID Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="callerId"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Caller Phone Number (Optional)
                  </span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">
                    from PBX telephony
                  </span>
                </label>
                <input
                  id="callerId"
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  placeholder="+91 98XXX XXXXX (Optional caller ID for callback dispatch)"
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono text-slate-800"
                />
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Input</span>
                </button>

                <button
                  type="submit"
                  disabled={!transcript.trim()}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Classify & Route</span>
                </button>
              </div>
            </form>
          )}

          {/* Step Progress Animation */}
          {flowState === 'animating' && (
            <ProgressAnimation onComplete={handleAnimationComplete} />
          )}

          {/* Classification Result Card */}
          {flowState === 'done' && currentResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Automated Classification & Routing Output
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Saved to Registry
                </span>
              </div>

              <ResultCard
                complaint={currentResult}
                onReset={handleReset}
                onViewCluster={onViewCluster}
              />
            </div>
          )}
        </div>

        {/* Right Column: "Incoming Queue" Panel (4 or 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-[12px] p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 sticky top-6">
          {/* Header Bar */}
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Incoming Queue (Live)
                </h4>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {incomingQueue.length} Recent
              </span>
            </div>

            {/* Auto-feed demo toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F6FA] border border-slate-200/70 mt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoFeedActive(!autoFeedActive)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    autoFeedActive ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle auto-feed demo"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs ${
                      autoFeedActive ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Auto-Feed Demo</span>
                    {autoFeedActive && (
                      <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                        {countdown}s
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {autoFeedActive ? 'Ingesting random call every 10s' : 'Paused (toggle to auto-simulate)'}
                  </p>
                </div>
              </div>

              {autoFeedActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Play className="w-2.5 h-2.5 fill-current" /> Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  <Pause className="w-2.5 h-2.5" /> Idle
                </span>
              )}
            </div>
          </div>

          {/* Cards List in Incoming Queue */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 divide-y divide-slate-100">
            {incomingQueue.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No complaints in queue yet. Submit a transcript or toggle Auto-Feed Demo.
              </div>
            ) : (
              incomingQueue.map((comp) => {
                const isNewest = comp.id === latestFeedId;

                return (
                  <div
                    key={`queue-card-${comp.id}`}
                    onClick={() => {
                      setCurrentResult(comp);
                      setFlowState('done');
                    }}
                    className={`pt-2.5 first:pt-0 cursor-pointer group transition-all duration-300 rounded-lg p-2 ${
                      isNewest
                        ? 'bg-indigo-50/80 border border-indigo-300 ring-2 ring-indigo-200 animate-in fade-in slide-in-from-top-2 duration-500'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {comp.id}
                        </span>
                        <UrgencyBadge urgency={comp.urgency} size="sm" />
                        <span className="text-[10px] font-semibold text-slate-600">
                          {comp.department}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(comp.timestamp)}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {comp.topic}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      "{comp.summary}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-0.5 truncate max-w-[170px]">
                        <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                        <span className="truncate">{comp.location}</span>
                      </span>
                      {comp.callerId && <span>📞 {comp.callerId}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
