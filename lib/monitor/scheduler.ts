import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { BrowserMonitor } from './browser';
import { TelegramNotifier } from '@/lib/notify/telegram';
import type { BookingSite } from '@/types';

export interface MonitorJobData {
  jobId: string;
  url: string;
  site: BookingSite;
  checkIn: string;
  checkOut: string;
  guests: number;
  accommodationName: string;
  userId: string;
  telegramChatId?: string;
}

export class MonitorScheduler {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private connection: IORedis | null = null;
  private isAvailable = false;

  constructor(redisUrl?: string) {
    try {
      const conn = new IORedis(redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      conn.on('error', (err: Error) => {
        if (this.isAvailable) {
          console.warn('[MonitorScheduler] Redis connection error:', err.message);
          this.isAvailable = false;
        }
      });

      conn.connect()
        .then(() => {
          this.connection = conn;
          this.queue = new Queue('monitor-jobs', {
            connection: this.connection,
            defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            },
          });
          this.isAvailable = true;
          console.info('[MonitorScheduler] Redis connected successfully');
        })
        .catch((err: Error) => {
          console.warn('[MonitorScheduler] Redis connection failed, scheduler disabled:', err.message);
          this.isAvailable = false;
        });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[MonitorScheduler] Failed to initialize Redis, scheduler disabled:', message);
      this.isAvailable = false;
    }
  }

  async addJob(data: MonitorJobData, intervalMs = 5 * 60 * 1000): Promise<string> {
    if (!this.isAvailable || !this.queue) {
      console.warn('[MonitorScheduler] addJob skipped: Redis unavailable');
      return data.jobId;
    }
    const job = await this.queue.add('check-availability', data, {
      repeat: { every: intervalMs },
      jobId: data.jobId,
    });

    return job.id ?? data.jobId;
  }

  async listJobs(): Promise<{ jobId: string; name: string; next: number | null }[]> {
    if (!this.isAvailable || !this.queue) {
      return [];
    }
    const repeatableJobs = await this.queue.getRepeatableJobs();
    return repeatableJobs.map((j) => ({
      jobId: j.id ?? j.key,
      name: j.name,
      next: j.next ?? null,
    }));
  }

  async removeJob(jobId: string): Promise<void> {
    if (!this.isAvailable || !this.queue) {
      console.warn('[MonitorScheduler] removeJob skipped: Redis unavailable');
      return;
    }
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const job = repeatableJobs.find((j) => j.id === jobId || j.key.includes(jobId));
    if (job) {
      await this.queue.removeRepeatableByKey(job.key);
    }
  }

  startWorker(): void {
    if (!this.isAvailable || !this.connection) {
      console.warn('[MonitorScheduler] startWorker skipped: Redis unavailable');
      return;
    }
    const monitor = new BrowserMonitor();
    const notifier = new TelegramNotifier();

    this.worker = new Worker(
      'monitor-jobs',
      async (job: Job<MonitorJobData>) => {
        const { url, site, checkIn, checkOut, guests, accommodationName, jobId, telegramChatId } = job.data;

        if (!monitor['browser']) {
          await monitor.init();
        }

        const result = await monitor.checkWithFallback(url, site, checkIn, checkOut, guests);

        if (result.available) {
          await notifier.notifyAvailability(
            accommodationName,
            result.site,
            url,
            checkIn,
            checkOut,
            result.price,
            telegramChatId
          );
        }

        if (result.error) {
          await notifier.notifyError(jobId, result.error, telegramChatId);
        }

        return result;
      },
      { connection: this.connection }
    );
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
  }
}
