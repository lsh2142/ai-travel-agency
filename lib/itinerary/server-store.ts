/**
 * Server-side in-memory itinerary store (in-process singleton).
 * Follows the same DbAdapter fallback pattern used in lib/db/.
 * Replace with a Supabase adapter when auth/persistence is wired up.
 */
import type { TripItinerary } from './types';

export const itineraryServerStore = new Map<string, TripItinerary>();
