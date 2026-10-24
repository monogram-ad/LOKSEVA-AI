import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Boxes,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { StoredComplaint, DepartmentName, ComplaintStatus } from '../types/complaint';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';
import { reassignComplaintDepartment, updateComplaintStatus } from '../services/ingest';

interface ComplaintDrawerProps {
  complaint: StoredComplaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updated: StoredComplaint) => void;
  onViewCluster?: (clusterId: string) => void;
}

const DEPARTMENTS: DepartmentName[] = [
  'Water Board',
  'Electricity Department',
  'Roads & PWD',
  'Sanitation',
  'Police',
  'Health',
  'General',
];

export const ComplaintDrawer: React.FC<ComplaintDrawerProps> = ({
  complaint,
  isOpen,
  onClose,
  onUpdateComplaint,
  onViewCluster,
}) => {
  const [selectedDept, setSelectedDept] = useState<DepartmentName>('Water Board');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('New');
  const [copied, setCopied] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState(false);

  useEffect(() => {
    if (complaint) {
      setSelectedDept(complaint.department);
      setSelectedStatus(complaint.status);
      setReassignSuccess(false);
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const confidencePercent = Math.round((complaint.confidence || 0.9) * 100);

  const handleApplyReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDept === complaint.department && complaint.overriddenByOfficer) {
      return;
    }

    const updated = reassignComplaintDepartment(complaint.id, selectedDept);
    if (updated) {
      onUpdateComplaint(updated);
      setReassignSuccess(true);
      setTimeout(() => setReassignSuccess(false), 2500);
    }
  };

  const handleStatusChange = (newStatus: 'New' | 'In Progress' | 'Resolved') => {
    const updated = updateComplaintStatus(complaint.id, newStatus);
    if (updated) {
      setSelectedStatus(newStatus);
      onUpdateComplaint(updated);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `[LokSeva AI Ticket: ${complaint.id}]\nDepartment: ${complaint.department}\nUrgency: ${complaint.urgency.toUpperCase()}\nStatus: ${complaint.status}\nLocation: ${complaint.location}\nTopic: ${complaint.topic}\nSummary: ${complaint.summary}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-xl pointer-events-auto bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  {complaint.id}
                </span>
                <UrgencyBadge urgency={complaint.urgency} size="sm" />
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : complaint.status === 'In Progress'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}
                >
                  {complaint.status === 'New' ? 'New Intake' : complaint.status}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Override Indicator Banner */}
            {complaint.overriddenByOfficer && (
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200 flex items-center gap-2 text-xs text-purple-900 font-medium">
                <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Overridden by officer</strong> to{' '}
                  <span className="font-semibold underline">{complaint.department}</span>
                  {complaint.overriddenAt && (
                    <span className="text-purple-700 ml-1 text-[11px]">
                      • {new Date(complaint.overriddenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
            {/* Topic & Summary */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Civic Grievance Incident
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                {complaint.topic}
              </h3>
              <p className="text-sm font-medium text-slate-700 leading-relaxed bg-[#F4F6FA] p-3 rounded-xl border border-slate-200/60">
                {complaint.summary}
              </p>
            </div>

            {/* Human Override: Reassign Department Section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reassign-dept"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Reassign Department (Human Override)
                </label>
                {reassignSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Reassigned
                  </span>
                )}
              </div>

              <form onSubmit={handleApplyReassign} className="flex gap-2">
                <select
                  id="reassign-dept"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value as DepartmentName)}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={selectedDept === complaint.department && Boolean(complaint.overriddenByOfficer)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                >
                  Reassign
                </button>
              </form>
              <p className="text-[11px] text-slate-500">
                Overriding will re-route this ticket and mark it with an official "Overridden by officer" audit tag.
              </p>
            </div>

            {/* Quick Status Change */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Workflow Status Progression
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['New', 'In Progress', 'Resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      complaint.status === st || (st === 'New' && complaint.status === 'Assigned')
                        ? st === 'Resolved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : st === 'In Progress'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'Resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Transcript Card */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Original Citizen Transcript
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                "{complaint.transcript}"
              </div>
            </div>

            {/* AI Reasoning and Confidence */}
            <div className="space-y-3 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Reasoning & Grounding
                </span>
                <span className="font-mono font-bold text-indigo-950">
                  {confidencePercent}% Confidence
                </span>
              </div>
              <p className="text-xs text-indigo-950 italic leading-relaxed">
                "{complaint.reason}"
              </p>
              <div className="w-full bg-indigo-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F4F6FA] p-3 rounded-lg border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" /> Location
                </div>
                <div className="font-semibold text-slate-900 mt-1 truncate">
                  {complaint.location}
                </div>
              </div>

              <div className="bg-[#F4F6FA] p-3 rounded-lg border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Reported Time
                </div>
                <div className="font-semibold text-slate-900 mt-1 truncate">
                  {new Date(complaint.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {complaint.callerId && (
                <div className="bg-[#F4F6FA] p-3 rounded-lg border border-slate-200/60 col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Caller Contact</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800">
                    {complaint.callerId}
                  </span>
                </div>
              )}
            </div>

            {/* Assigned Cluster & Similar Complaints */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Incident Cluster
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {complaint.clusterId}
                </span>
              </div>

              {onViewCluster && (
                <button
                  type="button"
                  onClick={() => {
                    onViewCluster(complaint.clusterId);
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View All Calls in this Incident Cluster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Similar Complaints matching this record */}
              {complaint.similarComplaints && complaint.similarComplaints.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Matched Duplicate Complaints ({complaint.similarComplaints.length})
                  </div>
                  {complaint.similarComplaints.map((sim, idx) => (
                    <div
                      key={`sim-drawer-${sim.id}-${idx}`}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{sim.id}</span>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {Math.round(sim.similarity * 100)}% Match
                        </span>
                      </div>
                      <p className="text-slate-600 truncate text-[11px]">"{sim.summary}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-3 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied Memo</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Ticket</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
