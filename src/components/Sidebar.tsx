import React from 'react';
import {
  FileText,
  LayoutDashboard,
  Inbox,
  Boxes,
  Building2,
  ShieldCheck,
  ChevronRight,
  Database,
  Cpu,
  RotateCcw,
} from 'lucide-react';

export type NavTab = 'intake' | 'dashboard' | 'all' | 'clusters' | 'departments';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  complaintsCount: number;
  clustersCount?: number;
  onResetDemoData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  complaintsCount,
  clustersCount = 0,
  onResetDemoData,
}) => {
  const navItems = [
    {
      id: 'intake' as NavTab,
      label: 'Intake',
      icon: FileText,
      description: 'Transcript classification & routing',
      badge: 'Active',
    },
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Analytics, SLAs & metrics',
    },
    {
      id: 'all' as NavTab,
      label: 'All Complaints',
      icon: Inbox,
      description: 'Central municipal registry',
      count: complaintsCount,
    },
    {
      id: 'clusters' as NavTab,
      label: 'Clusters',
      icon: Boxes,
      description: 'Incident duplicate hotspots',
      count: clustersCount,
    },
    {
      id: 'departments' as NavTab,
      label: 'Departments',
      icon: Building2,
      description: 'Civic agencies & SLA rules',
    },
  ];

  return (
    <aside
      className="w-64 sm:w-72 shrink-0 flex flex-col justify-between text-slate-300 min-h-screen select-none border-r border-slate-800"
      style={{ backgroundColor: '#0F2A4A' }}
    >
      {/* Top Branding */}
      <div>
        <div className="p-6 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-950/50">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">LOKSEVA AI</h1>
              </div>
              <p className="text-[11px] text-sky-200/70 font-medium">
                Smart Grievance Intelligence
              </p>
            </div>
          </div>

          <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-sky-950/50 border border-sky-800/40 flex items-center justify-between text-[11px]">
            <span className="text-sky-300 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Gov Redressal Engine
            </span>
            <span className="text-slate-400 font-mono">v1.2</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all group ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold shadow-inner border border-white/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        item.badge === 'Active'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info / System State */}
      <div className="p-4 border-t border-slate-800/70 text-xs space-y-3">
        {/* Department Colors Quick Index */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Jurisdiction Colors
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Water
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Electricity
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Roads
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Sanitation
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Police
            </div>
            <div className="flex items-center gap-1.5 text-pink-300">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span> Health
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            Gemini 3.8 Flash
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Storage Active
          </span>
        </div>

        {onResetDemoData && (
          <button
            type="button"
            onClick={onResetDemoData}
            className="w-full py-2 px-3 rounded-lg bg-slate-800/90 hover:bg-slate-700 active:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/80 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>
    </aside>
  );
};
