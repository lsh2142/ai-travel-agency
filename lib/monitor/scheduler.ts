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
  private queue: Queue;
  private worker: Worker | null = null;
  private connection: IORedis;

  constructor(redisUrl?: string) {
    this.connection = new IORedis(redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue('monitor-jobs', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }

  async addJob(data: MonitorJobData, intervalMs = 5 * 60 * 1000): Promise<string> {
    const job = await this.queue.add('check-availability', data, {
      repeat: { every: intervalMs },
      jobId: data.jobId,
    });

    return job.id ?? data.jobId;
  }

  async removeJob(jobId: string): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const job = repeatableJobs.find((j) => j.id === jobId || j.key.includes(jobId));
    if (job) {
      await this.queue.removeRepeatableByKey(job.key);
    }
  }

  startWorker(): void {
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
    await this.queue.close();
    await this.connection.quit();
  }
}
