import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
  Boxes,
  Users,
} from 'lucide-react';
import { StoredComplaint, DepartmentName, UrgencyLevel, ComplaintCluster } from '../types/complaint';
import { getClusters } from '../services/ingest';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';

interface DashboardPageProps {
  complaints: StoredComplaint[];
  onGoToIntake: () => void;
  onViewCluster: (clusterId: string) => void;
}

// Department color mapping for charts
const DEPARTMENT_COLORS: Record<DepartmentName, string> = {
  'Water Board': '#2563EB', // Blue
  'Electricity Department': '#D97706', // Amber
  'Roads & PWD': '#64748B', // Gray
  'Sanitation': '#059669', // Green
  'Police': '#4F46E5', // Indigo
  'Health': '#DB2777', // Pink
  'General': '#7C3AED', // Purple
};

// Urgency color mapping for charts
const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  critical: '#DC2626', // Red
  high: '#EA580C', // Orange
  medium: '#EAB308', // Yellow
  low: '#10B981', // Green
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  complaints,
  onGoToIntake,
  onViewCluster,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Brief initial loading skeleton animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const clusters = useMemo(() => {
    return getClusters(complaints);
  }, [complaints]);

  // 1. Top Stat Metrics
  const stats = useMemo(() => {
    const total = complaints.length;
    const criticalOpen = complaints.filter(
      (c) => c.urgency === 'critical' && c.status !== 'Resolved'
    ).length;

    // Duplicates merged: sum of (clusterMembers - 1) for all multi-complaint clusters
    const duplicatesMerged = clusters.reduce((acc, clu) => {
      if (clu.memberComplaints.length > 1) {
        return acc + (clu.memberComplaints.length - 1);
      }
      return acc;
    }, 0);

    const avgConfidence =
      total > 0
        ? (complaints.reduce((acc, c) => acc + (c.confidence || 0.9), 0) / total) * 100
        : 95.0;

    return {
      total,
      criticalOpen,
      duplicatesMerged,
      avgConfidence: avgConfidence.toFixed(1),
    };
  }, [complaints, clusters]);

  // 2. Complaints by Department Chart Data
  const departmentChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Water Board': 0,
      'Electricity Department': 0,
      'Roads & PWD': 0,
      'Sanitation': 0,
      'Police': 0,
      'Health': 0,
    };

    complaints.forEach((c) => {
      if (counts[c.department] !== undefined) {
        counts[c.department]++;
      } else {
        counts[c.department] = (counts[c.department] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      shortName:
        name === 'Electricity Department'
          ? 'Electricity'
          : name === 'Roads & PWD'
          ? 'Roads'
          : name === 'Water Board'
          ? 'Water'
          : name,
      count,
      color: DEPARTMENT_COLORS[name as DepartmentName] || '#64748B',
    }));
  }, [complaints]);

  // 3. Urgency Split Chart Data
  const urgencyChartData = useMemo(() => {
    const counts: Record<UrgencyLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    complaints.forEach((c) => {
      counts[c.urgency] = (counts[c.urgency] || 0) + 1;
    });

    return [
      { name: 'Critical', value: counts.critical, color: URGENCY_COLORS.critical },
      { name: 'High', value: counts.high, color: URGENCY_COLORS.high },
      { name: 'Medium', value: counts.medium, color: URGENCY_COLORS.medium },
      { name: 'Low', value: counts.low, color: URGENCY_COLORS.low },
    ].filter((item) => item.value > 0);
  }, [complaints]);

  // 4. Complaints Over Time (Last 7 Days)
  const timelineChartData = useMemo(() => {
    const daysMap = new Map<string, { label: string; count: number; dateStr: string }>();

    // Prepare 7-day array
    const now = new Date('2026-10-24T08:00:00Z');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      daysMap.set(dateKey, { label, count: 0, dateStr: dateKey });
    }

    complaints.forEach((c) => {
      const dateKey = c.timestamp.slice(0, 10);
      if (daysMap.has(dateKey)) {
        daysMap.get(dateKey)!.count++;
      } else {
        // Fallback to today if outside 7 days
        const todayKey = now.toISOString().slice(0, 10);
        if (daysMap.has(todayKey)) {
          daysMap.get(todayKey)!.count++;
        }
      }
    });

    return Array.from(daysMap.values());
  }, [complaints]);

  // 5. Top 5 Hotspot Clusters
  const topHotspots = useMemo(() => {
    return [...clusters]
      .sort((a, b) => b.memberComplaints.length - a.memberComplaints.length)
      .slice(0, 5);
  }, [clusters]);

  // 6. Live Feed of 8 Latest Complaints
  const latestComplaints = useMemo(() => {
    return [...complaints]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [complaints]);

  // Relative time helper
  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        {/* Skeleton Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={`skel-card-${i}`} className="h-28 bg-white rounded-[12px] border border-slate-200/80 p-5">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-16 bg-slate-300 rounded mt-3"></div>
              <div className="h-2 w-32 bg-slate-100 rounded mt-2"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-[12px] border border-slate-200 p-6"></div>
          <div className="h-72 bg-white rounded-[12px] border border-slate-200 p-6"></div>
        </div>

        <div className="h-64 bg-white rounded-[12px] border border-slate-200 p-6"></div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-[12px] p-10 border border-slate-200/80 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <TrendingUp className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Telemetry Empty
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              No civic complaints have been ingested into the system yet. Classify new transcripts or restore demo data to visualize real-time analytics.
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dashboard Header Bar */}
      <div className="bg-white rounded-[12px] p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              <TrendingUp className="w-3 h-3 text-indigo-600" />
              Executive Redressal Cockpit
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Real-Time City Diagnostics</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Municipal Triage & Grievance Intelligence
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Consolidated intake telemetry, department workload distribution, and duplicate incident cluster analytics across all city wards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGoToIntake}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>+ Ingest Complaint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-white rounded-[12px] p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Complaints
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">100% Ingested</span> across 7 days
            </div>
          </div>
        </div>

        {/* Critical Open */}
        <div className="bg-white rounded-[12px] p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              Critical Open
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-red-600 font-mono tracking-tight">
              {stats.criticalOpen}
            </div>
            <div className="text-xs text-red-700/80 mt-1">
              Immediate life-safety hazards
            </div>
          </div>
        </div>

        {/* Duplicates Merged */}
        <div className="bg-white rounded-[12px] p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Duplicates Merged
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-amber-900 font-mono tracking-tight">
              {stats.duplicatesMerged}
            </div>
            <div className="text-xs text-amber-800/80 mt-1">
              Calls consolidated into clusters
            </div>
          </div>
        </div>

        {/* Avg Routing Confidence */}
        <div className="bg-white rounded-[12px] p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg Routing Accuracy
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-emerald-700 font-mono tracking-tight">
              {stats.avgConfidence}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gemini & Keyword consensus
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts Section: Department Workload & Urgency Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Complaints by Department */}
        <div className="lg:col-span-2 bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                Complaints by Department
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Workload allocation across 6 core government departments
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-time Count</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  interval={0}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(val: any) => `${val || 0} complaints`}
                  contentStyle={{
                    backgroundColor: '#0F2A4A',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#38BDF8' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {departmentChartData.map((entry, index) => (
                    <Cell key={`bar-cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 border-t border-slate-100 text-[11px]">
            {departmentChartData.map((d, index) => (
              <div key={`dept-legend-${d.name}-${index}`} className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }}></span>
                <span>{d.shortName}</span>
                <span className="font-mono text-slate-400 font-semibold">({d.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart: Urgency Split */}
        <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Urgency Breakdown
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Severity Ratio
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritization distribution for rapid municipal response
            </p>
          </div>

          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={urgencyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {urgencyChartData.map((entry, index) => (
                    <Cell key={`pie-cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `${val || 0} complaints`}
                  contentStyle={{
                    backgroundColor: '#0F2A4A',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-800">{stats.total}</span>
              <span className="text-[10px] font-semibold uppercase text-slate-400">Total</span>
            </div>
          </div>

          {/* Urgency Legend Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {urgencyChartData.map((item, index) => (
              <div
                key={`urgency-stat-${item.name}-${index}`}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F4F6FA] border border-slate-200/60"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Complaints Over Time (Last 7 Days Line / Area Chart) */}
      <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Complaints Volume Trajectory (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily trend of incoming citizen phone reports and municipal hotline transcripts
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
            7-Day Activity Window
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val: any) => `${val || 0} complaints`}
                contentStyle={{
                  backgroundColor: '#0F2A4A',
                  color: '#FFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Bottom 2-Column Section: Top 5 Hotspot Clusters & Live 8 Complaints Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top 5 Hotspot Clusters */}
        <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-600" />
                Top Hotspot Clusters (Top 5)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Highest redundancy incidents requiring coordinated dispatch
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Ranked by Calls
            </span>
          </div>

          <div className="space-y-3">
            {topHotspots.map((cluster, index) => {
              const count = cluster.memberComplaints.length;

              return (
                <div
                  key={`hotspot-clu-${cluster.id || 'clu'}-${index}`}
                  onClick={() => onViewCluster(cluster.id)}
                  className="p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-400 bg-[#F4F6FA] hover:bg-white cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {cluster.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Users className="w-3 h-3" />
                        {count} Calls
                      </span>
                      <DepartmentBadge department={cluster.department} size="sm" />
                      <UrgencyBadge urgency={cluster.highestUrgency} size="sm" />
                    </div>

                    <div className="text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {cluster.representativeTopic}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{cluster.location}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                      "{cluster.representativeSummary}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Feed of 8 Latest Complaints */}
        <div className="bg-white rounded-[12px] p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Live Feed (8 Latest Ingested)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time chronological queue of classified grievances
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
            {latestComplaints.map((comp, index) => (
              <div
                key={`latest-feed-${comp.id || 'comp'}-${index}`}
                className="py-3 px-1 hover:bg-[#F4F6FA] rounded-lg transition-colors flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {comp.id}
                    </span>
                    <UrgencyBadge urgency={comp.urgency} size="sm" />
                    <span className="text-[11px] font-medium text-slate-600">
                      {comp.department}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {comp.topic}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-sm">
                    {comp.summary}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>📍 {comp.location}</span>
                    {comp.callerId && <span>📞 {comp.callerId}</span>}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 shrink-0 text-right whitespace-nowrap">
                  {formatTimeAgo(comp.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
