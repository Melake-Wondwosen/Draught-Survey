import { JUMP_KMH, ONLINE_MS } from '../config'

const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v))
const text = (v) => String(v ?? '').replace(/^'/, '')
const ms = (iso) => (iso ? new Date(iso).getTime() : 0)

// One survey per outlet: the latest. Repeat visits would otherwise count twice.
export function latestPerOutlet(surveys) {
  const byOutlet = new Map()
  for (const s of surveys) {
    const key = text(s.outletId).trim().toUpperCase()
    if (!key) continue
    const prev = byOutlet.get(key)
    if (!prev || ms(s.date) > ms(prev.date)) byOutlet.set(key, s)
  }
  return [...byOutlet.values()]
}

/*
 * Draught keg share from the manager's weekly keg counts (Q1.2), latest
 * survey per outlet. Only outlets that gave a count for both St. George and
 * Habesha are used; a blank "Other" counts as none. A blank is "unknown", so
 * counting one brand alone would inflate it.
 */
const KEG_BRANDS = [
  { key: 'StGeorge', label: 'St. George', col: 'm_kegsStGeorge' },
  { key: 'Habesha', label: 'Habesha', col: 'm_kegsHabesha', ours: true },
  { key: 'Other', label: 'Other', col: 'm_kegsOther' },
]

export function kegShare(surveys) {
  const outlets = latestPerOutlet(surveys)
  const counted = outlets.filter((s) => num(s.m_kegsStGeorge) != null && num(s.m_kegsHabesha) != null)
  const total = counted.reduce((sum, s) => sum + KEG_BRANDS.reduce((a, b) => a + (num(s[b.col]) || 0), 0), 0)
  const rows = KEG_BRANDS.map((b) => {
    const kegs = counted.reduce((a, s) => a + (num(s[b.col]) || 0), 0)
    return { ...b, kegs, share: total ? kegs / total : null }
  })
  return { outlets: outlets.length, counted: counted.length, total, rows }
}

/*
 * Habesha opportunity per outlet, latest visit each.
 * Now       = Habesha kegs a week today (blank counts as 0)
 * Potential = Habesha kegs a week the manager says they could sell
 * Gain      = potential - now, never below 0
 * Expected  = gain x the BA's chance of conversion (High 0.7, Medium 0.4, Low 0.1;
 *             no assessment counts as Medium)
 */
export const LIKELIHOOD = { High: 0.7, Medium: 0.4, Low: 0.1 }
export function opportunity(surveys) {
  const rows = latestPerOutlet(surveys)
    .filter((s) => num(s.m_hbPotential) != null)
    .map((s) => {
      const now = num(s.m_kegsHabesha) || 0
      const potential = num(s.m_hbPotential)
      const gain = Math.max(0, potential - now)
      const chance = LIKELIHOOD[text(s.a_likelihood)] ?? LIKELIHOOD.Medium
      const total = ['m_kegsStGeorge', 'm_kegsHabesha', 'm_kegsOther'].reduce((a, k) => a + (num(s[k]) || 0), 0)
      return { s, now, potential, gain, chance, expected: gain * chance, total, likelihood: text(s.a_likelihood) }
    })
    .sort((a, b) => b.expected - a.expected || b.gain - a.gain)
  const sum = (k) => rows.reduce((a, r) => a + r[k], 0)
  return { rows, outlets: rows.length, now: sum('now'), potential: sum('potential'), gain: sum('gain'), expected: sum('expected') }
}

// Share of answers that match `values`, among outlets that answered `key`
export function answerRate(surveys, key, values) {
  const asked = latestPerOutlet(surveys).filter((s) => text(s[key]).trim())
  const yes = asked.filter((s) => values.includes(text(s[key]).trim()))
  return { asked: asked.length, count: yes.length, rate: asked.length ? yes.length / asked.length : null }
}

export function groupCounts(surveys, groups) {
  const outlets = latestPerOutlet(surveys)
  return groups.map((g) => ({ label: g, count: outlets.filter((s) => text(s.group) === g).length, of: outlets.length }))
}

export function haversineKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Location points that imply impossible travel. Usually a fake-GPS app.
export function locationJumps(points) {
  const out = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const hours = (ms(b.date) - ms(a.date)) / 3.6e6
    const km = haversineKm(a, b)
    if (km > 1 && hours > 0 && km / hours > JUMP_KMH) out.push({ at: b.date, km: Math.round(km), kmh: Math.round(km / hours) })
  }
  return out
}

export function teamStatus({ bas, presence, surveys, track, flags }, nowMs, dayStartMs) {
  const pres = new Map(presence.map((p) => [text(p.baId), p]))
  return bas
    .map((ba) => {
      const p = pres.get(ba.id)
      const lastSeen = ms(p?.lastSeen)
      const online = !!p && p.state === 'online' && nowMs - lastSeen < ONLINE_MS
      const mine = surveys.filter((s) => text(s.baId) === ba.id).sort((a, b) => ms(b.date) - ms(a.date))
      const points = track
        .filter((t) => text(t.baId) === ba.id && num(t.lat) != null)
        .map((t) => ({ date: t.date, lat: num(t.lat), lng: num(t.lng), accuracy: num(t.accuracy), activity: text(t.activity) }))
        .sort((a, b) => ms(a.date) - ms(b.date))
      const myFlags = flags.filter((f) => text(f.baId) === ba.id).map((f) => ({ type: text(f.type), at: f.date, detail: text(f.detail) }))
      locationJumps(points).forEach((j) => myFlags.push({ type: 'jump', at: j.at, detail: `${j.km} km at ${j.kmh} km/h` }))
      return {
        ...ba,
        online,
        lastSeen: lastSeen || null,
        seenToday: lastSeen >= dayStartMs,
        activity: text(p?.activity),
        lat: num(p?.lat),
        lng: num(p?.lng),
        accuracy: num(p?.accuracy),
        locTime: ms(p?.locTime) || null,
        device: text(p?.device),
        surveysToday: mine.filter((s) => ms(s.date) >= dayStartMs).length,
        surveysPeriod: mine.length,
        lastSurvey: mine[0] || null,
        track: points,
        flags: myFlags,
      }
    })
    .sort((a, b) => b.online - a.online || (b.lastSeen || 0) - (a.lastSeen || 0) || a.name.localeCompare(b.name))
}

export function ago(fromMs, nowMs) {
  if (!fromMs) return 'never'
  const m = Math.max(0, Math.round((nowMs - fromMs) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

export const birr = (v) => (v == null ? '–' : `${Math.round(v)} birr`)
export const pct = (v) => (v == null ? '–' : `${(v * 100).toFixed(1)}%`)
// One line per survey for lists and map pins: weekly kegs, or the outlet group
export function surveyLine(s) {
  const sg = num(s.m_kegsStGeorge)
  const hb = num(s.m_kegsHabesha)
  if (sg != null || hb != null) return `St. George ${sg ?? '–'} · Habesha ${hb ?? '–'} kegs`
  return text(s.group) || 'No keg count'
}
const SHORT_GROUP = { 'Lost Habesha outlet': 'Lost', 'St. George-dominant (never Habesha)': 'St. George', 'Active Habesha outlet': 'Active' }
export const groupShort = (g) => SHORT_GROUP[text(g)] || text(g)
export { text, num }
