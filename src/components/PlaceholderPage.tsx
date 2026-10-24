import React from 'react';
import {
  Boxes,
  Building2,
  Inbox,
  LayoutDashboard,
  LucideIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { StoredComplaint } from '../types/complaint';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';

interface PlaceholderPageProps {
  tab: NavTab;
  onGoToIntake: () => void;
  complaints: StoredComplaint[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  tab,
  onGoToIntake,
  complaints,
}) => {
  const configs: Record<
    NavTab,
    { title: string; subtitle: string; icon: LucideIcon; description: string }
  > = {
    intake: {
      title: 'Intake',
      subtitle: 'Complaint classification & routing pipeline',
      icon: Inbox,
      description: 'Active intake interface',
    },
    dashboard: {
      title: 'Analytics & SLA Dashboard',
      subtitle: 'City-wide grievance volume, average resolution times, and departmental responsiveness',
      icon: LayoutDashboard,
      description:
        'This analytics cockpit is scheduled for module phase 2. It will aggregate intake metrics, critical hazard spikes, and SLA compliance across municipal wards.',
    },
    all: {
      title: 'Central Complaints Registry',
      subtitle: 'Master repository of all citizen calls transcribed and auto-routed by LokSeva AI',
      icon: Inbox,
      description:
        'Central registry viewing module. All complaints ingested on the Intake page are persisted to your browser localStorage.',
    },
    clusters: {
      title: 'Geographic & Topic Clusters',
      subtitle: 'Incident hotspot detection and spatial multi-call clustering for rapid civic intervention',
      icon: Boxes,
      description:
        'Incident cluster engine scheduled for next release. It will group related citizen complaints from the same ward or transformer feeder to detect systemic breakdowns.',
    },
    departments: {
      title: 'Department Directories & SLAs',
      subtitle: 'Jurisdictional rules, contact nodal officers, and automated dispatch routing endpoints',
      icon: Building2,
      description:
        'Department directory overview. Configures Water Board, Electricity Department, Roads & PWD, Sanitation, Police, and Health dispatch routing.',
    },
  };

  const current = configs[tab] || configs.dashboard;
  const Icon = current.icon;

  // If "all" complaints is clicked and there are stored complaints, show a quick table preview!
  if (tab === 'all' && complaints.length > 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Central Complaints Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {complaints.length} persisted records stored in localStorage
            </p>
          </div>
          <button
            onClick={onGoToIntake}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            + Ingest New Complaint
          </button>
        </div>

        <div className="bg-white rounded-[12px] border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Topic / Summary</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    {c.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <UrgencyBadge urgency={c.urgency} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <DepartmentBadge department={c.department} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {c.location}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                    {c.topic}: {c.summary}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-white rounded-[12px] p-10 border border-slate-200/80 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Icon className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Placeholder Module
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
            {current.title}
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            {current.subtitle}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F4F6FA] border border-slate-200/70 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          {current.description}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToIntake}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            <span>Return to Intake Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
