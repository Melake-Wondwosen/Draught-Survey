// Apps Script web app URL (the draught survey's own backend, see apps-script/Survey.gs).
// Paste the URL ending in /exec from Deploy > New deployment > Web app.
export const API_URL = 'https://script.google.com/macros/s/AKfycbyqUpaqYL5yrL9OQEVA2DQvBNVAFgT0vECy33ZJf2T2-p_KDBe_3FapnAgksJ4HqRCKaQ/exec'

// Demo builds (vite --mode demo) never call the server.
export const DEMO = import.meta.env.MODE === 'demo'

// The questions themselves are in src/questionnaire.js

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
