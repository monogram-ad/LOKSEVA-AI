import React, { useState, useMemo } from 'react';
import {
  Boxes,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Phone,
  Layers,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Users,
  AlertTriangle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { StoredComplaint, DepartmentName, UrgencyLevel, ComplaintCluster } from '../types/complaint';
import { getClusters } from '../services/ingest';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';

interface ClustersPageProps {
  complaints: StoredComplaint[];
  selectedClusterId?: string | null;
  onGoToIntake: () => void;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({
  complaints,
  selectedClusterId,
  onGoToIntake,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [multiOnly, setMultiOnly] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>(() => {
    // If a selectedClusterId was provided, expand it by default
    if (selectedClusterId) {
      return { [selectedClusterId]: true };
    }
    return {};
  });

  const clusters = useMemo(() => {
    return getClusters(complaints);
  }, [complaints]);

  // Aggregate metrics
  const totalClusters = clusters.length;
  const multiReportClusters = clusters.filter((c) => c.memberComplaints.length > 1).length;
  const criticalClusters = clusters.filter((c) => c.highestUrgency === 'critical').length;
  const totalReportsClustered = clusters.reduce((acc, c) => acc + c.memberComplaints.length, 0);

  // Filter clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      if (selectedDept !== 'all' && cluster.department !== selectedDept) {
        return false;
      }
      if (selectedUrgency !== 'all' && cluster.highestUrgency !== selectedUrgency) {
        return false;
      }
      if (multiOnly && cluster.memberComplaints.length <= 1) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inId = cluster.id.toLowerCase().includes(q);
        const inTopic = cluster.representativeTopic.toLowerCase().includes(q);
        const inSummary = cluster.representativeSummary.toLowerCase().includes(q);
        const inLoc = cluster.location.toLowerCase().includes(q);
        const inMembers = cluster.memberComplaints.some(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            m.transcript.toLowerCase().includes(q) ||
            (m.callerId && m.callerId.includes(q))
        );
        return inId || inTopic || inSummary || inLoc || inMembers;
      }
      return true;
    });
  }, [clusters, selectedDept, selectedUrgency, multiOnly, searchTerm]);

  const toggleExpand = (clusterId: string) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  const departmentsList: DepartmentName[] = [
    'Water Board',
    'Electricity Department',
    'Roads & PWD',
    'Sanitation',
    'Police',
    'Health',
    'General',
  ];

  if (complaints.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-[12px] p-10 border border-slate-200/80 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Boxes className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              No Incident Clusters Found Yet
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Incidents are clustered dynamically when complaints match above 0.80 embedding similarity in the same municipal department.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F6FA] border border-slate-200/70 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Head to the Intake page and classify citizen complaint calls to automatically group related breakdowns and detect duplicates.
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToIntake}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <span>Go to Intake & Classify Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & KPI Stat Cards */}
      <div className="bg-white rounded-[12px] p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Boxes className="w-3 h-3 text-indigo-600" />
                Cluster Intelligence
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Cosine & Jaccard Duplicate Triage
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Incident Hotspots & Redundant Complaints
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Complaints sharing &ge; 0.80 embedding similarity within the same municipal department are automatically grouped into single dispatchable operational clusters.
            </p>
          </div>

          <button
            onClick={onGoToIntake}
            className="self-start md:self-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <span>+ Ingest Another Complaint</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#F4F6FA] rounded-[10px] p-4 border border-slate-200/60">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Clusters</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalClusters}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all wards & agencies
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-[10px] p-4 border border-amber-200/70">
            <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Multi-Call Clusters
            </div>
            <div className="text-2xl font-bold text-amber-950 mt-1 font-mono">
              {multiReportClusters}
            </div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">
              High redundancy incidents
            </div>
          </div>

          <div className="bg-red-50/70 rounded-[10px] p-4 border border-red-200/70">
            <div className="text-[10px] uppercase font-bold text-red-700 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Critical Hazards
            </div>
            <div className="text-2xl font-bold text-red-950 mt-1 font-mono">
              {criticalClusters}
            </div>
            <div className="text-[11px] text-red-700/80 mt-0.5">
              Immediate safety priority
            </div>
          </div>

          <div className="bg-indigo-50/60 rounded-[10px] p-4 border border-indigo-200/60">
            <div className="text-[10px] uppercase font-bold text-indigo-700">Total Member Calls</div>
            <div className="text-2xl font-bold text-indigo-950 mt-1 font-mono">
              {totalReportsClustered}
            </div>
            <div className="text-[11px] text-indigo-700/80 mt-0.5">
              Ingested grievances
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[12px] p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clusters by location, keyword, cluster ID, or caller ID..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
          >
            <option value="all">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
          >
            <option value="all">All Urgencies</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            type="button"
            onClick={() => setMultiOnly(!multiOnly)}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
              multiOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Call Only</span>
          </button>
        </div>
      </div>

      {/* Cluster Cards Feed */}
      <div className="space-y-4">
        {filteredClusters.length === 0 ? (
          <div className="bg-white rounded-[12px] p-8 text-center border border-slate-200 text-slate-500 text-xs">
            No clusters match the selected search or filter criteria.
          </div>
        ) : (
          filteredClusters.map((cluster) => {
            const isExpanded = Boolean(expandedClusters[cluster.id]);
            const isTargeted = selectedClusterId === cluster.id;
            const count = cluster.memberComplaints.length;
            const hasMultiple = count > 1;

            return (
              <div
                key={cluster.id}
                id={`cluster-${cluster.id}`}
                className={`bg-white rounded-[12px] border transition-all duration-200 shadow-sm overflow-hidden ${
                  isTargeted
                    ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Cluster Card Header Bar */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                        {cluster.id}
                      </span>

                      {/* Member count pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          hasMultiple
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {count} {count === 1 ? 'Citizen Call' : 'Calls Clustered'}
                        </span>
                      </span>

                      {/* Department Badge */}
                      <DepartmentBadge department={cluster.department} size="md" />

                      {/* Highest Urgency Badge */}
                      <UrgencyBadge urgency={cluster.highestUrgency} size="md" />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {new Date(cluster.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Representative Topic and Location */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {cluster.location}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {cluster.representativeTopic}
                    </h3>
                  </div>

                  {/* Representative Summary */}
                  <div className="bg-[#F4F6FA] rounded-[10px] p-3.5 border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                      Consolidated Incident Summary
                    </span>
                    {cluster.representativeSummary}
                  </div>

                  {/* Footer Bar / Expand Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {hasMultiple ? (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          Consolidated duplicate calls for single dispatch unit
                        </span>
                      ) : (
                        <span className="text-slate-500">Single reported occurrence</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(cluster.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Member Calls' : `Inspect Calls (${count})`}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Member Complaints Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-5 sm:p-6 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>MEMBER COMPLAINTS IN CLUSTER ({count})</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        Sorted by most recent
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {cluster.memberComplaints.map((comp, idx) => (
                        <div
                          key={comp.id}
                          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                {comp.id}
                              </span>
                              <UrgencyBadge urgency={comp.urgency} size="sm" />
                              {comp.isMultiIssue && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                  Multi-Hazard
                                </span>
                              )}
                              {idx > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Duplicate Match (&ge;0.80)
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 flex items-center gap-3">
                              {comp.callerId && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {comp.callerId}
                                </span>
                              )}
                              <span>
                                {new Date(comp.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Member transcript */}
                          <div className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 font-mono leading-relaxed">
                            "{comp.transcript}"
                          </div>

                          {/* Member AI Reason */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>AI Reason: {comp.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
