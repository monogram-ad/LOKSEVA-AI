import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Zap,
  Hammer,
  Trash2,
  Shield,
  HeartPulse,
  Layers,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
  GripVertical,
  ChevronRight,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { StoredComplaint, DepartmentName, ComplaintStatus } from '../types/complaint';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';
import { ComplaintDrawer } from './ComplaintDrawer';
import { updateComplaintStatus } from '../services/ingest';

interface DepartmentsPageProps {
  complaints: StoredComplaint[];
  onUpdateComplaint: (updated: StoredComplaint) => void;
  onGoToIntake: () => void;
  onViewCluster?: (clusterId: string) => void;
}

const DEPARTMENTS: Array<{
  name: DepartmentName;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sla: string;
  description: string;
}> = [
  {
    name: 'Water Board',
    icon: Droplets,
    color: '#2563EB',
    sla: '4 Hour SLA for Pipeline Ruptures',
    description: 'Drinking water distribution network, pipe bursts, contamination & tanker dispatch',
  },
  {
    name: 'Electricity Department',
    icon: Zap,
    color: '#D97706',
    sla: '2 Hour SLA for Live Wire & High-Voltage Spikes',
    description: 'Power transformers, 11kV feeders, hanging live wires, streetlights & grid maintenance',
  },
  {
    name: 'Roads & PWD',
    icon: Hammer,
    color: '#64748B',
    sla: '12 Hour SLA for Arterial Flyover Cave-ins',
    description: 'Flyovers, major corridors, potholes, asphalt resurfacing & road median barriers',
  },
  {
    name: 'Sanitation',
    icon: Trash2,
    color: '#059669',
    sla: '6 Hour SLA for Dumpster Overflows',
    description: 'Solid waste clearance, municipal dumpster compactor trucks & street cleanliness',
  },
  {
    name: 'Police',
    icon: Shield,
    color: '#4F46E5',
    sla: 'Immediate 15-Minute Emergency Response',
    description: 'Public order, student safety patrolling, anti-social menace & illegal toxic dumping',
  },
  {
    name: 'Health',
    icon: HeartPulse,
    color: '#DB2777',
    sla: '1 Hour Rapid Health HAZMAT Intervention',
    description: 'Chemical & gas odors, public health emergencies, dengue vector breeding & clinics',
  },
];

type KanbanColumnId = 'New' | 'In Progress' | 'Resolved';

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  complaints,
  onUpdateComplaint,
  onGoToIntake,
  onViewCluster,
}) => {
  const [selectedDept, setSelectedDept] = useState<DepartmentName>('Water Board');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnId | null>(null);

  // Drawer inspection state
  const [activeComplaint, setActiveComplaint] = useState<StoredComplaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Compute counts and critical counts for each department tab
  const deptStats = useMemo(() => {
    const stats: Record<string, { total: number; critical: number }> = {};
    DEPARTMENTS.forEach((d) => {
      stats[d.name] = { total: 0, critical: 0 };
    });

    complaints.forEach((c) => {
      if (!stats[c.department]) {
        stats[c.department] = { total: 0, critical: 0 };
      }
      stats[c.department].total++;
      if (c.urgency === 'critical' && c.status !== 'Resolved') {
        stats[c.department].critical++;
      }
    });

    return stats;
  }, [complaints]);

  // Complaints for selected department
  const deptComplaints = useMemo(() => {
    return complaints.filter((c) => c.department === selectedDept);
  }, [complaints, selectedDept]);

  // Group into Kanban columns (New, In Progress, Resolved)
  const columns = useMemo(() => {
    const cols: Record<KanbanColumnId, StoredComplaint[]> = {
      'New': [],
      'In Progress': [],
      'Resolved': [],
    };

    deptComplaints.forEach((c) => {
      const s: KanbanColumnId =
        c.status === 'Resolved'
          ? 'Resolved'
          : c.status === 'In Progress'
          ? 'In Progress'
          : 'New';
      cols[s].push(c);
    });

    // Sort chronologically within each column
    cols['New'].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    cols['In Progress'].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    cols['Resolved'].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return cols;
  }, [deptComplaints]);

  // Handle Drag & Drop status transition
  const handleMoveStatus = (complaintId: string, newStatus: KanbanColumnId) => {
    const updated = updateComplaintStatus(complaintId, newStatus);
    if (updated) {
      onUpdateComplaint(updated);
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const currentDeptMeta = DEPARTMENTS.find((d) => d.name === selectedDept) || DEPARTMENTS[0];
  const DeptIcon = currentDeptMeta.icon;

  if (complaints.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-[12px] p-10 border border-slate-200/80 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <DeptIcon className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              No Departmental Cases
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              No civic complaints have been assigned to departments yet. Head to Intake to classify calls or restore demo data.
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
      {/* Page Header */}
      <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              <DeptIcon className="w-3 h-3 text-indigo-600" />
              Department Operations Center
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Interactive Kanban Dispatch
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Departmental Workflow & Case Dispatch
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Manage grievances assigned to each civic agency. Drag and drop case cards between <strong>New</strong>, <strong>In Progress</strong>, and <strong>Resolved</strong> to coordinate field work and meet SLA benchmarks.
          </p>
        </div>

        <button
          onClick={onGoToIntake}
          className="self-start md:self-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        >
          <span>+ Ingest Complaint</span>
        </button>
      </div>

      {/* Department Tabs Bar */}
      <div className="bg-white rounded-[12px] p-2 border border-slate-200/80 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            const isSelected = selectedDept === dept.name;
            const stat = deptStats[dept.name] || { total: 0, critical: 0 };

            return (
              <button
                key={dept.name}
                type="button"
                onClick={() => setSelectedDept(dept.name)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-[#F4F6FA] text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{dept.name}</span>

                {/* Total count */}
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {stat.total}
                </span>

                {/* Critical count badge */}
                {stat.critical > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    <span>{stat.critical}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Department Context Summary Card */}
      <div className="bg-white rounded-[12px] p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="p-3 rounded-xl text-white shadow-xs shrink-0"
            style={{ backgroundColor: currentDeptMeta.color }}
          >
            <DeptIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">{selectedDept}</h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentDeptMeta.sla}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {currentDeptMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-[#F4F6FA] border border-slate-200 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Cases</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {deptComplaints.length}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-800">In Progress</div>
            <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">
              {columns['In Progress'].length}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Resolved</div>
            <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
              {columns['Resolved'].length}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Kanban Board with Drag and Drop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Column 1: New / Intake */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverCol('New');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain') || draggedId;
            if (id) handleMoveStatus(id, 'New');
          }}
          className={`bg-[#F4F6FA] rounded-[12px] p-4 border transition-all duration-200 min-h-[500px] flex flex-col ${
            dragOverCol === 'New'
              ? 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/50'
              : 'border-slate-200/80'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                New Intake
              </h4>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
              {columns['New'].length}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
            {columns['New'].length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl p-4">
                No new unassigned cases in this department. Drag cards here to reopen.
              </div>
            ) : (
              columns['New'].map((comp, idx) => (
                <KanbanCard
                  key={`kanban-new-${comp.id}-${idx}`}
                  complaint={comp}
                  onOpen={() => {
                    setActiveComplaint(comp);
                    setDrawerOpen(true);
                  }}
                  onDragStart={() => setDraggedId(comp.id)}
                  onMoveTo={(st) => handleMoveStatus(comp.id, st)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverCol('In Progress');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain') || draggedId;
            if (id) handleMoveStatus(id, 'In Progress');
          }}
          className={`bg-[#F4F6FA] rounded-[12px] p-4 border transition-all duration-200 min-h-[500px] flex flex-col ${
            dragOverCol === 'In Progress'
              ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/50'
              : 'border-slate-200/80'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                In Progress / Field Dispatched
              </h4>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white text-amber-900 border border-slate-200 shadow-2xs">
              {columns['In Progress'].length}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
            {columns['In Progress'].length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl p-4">
                Drop complaints here to mark them as "In Progress".
              </div>
            ) : (
              columns['In Progress'].map((comp, idx) => (
                <KanbanCard
                  key={`kanban-prog-${comp.id}-${idx}`}
                  complaint={comp}
                  onOpen={() => {
                    setActiveComplaint(comp);
                    setDrawerOpen(true);
                  }}
                  onDragStart={() => setDraggedId(comp.id)}
                  onMoveTo={(st) => handleMoveStatus(comp.id, st)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverCol('Resolved');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain') || draggedId;
            if (id) handleMoveStatus(id, 'Resolved');
          }}
          className={`bg-[#F4F6FA] rounded-[12px] p-4 border transition-all duration-200 min-h-[500px] flex flex-col ${
            dragOverCol === 'Resolved'
              ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/50'
              : 'border-slate-200/80'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Resolved / Closed
              </h4>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-slate-200 shadow-2xs">
              {columns['Resolved'].length}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
            {columns['Resolved'].length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl p-4">
                Drag completed field tickets here to mark them as "Resolved".
              </div>
            ) : (
              columns['Resolved'].map((comp, idx) => (
                <KanbanCard
                  key={`kanban-res-${comp.id}-${idx}`}
                  complaint={comp}
                  onOpen={() => {
                    setActiveComplaint(comp);
                    setDrawerOpen(true);
                  }}
                  onDragStart={() => setDraggedId(comp.id)}
                  onMoveTo={(st) => handleMoveStatus(comp.id, st)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      <ComplaintDrawer
        complaint={activeComplaint}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateComplaint={(updated) => {
          setActiveComplaint(updated);
          onUpdateComplaint(updated);
        }}
        onViewCluster={onViewCluster}
      />
    </div>
  );
};

// Sub-component for individual Kanban Card
interface KanbanCardProps {
  complaint: StoredComplaint;
  onOpen: () => void;
  onDragStart: () => void;
  onMoveTo: (status: KanbanColumnId) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  complaint,
  onOpen,
  onDragStart,
  onMoveTo,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', complaint.id);
        onDragStart();
      }}
      onClick={onOpen}
      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
    >
      {/* Top Card Bar */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {complaint.id}
          </span>
          <UrgencyBadge urgency={complaint.urgency} size="sm" />
          {complaint.overriddenByOfficer && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 flex items-center gap-0.5"
              title="Overridden by officer"
            >
              <UserCheck className="w-2.5 h-2.5" />
              <span>Override</span>
            </span>
          )}
        </div>

        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          {new Date(complaint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Topic & Summary */}
      <div>
        <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
          {complaint.topic}
        </h5>
        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
          {complaint.summary}
        </p>
      </div>

      {/* Location and Caller Details */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1 truncate text-slate-700 font-medium">
          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="truncate">{complaint.location}</span>
        </span>

        {/* Quick move status dropdown */}
        <select
          value={complaint.status === 'Resolved' ? 'Resolved' : complaint.status === 'In Progress' ? 'In Progress' : 'New'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onMoveTo(e.target.value as KanbanColumnId);
          }}
          className="text-[10px] py-0.5 px-1.5 rounded border border-slate-200 bg-slate-50 text-slate-600 focus:outline-hidden cursor-pointer"
        >
          <option value="New">Move: New</option>
          <option value="In Progress">Move: In Progress</option>
          <option value="Resolved">Move: Resolved</option>
        </select>
      </div>
    </div>
  );
};
