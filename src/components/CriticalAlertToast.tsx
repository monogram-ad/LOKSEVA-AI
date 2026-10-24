import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, X, ArrowRight, Bell } from 'lucide-react';
import { StoredComplaint } from '../types/complaint';

interface CriticalAlertToastProps {
  complaint: StoredComplaint | null;
  onDismiss: () => void;
  onInspect: (complaint: StoredComplaint) => void;
}

export const CriticalAlertToast: React.FC<CriticalAlertToastProps> = ({
  complaint,
  onDismiss,
  onInspect,
}) => {
  useEffect(() => {
    if (!complaint) return;

    // Optional audio cue
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio playback restrictions safely handled
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, 9000);

    return () => clearTimeout(timer);
  }, [complaint, onDismiss]);

  if (!complaint) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-red-950 text-white rounded-2xl shadow-2xl border-2 border-red-500 p-4 space-y-3 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-amber-500 animate-pulse"></div>

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/80 text-white shrink-0 mt-0.5 animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded bg-red-600 text-white tracking-widest">
                  CRITICAL HAZARD DETECTED
                </span>
                <span className="font-mono text-xs text-red-200 font-bold">
                  {complaint.id}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                {complaint.topic}
              </h4>
              <p className="text-xs text-red-200/90 mt-0.5 line-clamp-2">
                📍 {complaint.location} • Auto-routed to{' '}
                <span className="font-bold underline text-white">
                  {complaint.department}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-800/50 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-800/60 text-xs">
          <span className="text-[11px] text-red-300 flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            Dispatch SLA: 15-30 Mins
          </span>

          <button
            type="button"
            onClick={() => {
              onInspect(complaint);
              onDismiss();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
