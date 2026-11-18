// Made-up data for demo builds only (vite --mode demo). Never shipped to BAs.
import { GROUPS, QUESTIONS, SECTIONS, answersForSheet, isShown, partShown } from './questionnaire'

// Made-up divisions and agents for the demo analysis
const DEMO_GEO = [
  { division: 'North Addis', agent: 'Demo Agent A plc', parentTerritory: 'Addis Ababa Gullele', territory: 'Addis Ababa Aware' },
  { division: 'North Addis', agent: 'Demo Agent B plc', parentTerritory: 'Addis Ababa Yeka', territory: 'Addis Ababa Megenagna' },
  { division: 'South Addis', agent: 'Demo Agent C plc', parentTerritory: 'Addis Ababa Kirkos', territory: 'Addis Ababa Kazanchis' },
  { division: 'South Addis', agent: 'Demo Agent D plc', parentTerritory: 'Addis Ababa Bole', territory: 'Addis Ababa Bole Medhanialem' },
]

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = (a) => a[Math.floor(rnd() * a.length)]

const NAMES = ['Hana Tesfaye', 'Abel Kebede', 'Selam Girma', 'Dawit Alemu', 'Meron Haile', 'Yonas Bekele', 'Liya Mesfin', 'Kaleab Tadesse']
const PLACES = ['Bole', 'Piassa', 'Kazanchis', 'Megenagna', 'Sarbet', 'CMC', 'Merkato', 'Gerji', 'Lebu', 'Ayat']
const KINDS = ['Bar', 'Lounge', 'Draught House', 'Hotel', 'Restaurant', 'Pub']
const CENTER = { lat: 9.0108, lng: 38.7613 }

let cache = null

function build() {
  const now = Date.now()
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const bas = NAMES.map((name, i) => ({ id: `BA-${String(i + 1).padStart(2, '0')}`, name, username: name.split(' ')[0].toLowerCase() }))
  const home = bas.map(() => ({ lat: CENTER.lat + (rnd() - 0.5) * 0.09, lng: CENTER.lng + (rnd() - 0.5) * 0.11 }))

  const outlets = Array.from({ length: 70 }, (_, i) => {
    const b = Math.floor(rnd() * bas.length)
    const geo = DEMO_GEO[b % DEMO_GEO.length]
    return { id: `AA-${String(1000 + i)}`, name: `${pick(PLACES)} ${pick(KINDS)}`, ba: b, lat: home[b].lat + (rnd() - 0.5) * 0.02, lng: home[b].lng + (rnd() - 0.5) * 0.02, ...geo }
  })

  // Answers to the Draught Market Visit Questionnaire, made up but shaped like the real thing
  const surveys = []
  const weight = (opts, bias) => (bias && rnd() < 0.45 ? bias : pick(opts))
  outlets.forEach((o, i) => {
    const visits = rnd() < 0.15 ? 2 : 1
    for (let v = 0; v < visits; v++) {
      const ageDays = i < 14 && v === visits - 1 ? 0 : Math.floor(rnd() * 28) + 1
      const when = ageDays === 0 ? start.getTime() + (8 + rnd() * Math.max(1, (now - start.getTime()) / 3.6e6 - 8)) * 3.6e6 : now - ageDays * 864e5 - rnd() * 8 * 3.6e6
      const group = weight(GROUPS, GROUPS[1])
      const a = { group }
      const skipped = []
      SECTIONS.forEach((sec) => {
        if (rnd() < 0.12) return skipped.push(sec.id)
        QUESTIONS.filter((q) => q.section === sec.id).forEach((q) => {
          if (!isShown(q, a)) return
          if (q.type === 'single') {
            a[q.key] = q.key === 'm_soldHabesha' ? (group === GROUPS[1] ? 'No' : 'Yes') : weight(q.options, q.options.includes('St. George') ? 'St. George' : null)
            if (q.other && a[q.key] === q.other) a[q.key + 'Other'] = 'Partner'
            if (q.key === 'c_qaInvite') a[q.key] = rnd() < 0.3 ? q.options[0] : rnd() < 0.5 ? q.options[1] : q.options[2]
            if (q.follow && q.follow.when.includes(a[q.key])) {
              const sample = { m_agreementEnds: ['March 2027', 'June 2027', 'End of 2027'], c_qaName: ['Dawit', 'Samuel', 'Biruk', 'Yonas', 'Meron', 'Abel'], c_qaPhone: ['0911 23 45 67', '0912 76 54 32', '0913 11 22 33', '0921 45 67 89'], c_qaWhen: ['Saturday afternoon', 'Weekday evening', 'Sunday morning'] }
              q.follow.fields.forEach((f) => { a[f.key] = pick(sample[f.key] || ['Sample']) })
            }
          } else if (q.type === 'multi') {
            a[q.key] = rnd() < 0.3 ? ['None'] : q.options.filter((x) => x !== 'None' && rnd() < 0.4)
            if (!a[q.key].length) a[q.key] = ['St. George']
          } else if (q.type === 'numbers') {
            q.fields.forEach((f, j) => {
              if (rnd() < 0.15) return
              const hb = f.label === 'Habesha'
              const OBS = { o_tables: 8 + rnd() * 22, o_drinkersNow: 3 + rnd() * 25, o_waitersMen: 1 + rnd() * 4, o_waitersWomen: 1 + rnd() * 6 }
              a[f.key] = f.key in OBS ? Math.round(OBS[f.key]) : q.max ? Math.floor(rnd() * (hb ? 3 : 6)) : Math.round((hb ? (group === GROUPS[2] ? 8 : 2) : j === 0 ? 10 : 2) * (0.4 + rnd()))
            })
          } else if (q.type === 'rating') {
            q.rows.forEach(([r]) => {
              a[`${q.prefix}${r}SG`] = 3 + Math.floor(rnd() * 3)
              a[`${q.prefix}${r}HB`] = 2 + Math.floor(rnd() * 3)
            })
          } else if (q.type === 'pair') {
            q.parts.forEach((p) => { if (partShown(p, a)) a[p.key] = pick(p.options) })
          }
        })
      })
      surveys.push({
        id: `SRV-${Math.round(when)}-${i}${v}`, date: new Date(Math.min(when, now - 60000)).toISOString(), baId: bas[o.ba].id, baName: bas[o.ba].name,
        outletId: o.id, outletName: o.name, area: pick(['Lebu', 'Kality', 'Ayat', 'Fiyelbet', 'Megenagna', 'Gerji']), division: o.division, agent: o.agent, parentTerritory: o.parentTerritory, territory: o.territory,
        lat: o.lat, lng: o.lng, accuracy: 10 + Math.round(rnd() * 25),
        group, skipped: SECTIONS.filter((x) => skipped.includes(x.id)).map((x) => x.short).join(', '),
        ...answersForSheet(a, skipped),
      })
    }
  })

  const presence = []
  const track = []
  bas.forEach((ba, i) => {
    if (i === 7) return // never opened the app today
    const online = i < 5
    const lastSeen = online ? now - rnd() * 4 * 60000 : now - (40 + i * 35) * 60000
    let p = { ...home[i] }
    for (let t = start.getTime() + 8.5 * 3.6e6; t <= lastSeen; t += 3 * 60000) {
      p = { lat: p.lat + (rnd() - 0.5) * 0.0012, lng: p.lng + (rnd() - 0.5) * 0.0012 }
      track.push({ date: new Date(t).toISOString(), baId: ba.id, baName: ba.name, lat: p.lat, lng: p.lng, accuracy: 8 + Math.round(rnd() * 20), activity: 'On home screen' })
    }
    if (i === 3 && track.length) track.push({ date: new Date(lastSeen - 60000).toISOString(), baId: ba.id, baName: ba.name, lat: 9.6, lng: 39.4, accuracy: 3, activity: 'On home screen' })
    const mine = surveys.filter((s) => s.baId === ba.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    presence.push({
      baId: ba.id, baName: ba.name, lastSeen: new Date(lastSeen).toISOString(), state: online ? 'online' : 'offline',
      activity: online ? (i % 2 ? `Surveying ${mine?.outletName} (${mine?.outletId}), question ${2 + (i % 4)} of 10` : 'On home screen') : 'App closed or in background',
      lat: p.lat, lng: p.lng, accuracy: 12, locTime: new Date(lastSeen).toISOString(), device: 'Android demo',
    })
  })
  const flags = [{ date: new Date(now - 50 * 60000).toISOString(), baId: 'BA-06', baName: NAMES[5], type: 'devtools', detail: 'Debugger attached' }]
  return { bas, presence, surveys, track, flags }
}

function demoManagerData(from) {
  cache = cache || build()
  return { ok: true, serverTime: new Date().toISOString(), ...cache, surveys: cache.surveys.filter((s) => !from || s.date >= from), notes: demoNotes('manager') }
}

// Stand-in backend for demo builds. Changes live in memory until reload.
let admin = null
function adminState() {
  if (admin) return admin
  cache = cache || build()
  const outlets = []
  cache.surveys.forEach((s) => {
    if (!outlets.some((o) => o.outletId === s.outletId)) outlets.push({ key: 'OUT-' + s.outletId, outletId: s.outletId, outletName: s.outletName, lat: s.lat, lng: s.lng, status: 'active', createdAt: s.date, updatedAt: s.date })
  })
  // A handful of outlets right around the demo phone, so the 100 m list has something to show
  ;[['Meskel Corner Bar', 25, 10], ['Selam Lounge', -40, 35], ['Abebe Draught House', 60, -45], ['Tsion Pub', -15, -70], ['Habesha Garden', 80, 30], ['Arada Draught Bar', -85, -20], ['Bole View Hotel', 150, 140]].forEach(([name, dy, dx], i) => {
    outlets.push({ key: 'OUT-N' + i, outletId: 'AA-' + (900 + i), outletName: name, lat: CENTER.lat + dy / 111320, lng: CENTER.lng + dx / 109900, status: 'active', createdAt: new Date().toISOString() })
  })
  outlets.push({ key: 'OUT-NOLOC', outletId: 'AA-999', outletName: 'Unmapped Kiosk', lat: '', lng: '', status: 'active', createdAt: new Date().toISOString() })
  outlets.push({ key: 'OUT-REQ1', outletId: '', outletName: 'Tsehay Lounge', status: 'pending', requestedBy: 'BA-03', requestedByName: NAMES[2], lat: 9.0, lng: 38.8, createdAt: new Date(Date.now() - 3 * 3.6e6).toISOString() })
  admin = {
    users: [
      ...cache.bas.map((b) => ({ ...b, role: 'ba', active: true, lastSeen: cache.presence.find((p) => p.baId === b.id)?.lastSeen || '' })),
      { id: 'M-01', name: 'Demo Manager', username: 'manager', role: 'manager', active: true },
      { id: 'A-01', name: 'Demo Admin', username: 'admin', role: 'admin', active: true },
    ],
    outlets,
    notices: [{ id: 'NTF-1', date: new Date(Date.now() - 864e5).toISOString(), fromName: 'Demo Admin', target: 'ba', kind: 'notice', title: 'Draught market visits start Monday', body: 'Talk to the owner or manager first, then the bar staff, then one draught drinker.' }],
  }
  return admin
}

function demoNotes(role) {
  const a = adminState()
  const notes = a.notices.filter((n) => n.target === 'all' || n.target === role).map((n) => ({ ...n, from: n.fromName }))
  if (role !== 'ba') cache.flags.filter((f) => f.status !== 'resolved').forEach((f) => notes.push({ id: 'flag:' + f.date, date: f.date, kind: 'flag', title: f.baName + ': Developer tools detected', body: f.detail }))
  if (role === 'admin') a.outlets.filter((o) => o.status === 'pending').forEach((o) => notes.push({ id: 'req:' + o.key, date: o.createdAt, kind: 'request', title: 'New outlet request', body: o.outletName + ' from ' + o.requestedByName }))
  return notes.sort((x, y) => (x.date < y.date ? 1 : -1))
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function demoCall(action, p) {
  await wait(350)
  const a = adminState()
  const role = /admin/i.test(p.username || '') ? 'admin' : /manager|melake/i.test(p.username || '') ? 'manager' : 'ba'
  switch (action) {
    case 'surveyLogin': {
      if (p.need && p.need !== role) throw new Error('This account is not an admin account. (Demo: use a username containing "admin".)')
      const name = p.username.trim() || 'Demo BA'
      return { ok: true, user: { id: role === 'ba' ? 'BA-01' : role === 'admin' ? 'A-01' : 'M-01', name, username: name, role, token: 'demo' } }
    }
    case 'ping':
    case 'notifications':
      return { ok: true, notes: demoNotes('ba'), outletsVersion: String(a.ver || 1) }
    case 'outletPack': {
      const dict = ['North Addis', 'Demo Agent plc', 'Addis Ababa Gullele', 'Addis Ababa Aware']
      const rows = a.outlets.filter((o) => o.status === 'active' && o.outletId).map((o) => [o.outletId, o.outletName, 0, 1, 2, 3])
      return { ok: true, version: 'demo|', division: 'North Addis', dict, rows }
    }
    case 'lookupOutlet': {
      const id = String(p.outletId || '').trim().toUpperCase()
      const o = a.outlets.find((x) => x.status === 'active' && x.outletId === id)
      return o
        ? { ok: true, found: true, outlet: { outletId: id, outletName: o.outletName, division: 'North Addis', agent: 'Demo Agent plc', parentTerritory: 'Addis Ababa Gullele', territory: 'Addis Ababa Aware' } }
        : { ok: true, found: false }
    }
    case 'outlets':
      return { ok: true, version: String(a.ver || 1), list: a.outlets.filter((o) => o.status === 'active').map((o) => [o.outletId, o.outletName, o.lat ?? '', o.lng ?? '']) }
    case 'managerData':
      return demoManagerData(p.from)
    case 'adminData':
      return { ok: true, serverTime: new Date().toISOString(), users: a.users, outlets: a.outlets, flags: cache.flags.map((f, i) => ({ id: f.id || 'F' + i, status: 'open', ...f })), notices: a.notices, notes: demoNotes('admin') }
    case 'saveUser': {
      const u = p.user
      const i = a.users.findIndex((x) => x.id === u.originalId)
      const row = { id: u.id || u.username, name: u.name, username: u.username, role: u.role, active: u.active !== false }
      if (i > -1) a.users[i] = { ...a.users[i], ...row }
      else a.users.push(row)
      return { ok: true }
    }
    case 'saveOutlet': {
      a.ver = (a.ver || 1) + 1
      const o = p.outlet
      const i = a.outlets.findIndex((x) => x.key === o.key)
      if (i > -1) a.outlets[i] = { ...a.outlets[i], ...o, updatedAt: new Date().toISOString() }
      else a.outlets.push({ ...o, key: 'OUT-' + Date.now(), createdAt: new Date().toISOString() })
      return { ok: true }
    }
    case 'importOutlets':
      a.ver = (a.ver || 1) + 1
      p.rows.forEach((r) => a.outlets.push({ key: 'OUT-' + r[0], outletId: String(r[0]).toUpperCase(), outletName: r[1], lat: r[2] === '' ? '' : Number(r[2]), lng: r[3] === '' ? '' : Number(r[3]), status: 'active' }))
      return { ok: true, added: p.rows.length, updated: 0, skipped: 0 }
    case 'resolveFlag':
      cache.flags.forEach((f) => { if ((f.id || '') === p.id || 'F0' === p.id) f.status = 'resolved' })
      return { ok: true }
    case 'sendNotice':
      a.notices.push({ id: 'NTF-' + Date.now(), date: new Date().toISOString(), fromName: 'Demo Admin', target: p.target, kind: 'notice', title: p.title, body: p.body })
      return { ok: true }
    case 'requestOutlet':
      a.outlets.push({ key: 'OUT-' + Date.now(), outletId: p.outletId || '', outletName: p.outletName, lat: p.location?.lat ?? '', lng: p.location?.lng ?? '', status: 'pending', requestedBy: 'BA-01', requestedByName: 'You', createdAt: new Date().toISOString() })
      return { ok: true }
    case 'addSurvey':
      if (!navigator.onLine) throw new Error('No connection. Could not reach the server.')
      return { ok: true }
    case 'flag':
      return { ok: true }
  }
  throw new Error('Not available in the demo.')
}
