import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  History,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Layers,
  Zap,
} from 'lucide-react';
import { NtfyAlert, NtfyConnectionStatus, NtfyListener } from '../services/ntfyLiveStream';

interface NtfyLiveReceiverProps {
  onAlertReceived: (alert: NtfyAlert) => void;
  activeTopic?: string;
  onTopicChange?: (newTopic: string) => void;
  autoRouteEnabled?: boolean;
  onToggleAutoRoute?: (enabled: boolean) => void;
}

export const NtfyLiveReceiver: React.FC<NtfyLiveReceiverProps> = ({
  onAlertReceived,
  activeTopic = 'jan-suvidha-alerts',
  onTopicChange,
  autoRouteEnabled = true,
  onToggleAutoRoute,
}) => {
  const [topic, setTopic] = useState<string>(activeTopic);
  const [editingTopic, setEditingTopic] = useState<boolean>(false);
  const [tempTopic, setTempTopic] = useState<string>(activeTopic);
  const [status, setStatus] = useState<NtfyConnectionStatus>('disconnected');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<NtfyAlert[]>([]);
  const [latestAlert, setLatestAlert] = useState<NtfyAlert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [testSentSuccess, setTestSentSuccess] = useState<boolean>(false);

  const listenerRef = useRef<NtfyListener | null>(null);

  // Play a soft pleasant alert chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext policy
    }
  };

  useEffect(() => {
    if (!isEnabled) {
      if (listenerRef.current) {
        listenerRef.current.destroy();
        listenerRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    const listener = new NtfyListener(topic);
    listenerRef.current = listener;

    const unsubStatus = listener.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubAlert = listener.onAlert((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 19)]);
      setLatestAlert(alert);
      playChime();
      // Pass directly to parent intake form
      onAlertReceived(alert);
    });

    listener.connect();

    return () => {
      unsubStatus();
      unsubAlert();
      listener.destroy();
      listenerRef.current = null;
    };
  }, [topic, isEnabled]);

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempTopic.trim().replace(/^https?:\/\/ntfy\.sh\//, '');
    if (clean) {
      setTopic(clean);
      if (onTopicChange) onTopicChange(clean);
    }
    setEditingTopic(false);
  };

  const handleTestPing = async () => {
    setIsSendingTest(true);
    setTestSentSuccess(false);
    const samplePayload = `📞 JAN SUVIDHA Citizen Helpline
════════════════════════════════════
🗣️ Citizen Spoke (Hindi):
"वार्ड 14 में मुख्य सीवेज लाइन ओवरफ्लो हो रही है और पीने का पानी गंदा आ रहा है"

🌐 English Translation:
"Main sewer line is overflowing in Ward 14 and contaminating drinking water supply. Urgent maintenance needed."

📋 Category: Water Supply & Sewage
⚠️ Priority: HIGH
🆔 Call Reference: JS-${Math.floor(100000 + Math.random() * 900000)}
⏱️ Call Duration: 18 seconds`;

    try {
      await fetch('/api/ntfy/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title: 'JAN SUVIDHA Helpline: Water Supply & Sewage',
          message: samplePayload,
          priority: 'urgent',
        }),
      });
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to send test ping:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0F2A4A] to-slate-900 text-white rounded-[14px] p-4 sm:p-5 shadow-md border border-slate-700/80 relative overflow-hidden">
      {/* Decorative background pulse */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Live Status & Topic */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative mt-0.5 sm:mt-0">
            <span
              className={`flex h-4 w-4 rounded-full items-center justify-center ${
                status === 'connected'
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : status === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            >
              {status === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Audio & Helpline Feed
              </span>

              {/* Status Badge */}
              <span
                className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                  status === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                    : status === 'connecting'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                    : 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                }`}
              >
                {status === 'connected' ? 'Connected & Listening' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>

              {alerts.length > 0 && (
                <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full">
                  {alerts.length} received
                </span>
              )}
            </div>

            {/* Topic Link & Edit */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
              <span className="text-slate-400">Stream Topic:</span>
              {!editingTopic ? (
                <div className="flex items-center gap-1.5 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  <a
                    href={`https://ntfy.sh/${topic}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                    title="Open stream in ntfy.sh"
                  >
                    <span>ntfy.sh/{topic}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setTempTopic(topic);
                      setEditingTopic(true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveTopic} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTopic}
                    onChange={(e) => setTempTopic(e.target.value)}
                    className="bg-slate-800 text-xs px-2 py-0.5 rounded border border-emerald-500 font-mono text-emerald-300 focus:outline-hidden"
                    placeholder="topic-name"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTopic(false)}
                    className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute incoming alert chime' : 'Enable alert chime'}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Auto-Route Toggle */}
          {onToggleAutoRoute && (
            <button
              type="button"
              onClick={() => onToggleAutoRoute(!autoRouteEnabled)}
              title={
                autoRouteEnabled
                  ? 'Automatic classification & routing is ACTIVE for live incoming complaints'
                  : 'Click to automatically classify & route live incoming complaints'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer border ${
                autoRouteEnabled
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300 hover:bg-emerald-300 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  autoRouteEnabled ? 'fill-current text-slate-950' : 'text-amber-400'
                }`}
              />
              <span>Auto-Route: {autoRouteEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Test Ping Button */}
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isSendingTest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer border border-indigo-500"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Sending...' : 'Test Alert Ping'}</span>
          </button>

          {/* Setup Guide Button */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>How to Feed</span>
          </button>

          {/* Alerts History Toggle */}
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>History ({alerts.length})</span>
              {showHistory ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}

          {/* Reconnect / Toggle */}
          <button
            type="button"
            onClick={() => {
              if (listenerRef.current) {
                listenerRef.current.reconnect();
              }
            }}
            title="Reconnect live stream"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Banner when test ping sent */}
      {testSentSuccess && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Test citizen call sent to <strong>ntfy.sh/{topic}</strong>! Watch the intake form below auto-populate.</span>
          </div>
        </div>
      )}

      {/* Real-time active alert notification strip */}
      {latestAlert && (
        <div className="mt-3 p-3 rounded-xl bg-slate-800/90 border border-emerald-500/40 text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                Latest Live Alert Auto-Filled into Intake Field
              </span>
              {latestAlert.callerId && (
                <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-700">
                  Ref: {latestAlert.callerId}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {new Date(latestAlert.receivedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-slate-200 font-sans line-clamp-2 bg-slate-900/60 p-2 rounded border border-slate-800">
            "{latestAlert.extractedText}"
          </p>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Recent Alerts Received Over Stream ({alerts.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Click "Load to Form" to reload any complaint</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.receivedAt).toLocaleTimeString()}
                    </span>
                    {item.callerId && (
                      <span className="text-[10px] font-mono text-sky-400 font-bold">
                        {item.callerId}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-[10px] text-amber-300 font-medium truncate">
                        • {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-xs truncate mt-0.5">
                    {item.extractedText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAlertReceived(item)}
                  className="shrink-0 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Load to Form
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: How to Feed Guide for the User's Recording Web App */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  How to Feed Live Recordings from Your Web App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                LokSeva AI is actively listening to <strong>https://ntfy.sh/{topic}</strong> using real-time HTTP Server-Sent Events (SSE). Whenever your live recording web app finishes transcribing a citizen call, send a simple HTTP POST request to that URL.
              </p>

              {/* Endpoint Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Webhook URL</span>
                  <span className="text-indigo-600 font-semibold">https://ntfy.sh/{topic}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`https://ntfy.sh/${topic}`, 'url')}
                  className="px-2.5 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedCode === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{copiedCode === 'url' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Code Example 1: JavaScript / Web App */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    JavaScript in your Recording Web App:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `// Call this in your web app after transcription completes:\nawait fetch('https://ntfy.sh/${topic}', {\n  method: 'POST',\n  headers: {\n    'Title': 'Citizen Helpline Call',\n    'Priority': 'urgent'\n  },\n  body: transcriptText // plain text or formatted transcript\n});`,
                        'js'
                      )
                    }
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedCode === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'js' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`// When speech-to-text finishes in your recording web app:
await fetch('https://ntfy.sh/${topic}', {
  method: 'POST',
  headers: {
    'Title': 'Citizen Helpline Call: ' + departmentName,
    'Priority': 'urgent'
  },
  body: transcriptText // e.g. "Main drinking water pipeline burst near Ward 14..."
});`}
                </pre>
              </div>

              {/* Code Example 2: Structured Format (Hindi/English Helpline) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Recommended Structured Format (Supported automatically):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `📞 JAN SUVIDHA Citizen Helpline\n════════════════════════════════════\n🗣️ Citizen Spoke (Hindi):\n"पानी का संकट"\n\n🌐 English Translation:\n"Drinking water supply issue reported in Ward 14"\n\n📋 Category: Water Supply & Sewage\n⚠️ Priority: HIGH\n🆔 Call Reference: JS-514334`,
                        'structured'
                      )
                    }
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedCode === 'structured' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'structured' ? 'Copied' : 'Copy Format'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`📞 JAN SUVIDHA Citizen Helpline
════════════════════════════════════
🗣️ Citizen Spoke: "पानी का संकट"
🌐 English Translation: "Drinking water supply issue reported in Ward 14"
📋 Category: Water Supply & Sewage
⚠️ Priority: HIGH
🆔 Call Reference: JS-514334`}
                </pre>
                <p className="text-[11px] text-slate-500">
                  LokSeva AI automatically extracts the translated English speech, the caller reference ID, and places it directly into the complaint intake text field!
                </p>
              </div>

              {/* cURL Example */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">
                  Terminal / cURL Test:
                </span>
                <pre className="p-2.5 bg-slate-900 text-amber-300 rounded-xl text-[11px] font-mono overflow-x-auto">
{`curl -d "Power failure in Sector 12 block B since 3 hours" https://ntfy.sh/${topic}`}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
