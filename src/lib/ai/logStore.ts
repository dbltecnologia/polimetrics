type LogEntry = {
  id: string;
  type: 'text' | 'image' | 'voice';
  provider: string;
  model?: string;
  status: 'ok' | 'error';
  message?: string;
  promptSnippet?: string;
  timestamp: string;
};

const buffer: LogEntry[] = [];
const MAX = 50;

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  buffer.unshift({
    id: makeId(),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (buffer.length > MAX) buffer.length = MAX;
}

export function getLogs() {
  return buffer;
}
