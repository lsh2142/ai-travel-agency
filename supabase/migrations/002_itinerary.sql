-- Trip itineraries

CREATE TABLE trip_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itinerary items

CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES trip_itineraries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('flight', 'accommodation', 'car_rental', 'activity')),
  item_date DATE,
  title TEXT NOT NULL,
  description TEXT,
  booking_status TEXT DEFAULT 'planned' CHECK (booking_status IN ('planned', 'booked', 'confirmed')),
  booking_url TEXT,
  booking_reference TEXT,
  price DECIMAL,
  currency TEXT DEFAULT 'KRW',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security

ALTER TABLE trip_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own itineraries" ON trip_itineraries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own items" ON itinerary_items
  FOR ALL USING (
    itinerary_id IN (SELECT id FROM trip_itineraries WHERE user_id = auth.uid())
  );

-- Indexes

CREATE INDEX idx_trip_itineraries_user_id ON trip_itineraries (user_id);
CREATE INDEX idx_itinerary_items_itinerary_id ON itinerary_items (itinerary_id);
