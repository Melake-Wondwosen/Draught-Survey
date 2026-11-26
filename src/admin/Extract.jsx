import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { managerData } from '../api'
import { Button, Notice, Segmented, Sheet, Spinner, inputClass } from '../components/ui'
import { latestPerOutlet, text } from '../manager/calc'
import { CONFIG, GROUPS, mergeQuestions, sheetColumns } from '../questionnaire'
import { download, workbook } from '../xlsx'

// Survey details before the answers, and GPS details after them
const FRONT = [
  ['date', 'Date'], ['id', 'Survey ID'], ['baName', 'BA'], ['baId', 'BA ID'], ['outletId', 'Outlet ID'], ['outletName', 'Outlet'],
  ['area', 'Area'], ['division', 'Division'], ['agent', 'Agent'], ['parentTerritory', 'Parent territory'], ['territory', 'Territory'],
  ['group', 'Outlet group'], ['skipped', 'Sections skipped'],
]
const BACK = [
  ['distanceM', 'Distance from outlet (m)'], ['lat', 'Latitude'], ['lng', 'Longitude'], ['accuracy', 'GPS accuracy (m)'],
  ['startedAt', 'Survey started'], ['startLat', 'Start latitude'], ['startLng', 'Start longitude'],
]
// Kept as text so IDs like 00123 stay as typed
const TEXT = new Set(['id', 'baId', 'outletId', 'baName', 'outletName'])
const KNOWN = new Set([...FRONT, ...BACK].map(([k]) => k).concat(['startAccuracy', 'token']))

const day = (d) => {
  const x = new Date(d)
  return isNaN(x) ? '' : `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const stamp = (d) => {
  const x = new Date(d)
  return isNaN(x) ? text(d) : `${day(x)} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}
const cell = (v) => {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return v
  const s = String(v).replace(/^'/, '')
  return /^-?\d+(\.\d+)?$/.test(s) && s.length < 15 && !/^0\d/.test(s) ? Number(s) : s
}

export function ExtractButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Extract" className="btn-hover inline-flex items-center justify-center gap-2 text-sm text-gold border border-gold/40 rounded-full w-10 sm:w-auto sm:px-4 h-10 shrink-0 hover:bg-gold hover:text-ink">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
        <span className="hidden sm:inline">Extract</span>
      </button>
      {/* Outside the black header, so the panel keeps the page's text colours */}
      {open && createPortal(<div className="text-ink"><ExtractSheet onClose={() => setOpen(false)} /></div>, document.body)}
    </>
  )
}

function ExtractSheet({ onClose }) {
  const [surveys, setSurveys] = useState(null)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('all')
  const [from, setFrom] = useState(() => day(new Date(Date.now() - 6 * 864e5)))
  const [to, setTo] = useState(() => day(new Date()))
  const [group, setGroup] = useState('')
  const [division, setDivision] = useState('')
  const [latest, setLatest] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    managerData('', new Date().toISOString())
      .then((d) => setSurveys(d.surveys || []))
      .catch((e) => setError(e.message))
  }, [])

  const divisions = useMemo(() => [...new Set((surveys || []).map((s) => text(s.division).trim()).filter(Boolean))].sort(), [surveys])

  const rows = useMemo(() => {
    if (!surveys) return []
    const now = new Date()
    const start =
      period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === '30' ? new Date(now - 30 * 864e5)
      : period === 'custom' ? new Date(from + 'T00:00:00')
      : null
    const end = period === 'custom' ? new Date(to + 'T23:59:59') : null
    let list = surveys.filter((s) => {
      const d = new Date(s.date)
      if (start && d < start) return false
      if (end && d > end) return false
      if (group && text(s.group) !== group) return false
      if (division && text(s.division).trim() !== division) return false
      return true
    })
    if (latest) list = latestPerOutlet(list)
    return list.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [surveys, period, from, to, group, division, latest])

  const outlets = new Set(rows.map((s) => text(s.outletId))).size

  function make() {
    // Every question that ever had answers, turned off ones included, in survey order
    const cols = sheetColumns(mergeQuestions(CONFIG))
    const seen = new Set(cols.map((c) => c.key))
    const extra = [...new Set(rows.flatMap((s) => Object.keys(s)))].filter((k) => !seen.has(k) && !KNOWN.has(k))
    const all = [
      ...FRONT.map(([key, header]) => ({ key, header })),
      ...cols,
      ...extra.map((key) => ({ key, header: key })),
      ...BACK.map(([key, header]) => ({ key, header })),
    ]
    // Leave out answer columns that are empty in every row
    const used = all.filter((c) => FRONT.some(([k]) => k === c.key) || rows.some((s) => s[c.key] !== '' && s[c.key] != null))
    const data = [used.map((c) => c.header)].concat(
      rows.map((s) => used.map((c) => (c.key === 'date' || c.key === 'startedAt' ? stamp(s[c.key]) : TEXT.has(c.key) ? text(s[c.key]).replace(/^'/, '') : cell(s[c.key])))),
    )
    const guide = [['Column in this file', 'Column in the Surveys tab']].concat(used.map((c) => [c.header, c.key]))
    const name = period === 'all' ? `all_to_${day(new Date())}` : period === 'custom' ? `${from}_to_${to}` : period === 'month' ? day(new Date()).slice(0, 7) : `last_30_days_to_${day(new Date())}`
    download(workbook([{ name: 'Surveys', rows: data }, { name: 'Columns', rows: guide }]), `Draught_Survey_${name}.xlsx`)
    setDone(true)
  }

  return (
    <Sheet
      title="Extract surveys"
      onClose={onClose}
      footer={
        <Button variant="gold" disabled={!surveys || !rows.length} onClick={make}>
          {surveys ? `Download Excel (${rows.length} ${rows.length === 1 ? 'survey' : 'surveys'})` : <Spinner />}
        </Button>
      }
    >
      <p className="text-sm text-ink/60 -mt-1">One row per survey, one column per answer, with the outlet, BA and GPS details. A second tab lists each column's name in the Surveys tab.</p>
      {error && <Notice>{error}</Notice>}
      <div>
        <p className="text-sm font-semibold text-ink/80 mb-1.5">Period</p>
        <Segmented value={period} onChange={setPeriod} options={[{ value: 'all', label: 'All' }, { value: 'month', label: 'This month' }, { value: '30', label: '30 days' }, { value: 'custom', label: 'Dates' }]} />
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs font-semibold text-ink/60">From<input type="date" className={`${inputClass} mt-1`} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-xs font-semibold text-ink/60">To<input type="date" className={`${inputClass} mt-1`} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-semibold text-ink/80">Outlet group
          <select className={`${inputClass} mt-1.5`} value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All groups</option>
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-ink/80">Division
          <select className={`${inputClass} mt-1.5`} value={division} onChange={(e) => setDivision(e.target.value)}>
            <option value="">All divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[#C9A227]" checked={latest} onChange={(e) => setLatest(e.target.checked)} />
        <span className="text-sm">Latest visit per outlet only</span>
      </label>
      {surveys && (
        <p className="text-sm text-ink/70">
          {rows.length ? `${rows.length} ${rows.length === 1 ? 'survey' : 'surveys'} from ${outlets} ${outlets === 1 ? 'outlet' : 'outlets'}.` : 'No surveys match.'}
          {done && ' Downloaded. Check your downloads folder.'}
        </p>
      )}
    </Sheet>
  )
}
