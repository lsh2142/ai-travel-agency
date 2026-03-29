export const MONITOR_JOBS_KEY = 'monitor_jobs';

export interface MonitorJob {
  jobId: string;
  accommodationName: string;
  url: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  telegramId: string;
  registeredAt: string;
}
