import { MonitorScheduler } from './scheduler';

declare global {
  // eslint-disable-next-line no-var
  var __monitorScheduler: MonitorScheduler | undefined;
}

export const monitorScheduler: MonitorScheduler =
  globalThis.__monitorScheduler ?? new MonitorScheduler();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__monitorScheduler = monitorScheduler;
}

export { MonitorScheduler };
export type { MonitorJobData } from './scheduler';
