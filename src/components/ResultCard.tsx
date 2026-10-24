import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Phone,
  FileText,
  Boxes,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { StoredComplaint } from '../types/complaint';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';

interface ResultCardProps {
  complaint: StoredComplaint;
  onReset?: () => void;
  onViewCluster?: (clusterId: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  complaint,
  onReset,
  onViewCluster,
}) => {
  const [copied, setCopied] = useState(false);

  const confidencePercent = Math.round(complaint.confidence * 100);
  const similarCount = complaint.similarComplaints?.length || 0;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(
      `[LokSeva AI Ticket: ${complaint.id}]\nCluster: ${complaint.clusterId}\nTopic: ${complaint.topic}\nDepartment: ${complaint.department}\nUrgency: ${complaint.urgency.toUpperCase()}\nLocation: ${complaint.location}\nSummary: ${complaint.summary}\nAI Reason: ${complaint.reason}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-500';
    if (percent >= 75) return 'bg-indigo-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-[12px] border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6 transition-all duration-300">
      {/* Header bar with Ticket ID, Cluster ID, Badges, and Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
            {complaint.id}
          </span>
          <button
            type="button"
            onClick={() => onViewCluster && onViewCluster(complaint.clusterId)}
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            title="Click to view all incidents in this cluster"
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-500" />
            <span>{complaint.clusterId}</span>
          </button>
          <UrgencyBadge urgency={complaint.urgency} size="md" />
          <DepartmentBadge department={complaint.department} size="md" />
          {complaint.isMultiIssue && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Multi-Issue
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(complaint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-emerald-700">Auto-Routed</span>
        </div>
      </div>

      {/* Similar Complaints Found Strip (Duplicate / Cluster Alert) */}
      {similarCount > 0 && (
        <div className="rounded-[10px] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-200/70 text-amber-800">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <span>Similar Complaints Found ({similarCount})</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-950 font-mono font-bold">
                    Similarity &ge; 0.80
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Automated duplicate detection matched existing reports for {complaint.department}. Grouped into cluster{' '}
                  <span className="font-mono font-bold">{complaint.clusterId}</span>.
                </p>
              </div>
            </div>

            {onViewCluster && (
              <button
                type="button"
                onClick={() => onViewCluster(complaint.clusterId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto"
              >
                <span>View Incident Cluster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List of matching complaints */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {complaint.similarComplaints!.map((match) => {
              const matchPercent = Math.round(match.similarity * 100);
              return (
                <div
                  key={match.id}
                  className="bg-white/90 rounded-lg p-3 border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-800"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {match.id}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {match.topic}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-medium truncate">
                        📍 {match.location}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs truncate max-w-xl">
                      "{match.summary}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                      {matchPercent}% Match
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Classification Content */}
      <div className="space-y-4">
        {/* Topic Title */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Grievance Category & Incident
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {complaint.topic}
          </h3>
        </div>

        {/* Multi-issue warning alert banner if flagged */}
        {complaint.isMultiIssue && (
          <div className="bg-amber-50/80 rounded-[10px] p-3.5 border border-amber-200/90 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold text-amber-950">Multi-Hazard Alert:</strong> This call contains multiple disparate municipal grievances. LokSeva AI automatically prioritized routing to{' '}
              <span className="font-semibold underline decoration-amber-400 underline-offset-2">
                {complaint.department}
              </span>{' '}
              to safeguard human life and mitigate the highest severity risk.
            </div>
          </div>
        )}

        {/* 2-Column Grid for Summary and Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* One-line summary */}
          <div className="md:col-span-2 bg-[#F4F6FA] rounded-[10px] p-4 border border-slate-200/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              One-Line Summary
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {complaint.summary}
            </p>
          </div>

          {/* Extracted Location */}
          <div className="bg-[#F4F6FA] rounded-[10px] p-4 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Extracted Location
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {complaint.location}
              </p>
            </div>
            {complaint.callerId && (
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Caller: {complaint.callerId}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Reason citation */}
        <div className="bg-indigo-50/50 rounded-[10px] p-4 border border-indigo-100 flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              AI Decision Rationale
            </div>
            <p className="text-xs sm:text-sm text-indigo-950 font-normal leading-relaxed italic">
              "{complaint.reason}"
            </p>
          </div>
        </div>

        {/* Confidence score bar */}
        <div className="bg-[#F4F6FA] rounded-[10px] p-4 border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Classification Confidence
            </span>
            <span className="font-mono font-bold text-slate-900">
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceColor(confidencePercent)} transition-all duration-700 ease-out`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Low Confidence (60%)</span>
            <span>Optimal Match (90%+)</span>
          </div>
        </div>
      </div>

      {/* Original citizen transcript snippet */}
      <div className="pt-2">
        <details className="group">
          <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-800 transition-colors flex items-center gap-1 select-none">
            <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            <span>View Original Intake Transcript</span>
          </summary>
          <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono">
            "{complaint.transcript}"
          </div>
        </details>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={handleCopyTicket}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied Dispatch Memo</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Ticket Details</span>
            </>
          )}
        </button>

        {onReset && (
          <button
            onClick={onReset}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            Classify Next Complaint
          </button>
        )}
      </div>
    </div>
  );
};
