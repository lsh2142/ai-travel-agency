import { serpapiActivityProvider } from './serpapi-provider'
import { mockActivityProvider } from './mock-provider'
import type { ActivityProvider } from './types'

export const activityProvider: ActivityProvider =
  process.env.SERPAPI_KEY ? serpapiActivityProvider : mockActivityProvider

export { mockActivityProvider } from './mock-provider'
export { serpapiActivityProvider } from './serpapi-provider'
export type { ActivityProvider, ActivitySearchParams, ActivityResult, ActivityCategory } from './types'
