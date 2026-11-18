import { BRANDS, JUMP_KMH, ONLINE_MS } from '../config'

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
 * Draught market share, from the latest survey per outlet. Outlets that sell
 * no draught are counted apart and left out of every brand figure.
 *
 * Volume share   = brand kegs / all kegs, counted only in outlets where every
 *                  brand on tap has a keg count. Outlets with partial counts
 *                  are left out, because a blank is "unknown", and counting
 *                  the known brands alone would inflate whoever was counted.
 * On tap in      = draught outlets pouring the brand / all draught outlets
 * Ranked #1 in   = draught outlets where the brand is rank 1 / all draught outlets
 * Average rank   = mean rank across outlets that pour the brand
 * Average price  = mean birr per mug across outlets that gave a price
 */
export const isDraught = (s) => text(s.draught) !== 'No'

export function marketShare(surveys) {
  const latest = latestPerOutlet(surveys)
  const outlets = latest.filter(isDraught)
  const complete = outlets.filter((s) => {
    const sold = BRANDS.filter((b) => num(s['rank' + b.key]) != null)
    return sold.length > 0 && sold.every((b) => num(s['kegs' + b.key]) != null) && sold.some((b) => num(s['kegs' + b.key]) > 0)
  })
  const totalKegs = complete.reduce((sum, s) => sum + BRANDS.reduce((a, b) => a + (num(s['kegs' + b.key]) || 0), 0), 0)
  const n = outlets.length

  const rows = BRANDS.map((b) => {
    const ranks = outlets.map((s) => num(s['rank' + b.key])).filter((r) => r != null)
    const kegs = complete.reduce((a, s) => a + (num(s['kegs' + b.key]) || 0), 0)
    const prices = outlets.map((s) => (num(s['rank' + b.key]) != null ? num(s['price' + b.key]) : null)).filter((p) => p != null && p > 0)
    return {
      key: b.key,
      label: b.label,
      ours: !!b.ours,
      kegs,
      volumeShare: totalKegs ? kegs / totalKegs : null,
      sellingIn: n ? ranks.length / n : null,
      sellingCount: ranks.length,
      topIn: n ? ranks.filter((r) => r === 1).length / n : null,
      topCount: ranks.filter((r) => r === 1).length,
      avgRank: ranks.length ? ranks.reduce((a, r) => a + r, 0) / ranks.length : null,
      avgPrice: prices.length ? prices.reduce((a, p) => a + p, 0) / prices.length : null,
      priceCount: prices.length,
    }
  })
  return { outlets: n, noDraught: latest.length - n, volumeOutlets: complete.length, totalKegs, surveys: surveys.length, rows }
}

// Condition of the Habesha dispenser in outlets that pour Habesha (latest survey per outlet)
export function dispenserStats(surveys, states) {
  const asked = latestPerOutlet(surveys).filter((s) => isDraught(s) && text(s.dispenserHabesha))
  const n = asked.length
  return {
    asked: n,
    rows: states.map((d) => {
      const c = asked.filter((s) => text(s.dispenserHabesha) === d.key).length
      return { ...d, count: c, rate: n ? c / n : null }
    }),
  }
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
export const topBrand = (s) => {
  if (!isDraught(s)) return 'No draught'
  const b = BRANDS.find((b) => num(s['rank' + b.key]) === 1)
  if (!b) return '–'
  return b.key === 'Other' && text(s.otherBrandName) ? text(s.otherBrandName) : b.label
}
export { text, num }
