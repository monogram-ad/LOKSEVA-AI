import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  MapPin,
  Clock,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  StoredComplaint,
  DepartmentName,
  UrgencyLevel,
  ComplaintStatus,
} from '../types/complaint';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';
import { ComplaintDrawer } from './ComplaintDrawer';

interface AllComplaintsPageProps {
  complaints: StoredComplaint[];
  onUpdateComplaint: (updated: StoredComplaint) => void;
  onGoToIntake: () => void;
  onViewCluster?: (clusterId: string) => void;
}

type SortField = 'id' | 'urgency' | 'department' | 'location' | 'timestamp' | 'status';
type SortOrder = 'asc' | 'desc';

const DEPARTMENTS: DepartmentName[] = [
  'Water Board',
  'Electricity Department',
  'Roads & PWD',
  'Sanitation',
  'Police',
  'Health',
  'General',
];

export const AllComplaintsPage: React.FC<AllComplaintsPageProps> = ({
  complaints,
  onUpdateComplaint,
  onGoToIntake,
  onViewCluster,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selected complaint for drawer inspection
  const [activeComplaint, setActiveComplaint] = useState<StoredComplaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sorting priorities for urgency and status
  const urgencyWeight: Record<UrgencyLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const statusWeight: Record<string, number> = {
    'New': 1,
    'Assigned': 1,
    'Received': 1,
    'In Progress': 2,
    'Resolved': 3,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'timestamp' || field === 'urgency' ? 'desc' : 'asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    return complaints
      .filter((comp) => {
        if (selectedDept !== 'all' && comp.department !== selectedDept) return false;
        if (selectedUrgency !== 'all' && comp.urgency !== selectedUrgency) return false;
        if (selectedStatus !== 'all') {
          const s = comp.status === 'Assigned' || comp.status === 'Received' ? 'New' : comp.status;
          if (s !== selectedStatus) return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const inId = comp.id.toLowerCase().includes(q);
          const inTopic = comp.topic.toLowerCase().includes(q);
          const inSummary = comp.summary.toLowerCase().includes(q);
          const inLoc = comp.location.toLowerCase().includes(q);
          const inTranscript = comp.transcript.toLowerCase().includes(q);
          const inCaller = comp.callerId ? comp.callerId.includes(q) : false;
          return inId || inTopic || inSummary || inLoc || inTranscript || inCaller;
        }
        return true;
      })
      .sort((a, b) => {
        let result = 0;
        if (sortField === 'id') {
          result = a.id.localeCompare(b.id);
        } else if (sortField === 'timestamp') {
          result = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        } else if (sortField === 'urgency') {
          result = (urgencyWeight[a.urgency] || 0) - (urgencyWeight[b.urgency] || 0);
        } else if (sortField === 'department') {
          result = a.department.localeCompare(b.department);
        } else if (sortField === 'location') {
          result = a.location.localeCompare(b.location);
        } else if (sortField === 'status') {
          result = (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0);
        }
        return sortOrder === 'asc' ? result : -result;
      });
  }, [complaints, selectedDept, selectedUrgency, selectedStatus, searchTerm, sortField, sortOrder]);

  const handleOpenRow = (comp: StoredComplaint) => {
    setActiveComplaint(comp);
    setDrawerOpen(true);
  };

  const handleUpdate = (updated: StoredComplaint) => {
    setActiveComplaint(updated);
    onUpdateComplaint(updated);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  if (complaints.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-[12px] p-10 border border-slate-200/80 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Grievance Registry Empty
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              No complaint tickets currently exist in the central registry. Ingest citizen hotline calls or restore demo data.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToIntake}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Context Bar */}
      <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
              Central Grievance Master
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {complaints.length} Records Ingested
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Municipal Grievance Records
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Search, filter, and inspect transcribed citizen calls. Click any row to review full AI reasoning, audio transcripts, or apply human department overrides.
          </p>
        </div>

        <button
          onClick={onGoToIntake}
          className="self-start md:self-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        >
          <span>+ Ingest New Call</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[12px] p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket ID, summary, topic, location, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
          >
            <option value="all">All Statuses</option>
            <option value="New">New Intake</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {(selectedDept !== 'all' || selectedUrgency !== 'all' || selectedStatus !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept('all');
                setSelectedUrgency('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Complaints Table */}
      <div className="bg-white rounded-[12px] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ticket ID</span>
                    {getSortIcon('id')}
                  </div>
                </th>

                <th className="py-3.5 px-4 min-w-[240px]">
                  <span>Topic & Summary</span>
                </th>

                <th
                  onClick={() => handleSort('urgency')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Urgency</span>
                    {getSortIcon('urgency')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('department')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    {getSortIcon('department')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('location')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Location</span>
                    {getSortIcon('location')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Reported Time</span>
                    {getSortIcon('timestamp')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No complaints matched your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((comp, idx) => {
                  const displayStatus =
                    comp.status === 'Assigned' || comp.status === 'Received' ? 'New' : comp.status;

                  return (
                    <tr
                      key={`all-comp-${comp.id}-${idx}`}
                      onClick={() => handleOpenRow(comp)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Ticket ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="group-hover:text-indigo-600 transition-colors">
                          {comp.id}
                        </span>
                      </td>

                      {/* Topic & Summary */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 truncate">
                          {comp.topic}
                        </div>
                        <div className="text-slate-500 truncate text-[11px] mt-0.5">
                          {comp.summary}
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <UrgencyBadge urgency={comp.urgency} size="sm" />
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <DepartmentBadge department={comp.department} size="sm" />
                          {comp.overriddenByOfficer && (
                            <span className="block text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-sm max-w-fit">
                              Overridden by officer
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-800 whitespace-nowrap font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {comp.location}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(comp.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(comp.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            displayStatus === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : displayStatus === 'In Progress'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRow(comp);
                          }}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong>{filteredAndSorted.length}</strong> of <strong>{complaints.length}</strong> records
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to open details drawer and reassign department
          </span>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      <ComplaintDrawer
        complaint={activeComplaint}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateComplaint={handleUpdate}
        onViewCluster={onViewCluster}
      />
    </div>
  );
};
