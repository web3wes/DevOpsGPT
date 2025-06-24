export interface ILogEvent {
  id: string;
  repo: string;
  buildId: string;
  timestamp: string; // ISO 8601
  logUrl: string;
}

export * from './lib/types.js';
