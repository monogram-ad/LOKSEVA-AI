/**
 * Live stream service for subscribing to ntfy.sh topics (e.g. jan-suvidha-alerts)
 * Automatically receives live transcribed citizen calls and parses them for LokSeva AI intake.
 */

export interface NtfyAlert {
  id: string;
  time: number;
  topic: string;
  title?: string;
  rawMessage: string;
  extractedText: string;
  callerId?: string;
  category?: string;
  priority?: string;
  receivedAt: string;
}

export type NtfyConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ParseResult {
  extractedText: string;
  callerId?: string;
  category?: string;
  priority?: string;
}

/**
 * Intelligently parse raw incoming alert messages from citizen helpline PBX / speech-to-text recorders.
 */
export function parseNtfyMessage(rawMessage: string, _title?: string): ParseResult {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return { extractedText: '' };
  }

  const cleanRaw = rawMessage.trim();

  // 1. Look for English Translation
  const englishMatch = cleanRaw.match(/(?:🌐\s*English Translation|English Translation):\s*["“]?([^"”\n\r]+)["”]?/i);
  // 2. Look for Citizen Spoke
  const spokeMatch = cleanRaw.match(/(?:🗣️\s*Citizen Spoke[^\n:]*|Citizen Spoke[^\n:]*):\s*["“]?([^"”\n\r]+)["”]?/i);
  // 3. Look for Call Reference or Caller ID
  const refMatch = cleanRaw.match(/(?:🆔\s*Call Reference|Call Reference|Ref(?:erence)?\s*ID):\s*([A-Za-z0-9\-_]+)/i);
  const phoneMatch = cleanRaw.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3,5}\)?[- ]?\d{3,5}[- ]?\d{0,5}/);
  // 4. Look for Category
  const catMatch = cleanRaw.match(/(?:📋\s*Category|Category):\s*([^\n\r]+)/i);
  // 5. Look for Priority
  const prioMatch = cleanRaw.match(/(?:⚠️\s*Priority|Priority):\s*([A-Za-z0-9\-_]+)/i);

  let callerId = refMatch ? refMatch[1].trim() : undefined;
  if (!callerId && phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
    callerId = phoneMatch[0].trim();
  }

  let extractedText = '';

  if (englishMatch && englishMatch[1].trim()) {
    const englishText = englishMatch[1].trim();
    const spokeText = spokeMatch ? spokeMatch[1].trim() : '';

    if (spokeText && spokeText !== englishText) {
      extractedText = `${englishText} [Citizen Spoke: "${spokeText}"]`;
    } else {
      extractedText = englishText;
    }
  } else if (spokeMatch && spokeMatch[1].trim()) {
    extractedText = spokeMatch[1].trim();
  } else {
    // If it's a plain message or custom format, strip unnecessary header banners if present
    const stripped = cleanRaw
      .replace(/^📞\s*JAN SUVIDHA Citizen Helpline\s*═+/i, '')
      .replace(/^═+/i, '')
      .trim();
    extractedText = stripped || cleanRaw;
  }

  return {
    extractedText: extractedText || cleanRaw,
    callerId,
    category: catMatch ? catMatch[1].trim() : undefined,
    priority: prioMatch ? prioMatch[1].trim() : undefined,
  };
}

export class NtfyListener {
  private topic: string;
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private statusListeners: Set<(status: NtfyConnectionStatus) => void> = new Set();
  private alertListeners: Set<(alert: NtfyAlert) => void> = new Set();
  private status: NtfyConnectionStatus = 'disconnected';
  private seenIds: Set<string> = new Set();
  private isDestroyed = false;

  constructor(topic: string = 'jan-suvidha-alerts') {
    this.topic = topic.trim();
  }

  public getTopic(): string {
    return this.topic;
  }

  public getStatus(): NtfyConnectionStatus {
    return this.status;
  }

  public setTopic(newTopic: string) {
    if (this.topic === newTopic) return;
    this.topic = newTopic.trim();
    this.reconnect();
  }

  public onStatusChange(callback: (status: NtfyConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public onAlert(callback: (alert: NtfyAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  private updateStatus(newStatus: NtfyConnectionStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public connect() {
    this.isDestroyed = false;
    this.cleanup();
    this.updateStatus('connecting');

    // 1. Initial backfill check: fetch recent alerts from the last 12 hours so the user doesn't miss recent items
    this.fetchRecentAlerts();

    // 2. Open EventSource for live SSE streaming
    try {
      const sseUrl = `https://ntfy.sh/${encodeURIComponent(this.topic)}/sse`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        if (this.isDestroyed) return;
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        if (this.isDestroyed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message') {
            this.handleIncomingRaw(data);
          }
        } catch {
          // ignore keepalive or ping non-json events
        }
      };

      this.eventSource.onerror = () => {
        if (this.isDestroyed) return;
        this.updateStatus('error');
        // Start polling fallback in case SSE is blocked by client proxy or connection drops
        this.startPollFallback();
      };
    } catch (err) {
      console.warn('[ntfy] EventSource failed to initialize, starting polling fallback:', err);
      this.updateStatus('error');
      this.startPollFallback();
    }
  }

  private async fetchRecentAlerts() {
    try {
      const resp = await fetch(`https://ntfy.sh/${encodeURIComponent(this.topic)}/json?poll=1`);
      if (!resp.ok) return;
      const text = await resp.text();
      // ntfy /json?poll=1 returns newline-delimited JSON
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          if (item.event === 'message') {
            this.handleIncomingRaw(item, true); // true = historical
          }
        } catch {
          // continue
        }
      }
    } catch {
      // offline or unreachable
    }
  }

  private startPollFallback() {
    if (this.pollInterval || this.isDestroyed) return;
    this.pollInterval = setInterval(async () => {
      try {
        const resp = await fetch(
          `https://ntfy.sh/${encodeURIComponent(this.topic)}/json?poll=1&since=30s`
        );
        if (resp.ok) {
          this.updateStatus('connected');
          const text = await resp.text();
          const lines = text.trim().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const item = JSON.parse(line);
              if (item.event === 'message') {
                this.handleIncomingRaw(item);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        this.updateStatus('error');
      }
    }, 5000);
  }

  private handleIncomingRaw(data: any, isInitialBackfill = false) {
    if (!data || !data.id || this.seenIds.has(data.id)) {
      return;
    }
    this.seenIds.add(data.id);

    const parsed = parseNtfyMessage(data.message || '', data.title);

    const alert: NtfyAlert = {
      id: data.id,
      time: data.time || Math.floor(Date.now() / 1000),
      topic: data.topic || this.topic,
      title: data.title,
      rawMessage: data.message || '',
      extractedText: parsed.extractedText,
      callerId: parsed.callerId,
      category: parsed.category,
      priority: parsed.priority,
      receivedAt: new Date().toISOString(),
    };

    // If it's live or within the last 15 minutes, dispatch to listeners
    const ageSeconds = Math.floor(Date.now() / 1000) - alert.time;
    // Notify alert listeners
    this.alertListeners.forEach((fn) => {
      try {
        fn(alert);
      } catch (err) {
        console.error('[ntfy] Error in alert callback:', err);
      }
    });
  }

  public reconnect() {
    this.cleanup();
    this.connect();
  }

  public disconnect() {
    this.cleanup();
    this.updateStatus('disconnected');
  }

  private cleanup() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.cleanup();
    this.statusListeners.clear();
    this.alertListeners.clear();
  }
}
