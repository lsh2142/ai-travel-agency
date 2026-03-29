import type { TripItinerary, ItineraryItem, BookingStatus } from './types';

const STORAGE_KEY = 'trip_itineraries';

function readStorage(): TripItinerary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TripItinerary[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(itineraries: TripItinerary[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itineraries));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getItineraries(): TripItinerary[] {
  return readStorage();
}

export function getItinerary(id: string): TripItinerary | null {
  return readStorage().find((it) => it.id === id) ?? null;
}

export function createItinerary(
  data: Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>,
): TripItinerary {
  const now = new Date().toISOString();
  const itinerary: TripItinerary = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = readStorage();
  writeStorage([...all, itinerary]);
  return itinerary;
}

export function addItemToItinerary(
  itineraryId: string,
  item: Omit<ItineraryItem, 'id'>,
): ItineraryItem {
  const all = readStorage();
  const idx = all.findIndex((it) => it.id === itineraryId);
  if (idx === -1) throw new Error(`Itinerary not found: ${itineraryId}`);

  const newItem: ItineraryItem = { ...item, id: generateId() };
  all[idx] = {
    ...all[idx],
    items: [...all[idx].items, newItem],
    updatedAt: new Date().toISOString(),
  };
  writeStorage(all);
  return newItem;
}

export function updateItemStatus(
  itineraryId: string,
  itemId: string,
  status: BookingStatus,
  reference?: string,
): void {
  const all = readStorage();
  const idx = all.findIndex((it) => it.id === itineraryId);
  if (idx === -1) throw new Error(`Itinerary not found: ${itineraryId}`);

  all[idx] = {
    ...all[idx],
    items: all[idx].items.map((item) =>
      item.id === itemId
        ? { ...item, bookingStatus: status, ...(reference ? { bookingReference: reference } : {}) }
        : item,
    ),
    updatedAt: new Date().toISOString(),
  };
  writeStorage(all);
}

export function deleteItem(itineraryId: string, itemId: string): void {
  const all = readStorage();
  const idx = all.findIndex((it) => it.id === itineraryId);
  if (idx === -1) throw new Error(`Itinerary not found: ${itineraryId}`);

  all[idx] = {
    ...all[idx],
    items: all[idx].items.filter((item) => item.id !== itemId),
    updatedAt: new Date().toISOString(),
  };
  writeStorage(all);
}
