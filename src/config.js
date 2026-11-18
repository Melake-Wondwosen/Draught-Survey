// Apps Script web app URL (the draught survey's own backend, see apps-script/Survey.gs).
// Paste the URL ending in /exec from Deploy > New deployment > Web app.
export const API_URL = ''

// Demo builds (vite --mode demo) never call the server.
export const DEMO = import.meta.env.MODE === 'demo'

// Draught brands, in screen order. `key` becomes the sheet column suffix:
// rankHabesha, kegsHabesha, priceHabesha, ... Keep this list the same as
// SURVEY_BRANDS in apps-script/Survey.gs.
export const BRANDS = [
  { key: 'BGI', label: 'BGI' },
  { key: 'Heineken', label: 'Heineken' },
  { key: 'Dashen', label: 'Dashen' },
  { key: 'Habesha', label: 'Habesha', ours: true },
  { key: 'Anbesa', label: 'Anbesa' },
  { key: 'Kegna', label: 'Kegna' },
  { key: 'Other', label: 'Other' },
]

// Step 5: condition of the Habesha dispenser. Saved in the sheet as the label.
export const DISPENSER_STATES = [
  { key: 'Working', label: 'Working well' },
  { key: 'Not cooling', label: 'Pours warm' },
  { key: 'Not working', label: 'Not working' },
]

// Step 5: Habesha draught visibility. `key` becomes the sheet column: posmTapTower, ...
export const VISIBILITY_ITEMS = [
  { key: 'TapTower', label: 'Branded tap tower' },
  { key: 'Mugs', label: 'Habesha mugs' },
  { key: 'DripTray', label: 'Drip tray / bar mat' },
  { key: 'PriceBoard', label: 'Draught price board' },
  { key: 'Poster', label: 'Poster' },
  { key: 'Banner', label: 'Banner' },
  { key: 'LightBox', label: 'Light box' },
]

// BAs only see outlets whose coordinates are within this distance of their phone
export const OUTLET_RANGE_M = 100

export const RETURN_HOME_MS = 1200
export const REQUEST_TIMEOUT_MS = 20000

// Presence. A BA's phone reports location and activity this often while the app is open.
export const PING_MS = 3 * 60 * 1000
// Counted as online if the last report is newer than this
export const ONLINE_MS = 7 * 60 * 1000
// Manager dashboard refresh
export const MANAGER_REFRESH_MS = 60 * 1000
// Two location points further apart than this speed get flagged as a jump
export const JUMP_KMH = 150

// Lock the app when developer tools are attached. Off while running `npm run dev`.
export const LOCK_DEVTOOLS = !import.meta.env.DEV
