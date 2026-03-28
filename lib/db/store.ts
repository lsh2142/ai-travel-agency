import type { ChatMessage, MonitorStatus } from '@/types';

export interface ChatSessionRecord {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorJobRecord {
  id: string;
  accommodationId: string;
  url: string;
  site: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  accommodationName: string;
  userId: string;
  status: MonitorStatus;
  createdAt: Date;
  lastCheckedAt: Date | null;
}

const chatSessions = new Map<string, ChatSessionRecord>();
const monitorJobs = new Map<string, MonitorJobRecord>();

export const memoryStore = {
  async saveChatSession(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const existing = chatSessions.get(sessionId);
    chatSessions.set(sessionId, {
      sessionId,
      messages,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
  },

  async getChatSession(sessionId: string): Promise<ChatMessage[] | null> {
    return chatSessions.get(sessionId)?.messages ?? null;
  },

  async saveMonitorJob(job: MonitorJobRecord): Promise<void> {
    monitorJobs.set(job.id, job);
  },

  async getMonitorJobs(): Promise<MonitorJobRecord[]> {
    return Array.from(monitorJobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  async getMonitorJob(jobId: string): Promise<MonitorJobRecord | null> {
    return monitorJobs.get(jobId) ?? null;
  },

  async deleteMonitorJob(jobId: string): Promise<boolean> {
    return monitorJobs.delete(jobId);
  },
};
