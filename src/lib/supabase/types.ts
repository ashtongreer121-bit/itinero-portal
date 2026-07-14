export type EventType = 'flight' | 'hotel' | 'restaurant' | 'activity' | 'transfer' | 'carRental' | 'cruise'

export interface Trip {
  id: string
  trip_code: string
  title: string
  destination: string | null
  start_date: string
  end_date: string
  color_theme: string
  traveler_name: string | null
  traveler_email: string | null
  notes: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TripEvent {
  id: string
  trip_id: string
  event_type: EventType
  title: string
  start_time: string
  end_time: string | null
  location_name: string | null
  location_address: string | null
  latitude: number | null
  longitude: number | null
  confirmation_code: string | null
  notes: string | null
  notify_minutes_before: number | null
  metadata: Record<string, string> | null
  created_at: string
  updated_at: string
}

export type NewTrip = Omit<Trip, 'id' | 'trip_code' | 'owner_id' | 'created_at' | 'updated_at'>
export type NewEvent = Omit<TripEvent, 'id' | 'created_at' | 'updated_at'>

export interface Client {
  id: string
  owner_id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TripTemplate {
  id: string
  owner_id: string
  name: string
  description: string | null
  destination: string | null
  duration_days: number | null
  color_theme: string
  trip_data: Record<string, unknown>
  events_data: unknown[]
  created_at: string
}

export interface TripDocument {
  id: string
  trip_id: string
  name: string
  type: 'link' | 'document' | 'image'
  url: string
  notes: string | null
  created_at: string
}

export interface AgencySettings {
  id: string
  owner_id: string
  agency_name: string | null
  brand_color: string
  logo_url: string | null
  email_from_name: string | null
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string | null
  email: string | null
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted'
  invited_at: string
}

export interface Invoice {
  id: string
  owner_id: string
  trip_id: string | null
  client_id: string | null
  invoice_number: string | null
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  amount: number
  currency: string
  due_date: string | null
  line_items: { description: string; quantity: number; unit_price: number }[]
  notes: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface TripReminder {
  id: string
  owner_id: string
  trip_id: string
  recipient_email: string
  subject: string
  body: string
  send_at: string
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> }
      events: { Row: TripEvent; Insert: Partial<TripEvent>; Update: Partial<TripEvent> }
    }
  }
}
