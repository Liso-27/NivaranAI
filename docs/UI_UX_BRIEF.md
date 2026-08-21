# UI/UX Brief

## 1. Overall Visual Direction
- **Brand Identity:** Nirvana AI / Apada Sathi uses a modern, responsive, and highly technical design language suited for a disaster management platform.
- **Themes:** Support for both Light and Dark modes (`dark:bg-slate-950`).
- **Color Palette (Map & Severity):**
  - **LOW:** `#22C55E` (Green)
  - **MODERATE:** `#EAB308` (Yellow)
  - **HIGH:** `#F97316` (Orange)
  - **EMERGENCY:** `#EF4444` (Red)
- **Typography:** Clean sans-serif fonts natively utilizing Tailwind utility classes.
- **Icons:** Standardized vector icons using `lucide-react`.

## 2. Layout Structure
- **Header:** Top fixed navigation bar containing brand logo, user profile, and theme toggle.
- **News Ticker:** A horizontally scrolling marquee below the header displaying urgent real-time alerts.
- **Tab Navigation (Role-Based):**
  - **Citizen:** Map, Safe Places, Reports, News.
  - **Govt Official:** Command, Triage, Camps, Map.
  - **System Admin:** Overview, Scheduler, Health, Users, Logs.
- **Main View Area:** Scrollable or fixed (for Map) container rendering the active tab component.

## 3. Component Details

### 3.1 Interactive Map (DisasterMap)
- **Engine:** Leaflet (`react-leaflet` or vanilla integration).
- **Hazard Visualization:** Semi-transparent circles (`affected_radius_km`) colored by severity overlaying the BMC wards.
- **Popups:** Clicking a zone opens a preview tooltip with Risk Score, Confidence, and an action CTA to view detailed insights.
- **Safe Place Pins:** Cyan/Emerald pins representing verified government camps and shelters.

### 3.2 Citizen UI
- **Citizen Dashboard:** Centralized hub for map interaction and location-based threat warnings.
- **Safe Place Finder:** List/Grid view of nearby safe locations with routing/distance indicators.
- **Notification Settings:** Modal (`NotificationSettingsModal`) to configure SMS and Push preferences.

### 3.3 Government UI
- **Gov Command Center:** High-density telemetry cards showing aggregate risks and active incidents.
- **Report Triage View:** Table or card list of pending citizen reports with inline "Verify" and "Reject" action buttons.
- **Camp Manager View:** Interface for creating camps and sliding/updating capacity meters.

### 3.4 Feedback & States
- **Loading:** Global overlay spinner (`Loader2`) with blur backdrop when syncing BMC telemetry.
- **Error States:** Rose-colored inline alert boxes (`bg-rose-50`) with "Retry" buttons.
- **Responsive:** Mobile-first Tailwind grid/flex layouts ensuring full usability on mobile devices during field emergencies.
