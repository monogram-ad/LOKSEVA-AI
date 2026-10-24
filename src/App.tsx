import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { IntakePage } from './components/IntakePage';
import { DashboardPage } from './components/DashboardPage';
import { AllComplaintsPage } from './components/AllComplaintsPage';
import { ClustersPage } from './components/ClustersPage';
import { DepartmentsPage } from './components/DepartmentsPage';
import { StoredComplaint } from './types/complaint';
import {
  getStoredComplaints,
  getClusters,
  resetDemoData,
  STORAGE_KEY,
} from './services/ingest';
import { ShieldCheck, Menu, X, RotateCcw, Check } from 'lucide-react';
import { CriticalAlertToast } from './components/CriticalAlertToast';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [complaints, setComplaints] = useState<StoredComplaint[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [criticalAlertComplaint, setCriticalAlertComplaint] = useState<StoredComplaint | null>(null);

  // Load complaints from localStorage (seeds 30 complaints on first load)
  useEffect(() => {
    setComplaints(getStoredComplaints());

    const handleNewComplaint = (e: Event) => {
      const customEvent = e as CustomEvent<StoredComplaint>;
      if (customEvent.detail) {
        setComplaints((prev) => [
          customEvent.detail,
          ...prev.filter((p) => p.id !== customEvent.detail.id),
        ]);
      }
    };

    const handleComplaintUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<StoredComplaint>;
      if (customEvent.detail) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === customEvent.detail.id ? customEvent.detail : c))
        );
      }
    };

    const handleResetEvent = (e: Event) => {
      const customEvent = e as CustomEvent<StoredComplaint[]>;
      if (customEvent.detail) {
        setComplaints(customEvent.detail);
      }
    };

    const handleCriticalAlert = (e: Event) => {
      const customEvent = e as CustomEvent<StoredComplaint>;
      if (customEvent.detail) {
        setCriticalAlertComplaint(customEvent.detail);
      }
    };

    window.addEventListener('jansunwai:complaint_added', handleNewComplaint);
    window.addEventListener('jansunwai:complaint_updated', handleComplaintUpdated);
    window.addEventListener('jansunwai:data_reset', handleResetEvent);
    window.addEventListener('jansunwai:critical_alert', handleCriticalAlert);

    return () => {
      window.removeEventListener('jansunwai:complaint_added', handleNewComplaint);
      window.removeEventListener('jansunwai:complaint_updated', handleComplaintUpdated);
      window.removeEventListener('jansunwai:data_reset', handleResetEvent);
      window.removeEventListener('jansunwai:critical_alert', handleCriticalAlert);
    };
  }, []);

  const clusters = useMemo(() => {
    return getClusters(complaints);
  }, [complaints]);

  const handleUpdateComplaint = (updated: StoredComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleResetDemo = () => {
    if (confirm('Reset to initial 30 demo complaints across all 6 departments?')) {
      const fresh = resetDemoData();
      setComplaints(fresh);
      setSelectedClusterId(null);
      setShowToast('Demo data successfully restored to 30 seeded complaints.');
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleViewCluster = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    setCurrentTab('clusters');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F6FA] text-slate-800 antialiased font-sans relative">
      {/* Critical Hazard Emergency Alert Toast */}
      <CriticalAlertToast
        complaint={criticalAlertComplaint}
        onDismiss={() => setCriticalAlertComplaint(null)}
        onInspect={(comp) => {
          setSelectedClusterId(comp.clusterId);
          setCurrentTab('all');
        }}
      />

      {/* Standard Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-40 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Mobile Header Bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 text-white border-b border-slate-800"
        style={{ backgroundColor: '#0F2A4A' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">LOKSEVA AI</div>
            <div className="text-[10px] text-sky-200">Grievance Classifier</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 text-white cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'clusters') {
              setSelectedClusterId(null);
            }
          }}
          complaintsCount={complaints.length}
          clustersCount={clusters.length}
          onResetDemoData={handleResetDemo}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
                if (tab !== 'clusters') {
                  setSelectedClusterId(null);
                }
              }}
              complaintsCount={complaints.length}
              clustersCount={clusters.length}
              onResetDemoData={handleResetDemo}
            />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-indigo-600 hidden sm:block"></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                National Smart Complaint Classification & Routing
              </h1>
              <p className="text-xs text-slate-500">
                AI Municipal Triage • State Grievance Redressal Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemo}
              title="Reset to 30 default seeded complaints"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F6FA] border border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800">Hotline Transcribe</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-[11px] text-indigo-600 font-semibold">1800-LOK-SEVA</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="p-4 sm:p-8 flex-1">
          {currentTab === 'intake' ? (
            <IntakePage
              onComplaintIngested={(newRecord) => {
                setComplaints((prev) => [
                  newRecord,
                  ...prev.filter((c) => c.id !== newRecord.id),
                ]);
              }}
              recentComplaints={complaints}
              onViewCluster={handleViewCluster}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardPage
              complaints={complaints}
              onGoToIntake={() => setCurrentTab('intake')}
              onViewCluster={handleViewCluster}
            />
          ) : currentTab === 'all' ? (
            <AllComplaintsPage
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
              onGoToIntake={() => setCurrentTab('intake')}
              onViewCluster={handleViewCluster}
            />
          ) : currentTab === 'clusters' ? (
            <ClustersPage
              complaints={complaints}
              selectedClusterId={selectedClusterId}
              onGoToIntake={() => setCurrentTab('intake')}
            />
          ) : (
            <DepartmentsPage
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
              onGoToIntake={() => setCurrentTab('intake')}
              onViewCluster={handleViewCluster}
            />
          )}
        </div>
      </main>
    </div>
  );
}
