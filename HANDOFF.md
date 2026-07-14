# Itinero Agency Portal — Developer Handoff

## What This Is
A B2B SaaS web app for travel agencies. Agents log in, build itineraries for their clients, and clients view their trip in a mobile-friendly portal using a trip code (no account needed).

## Live URL
https://itinero-portal-three.vercel.app

## Repos & Access
- **GitHub:** https://github.com/ashtongreer121-bit/itinero-portal
- **Vercel:** itinero-portal project under ashtons-projects-abfff6c7
- **Supabase project ID:** qqyrcoytdcekmpeokege (us-east-1)

## Local Setup
```bash
git clone https://github.com/ashtongreer121-bit/itinero-portal.git
cd itinero-portal
npm install
# Create .env.local with the 4 keys below
npm run dev
```

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://qqyrcoytdcekmpeokege.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from owner>
ANTHROPIC_API_KEY=<get from owner>
RESEND_API_KEY=<get from owner>
```

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind v4)
- **Auth + DB:** Supabase (Postgres + RLS + Auth)
- **AI:** Anthropic SDK (`claude-sonnet-4-5`) for event suggestions and email drafting
- **Email:** Resend for sending itineraries and reminders
- **Drag-drop:** @dnd-kit/core + @dnd-kit/sortable
- **Deployment:** Vercel (auto-deploys on push to main)

## Project Structure
```
src/
  app/
    api/                        # All API routes
      ai/suggest/route.ts       # AI event suggestions
      ai/draft-email/route.ts   # AI email drafting
      trips/[id]/events/        # CRUD for trip events
      trips/[id]/send-email/    # Send itinerary via Resend
      trips/[id]/reminders/     # Scheduled reminder emails
      trips/[id]/documents/     # File/link attachments
      trips/[id]/collaborators/ # Team member invites
      trips/[id]/duplicate/     # Duplicate a trip
      trips/[id]/save-template/ # Save trip as template
      trips/[id]/reorder-events/# Drag-drop sort order
      invoices/                 # Invoice CRUD
      clients/                  # Client CRM CRUD
      templates/                # Trip template CRUD
      agency/settings/          # Branding/agency settings
    dashboard/
      page.tsx                  # Trip list (home)
      trips/[id]/page.tsx       # Trip detail
      trips/[id]/edit/          # Edit trip
      trips/[id]/events/new/    # Add event
      trips/[id]/events/[id]/edit/ # Edit event
      trips/[id]/preview/       # Traveler preview
      trips/[id]/print/         # Print view
      trips/new/                # Create trip
      clients/                  # Client CRM page
      invoices/                 # Invoices page
      analytics/                # Analytics dashboard
      calendar/                 # Calendar view
      templates/                # Trip templates
      settings/                 # Theme + branding settings
    portal/[code]/page.tsx      # Public traveler portal (no login)
    login/page.tsx              # Auth page
  components/
    TripDetailClient.tsx        # Main trip detail (client component wrapper)
    SortableEventList.tsx       # Drag-drop event list (dnd-kit, ssr:false)
    AIAssistPanel.tsx           # Chat-style AI event assistant
    SendItineraryModal.tsx      # Email itinerary to traveler
    CollaboratorsPanel.tsx      # Invite team members
    DocumentsPanel.tsx          # Trip file/link attachments
    ReminderScheduler.tsx       # Schedule automated reminder emails
    InvoiceManager.tsx          # Invoice creation and management
    ClientsManager.tsx          # Client CRM
    AnalyticsDashboard.tsx      # Stats, charts, top destinations
    CalendarView.tsx            # Month calendar with trip pills
    BrandingForm.tsx            # Agency logo, color, email name
    TemplatesManager.tsx        # Save and reuse trip templates
    ClientPortalView.tsx        # Branded public trip view
    Sidebar.tsx                 # Nav sidebar
    DashboardClient.tsx         # Trip list with search/filter
  lib/supabase/
    types.ts                    # All TypeScript types
    server.ts                   # Server-side Supabase client
    client.ts                   # Client-side Supabase client
```

## Database Tables (Supabase)
| Table | Purpose |
|---|---|
| `trips` | Core trip records, owned by `owner_id` |
| `events` | Trip events (flights, hotels, restaurants, etc.) |
| `clients` | Agency's client CRM |
| `invoices` | Invoices linked to trips/clients |
| `trip_documents` | Links and files attached to trips |
| `trip_members` | Collaborators with editor/viewer roles |
| `trip_reminders` | Scheduled emails to travelers |
| `trip_templates` | Saved trip structures for reuse |
| `agency_settings` | Per-agency branding and email config |

All tables use Supabase RLS. Trips are scoped by `owner_id = auth.uid()`.  
`trip_members` uses a `SECURITY DEFINER` function `is_trip_owner()` to avoid infinite RLS recursion.

## Key Data Types (src/lib/supabase/types.ts)
- `Trip` — title, destination, start/end date, traveler name/email, color_theme, trip_code
- `TripEvent` — event_type (flight/hotel/restaurant/activity/transfer/carRental/cruise), title, start_time, end_time, location_name, location_address, confirmation_code, notes
- `Client` — name, email, phone, notes
- `Invoice` — line_items (JSON array), status (draft/sent/paid/overdue), amount, due_date
- `TripReminder` — recipient_email, subject, body, send_at, status (pending/sent/failed)
- `AgencySettings` — agency_name, brand_color, logo_url, email_from_name

## How the AI Assist Works
1. User types a natural language request in the chat panel on the trip detail page
2. POST to `/api/ai/suggest` with trip context + existing events + user prompt
3. Server calls `claude-sonnet-4-5` and asks for a JSON array of events
4. Server post-processes times (always overrides with sensible defaults by event type — breakfast 8am, lunch 12:30pm, dinner 7pm, etc.) since the model isn't reliable with times
5. Events are POSTed to `/api/trips/[id]/events` one by one
6. `onEventsAdded` callback updates React state in `TripDetailClient` — no page refresh needed

## How the Traveler Portal Works
- Each trip has a unique `trip_code` (e.g. `ABC-123`)
- Travelers visit `/portal/[code]` — no login required
- Shows agency branding (logo, colors from `agency_settings`), all events grouped by day, Google Maps links, confirmation codes
- Agency shares the link or traveler enters code in the Itinero iOS app

## Known Issues / What's Not Done Yet
- **Reminders never actually send** — the flush endpoint (`PUT /api/trips/[id]/reminders`) exists but nothing calls it on a schedule. Needs a Supabase Edge Function or Vercel cron job.
- **No password reset** flow on login page
- **No onboarding** for new users
- **Invoice emails** have no PDF attachment — just plain text
- **No rate limiting** on AI endpoints
- **Mobile layout** not optimized
- **Sort order** for AI-added events isn't set (can conflict with drag-drop)
- **No toast notifications** — actions succeed/fail silently
- The iOS app and portal use the same Supabase project but different field names (`event_type` in portal vs `category` in iOS app) — they don't share data correctly yet

## Styling System
Uses CSS custom properties (design tokens) defined in `src/app/globals.css`:
- `--bg`, `--surface`, `--border` — backgrounds and borders
- `--text-primary`, `--text-secondary`, `--text-tertiary` — text hierarchy
- `--accent`, `--accent-light`, `--accent-text` — brand color
- `--danger`, `--danger-light` — error states
- Dark mode via `data-theme="dark"` on `<html>` (toggled in Settings, saved to localStorage)
- Never use hardcoded hex colors in components — always use these tokens

## Important Next.js 16 Notes
- `SortableEventList` uses `dynamic(() => import(...), { ssr: false })` to avoid dnd-kit hydration mismatch
- All route params are `Promise<{ id: string }>` — must `await params`
- Server components fetch data directly via Supabase server client; client components use fetch() to API routes
- Stale `.next` cache can cause hot reload issues — fix with `rm -rf .next` and restart

## Deployment
Push to `main` → Vercel auto-deploys. No CI/CD setup needed.  
After deploying, if you add a new domain or change the Vercel URL, update Supabase → Authentication → URL Configuration → Redirect URLs with the new `/auth/callback` URL.
