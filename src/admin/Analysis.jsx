import { useCallback, useEffect, useMemo, useState } from 'react'
import { managerData } from '../api'
import { GROUPS, HB, QUESTIONS, SECTIONS, SG, qTitle } from '../questionnaire'
import { answerRate, groupCounts, groupShort, kegShare, latestPerOutlet, num, opportunity, pct, text } from '../manager/calc'
import { Notice, Spinner } from '../components/ui'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All' },
]
const SPLITS = [
  { key: 'area', label: 'Area' },
  { key: 'territory', label: 'Territory' },
  { key: 'group', label: 'Group' },
  { key: 'baName', label: 'BA' },
]
const TRIAL_YES = ['Yes, now', 'Yes, after contract ends']

function dayStart(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d
}
function periodFrom(key) {
  if (key === 'today') return dayStart().toISOString()
  if (key === '7d') return dayStart(6).toISOString()
  if (key === '30d') return dayStart(29).toISOString()
  return ''
}
const label = (v) => text(v).trim() || 'Not set'
const fmt = (n) => (n == null ? '–' : Math.round(n).toLocaleString())
const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)
const one = (v) => (v == null ? '–' : v.toFixed(1))

// Counts of each answer to one question, among outlets that answered it
function optionCounts(outlets, key, options, multi) {
  const asked = outlets.filter((s) => text(s[key]).trim())
  const rows = options.map((o) => {
    const c = asked.filter((s) => (multi ? text(s[key]).split(', ').includes(o) : text(s[key]).trim() === o)).length
    return { label: o, count: c, rate: asked.length ? c / asked.length : null }
  })
  return { asked: asked.length, rows }
}

export default function Analysis() {
  const [period, setPeriod] = useState('30d')
  const [area, setArea] = useState('')
  const [group, setGroup] = useState('')
  const [split, setSplit] = useState('area')
  const [surveys, setSurveys] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      // trackFrom = now keeps the GPS trail out of the reply; this screen doesn't use it
      const d = await managerData(periodFrom(period), new Date().toISOString())
      setSurveys(d.surveys || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const areas = useMemo(() => [...new Set((surveys || []).map((s) => label(s.area)))].sort(), [surveys])
  const rows = useMemo(() => (surveys || []).filter((s) => (!area || label(s.area) === area) && (!group || text(s.group) === group)), [surveys, area, group])
  const outlets = useMemo(() => latestPerOutlet(rows), [rows])
  const share = useMemo(() => kegShare(rows), [rows])
  const groups = useMemo(() => groupCounts(rows, GROUPS), [rows])
  const trial = useMemo(() => answerRate(rows, 'm_trial', TRIAL_YES), [rows])
  const order = useMemo(() => answerRate(rows, 'c_wouldOrder', ['Yes']), [rows])
  const bas = useMemo(() => new Set(rows.map((s) => text(s.baId))).size, [rows])
  const opp = useMemo(() => opportunity(rows), [rows])
  const hbShare = share.rows.find((r) => r.ours)?.share

  const splitRows = useMemo(() => {
    const by = new Map()
    for (const s of rows) {
      const k = split === 'group' ? groupShort(s.group) || 'Not set' : label(s[split])
      if (!by.has(k)) by.set(k, [])
      by.get(k).push(s)
    }
    return [...by.entries()]
      .map(([name, list]) => {
        const sh = kegShare(list)
        return {
          name,
          surveys: list.length,
          outlets: sh.outlets,
          kegs: sh.total,
          hb: sh.rows.find((r) => r.ours)?.share,
          trial: answerRate(list, 'm_trial', TRIAL_YES).rate,
          order: answerRate(list, 'c_wouldOrder', ['Yes']).rate,
        }
      })
      .sort((a, b) => b.outlets - a.outlets || b.surveys - a.surveys)
  }, [rows, split])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-white border border-ink/10 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3.5 h-9 rounded-full text-sm font-semibold transition-colors ${period === p.key ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="h-11 rounded-full bg-white border border-ink/10 px-4 text-sm font-semibold outline-none focus:border-gold">
          <option value="">All areas</option>
          {areas.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="h-11 max-w-full rounded-full bg-white border border-ink/10 px-4 text-sm font-semibold outline-none focus:border-gold">
          <option value="">All outlet groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="btn-hover ml-auto h-11 px-4 rounded-full border border-ink/15 text-sm font-semibold hover:border-gold disabled:opacity-60"
        >
          {busy ? <Spinner /> : 'Refresh'}
        </button>
      </div>

      {error && <Notice>{error}</Notice>}
      {!surveys && !error && <div className="skeleton h-40 rounded-2xl" />}

      {surveys && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Tile label="Surveys" value={fmt(rows.length)} />
            <Tile label="Outlets" value={fmt(outlets.length)} />
            <Tile label="Active BAs" value={fmt(bas)} />
            <Tile label="Habesha keg share" value={pct(hbShare)} gold />
            <Tile label="Accept a trial" value={pct(trial.rate)} gold />
            <Tile label="Would order Habesha" value={pct(order.rate)} gold />
          </div>

          {!rows.length ? (
            <p className="rounded-2xl bg-white border border-ink/10 p-8 text-center text-ink/60">No surveys in this period.</p>
          ) : (
            <>
              <Opportunity opp={opp} />

              <div className="grid lg:grid-cols-2 gap-4">
                <Card title="Draught keg share" sub={`${share.counted} of ${share.outlets} outlets gave keg counts · ${fmt(share.total)} kegs a week`}>
                  <Bars rows={share.rows.map((r) => ({ label: r.label, rate: r.share, extra: `${fmt(r.kegs)} kegs`, gold: r.ours }))} />
                </Card>
                <Card title="Outlet groups" sub={`${outlets.length} outlets, latest visit each`}>
                  <Bars rows={groups.map((g) => ({ label: g.label, rate: g.of ? g.count / g.of : null, extra: `${g.count}` }))} wide />
                </Card>
              </div>

              <Card
                title={`By ${SPLITS.find((g) => g.key === split).label.toLowerCase()}`}
                right={
                  <div className="inline-flex rounded-full bg-mist p-1">
                    {SPLITS.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setSplit(g.key)}
                        className={`px-3 h-8 rounded-full text-xs font-semibold transition-colors ${split === g.key ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="max-h-[440px] overflow-y-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-[11px] uppercase tracking-wider text-gold-dark text-left">
                        <th className="py-2 px-1 font-semibold w-[30%]">{SPLITS.find((g) => g.key === split).label}</th>
                        <th className="py-2 px-1 font-semibold text-right">Outlets</th>
                        <th className="py-2 px-1 font-semibold text-right hidden sm:table-cell">Kegs/week</th>
                        <th className="py-2 px-1 font-semibold text-right">Habesha share</th>
                        <th className="py-2 px-1 font-semibold text-right hidden sm:table-cell">Trial</th>
                        <th className="py-2 px-1 font-semibold text-right hidden sm:table-cell">Would order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitRows.map((g) => (
                        <tr key={g.name} className="border-t border-ink/8">
                          <td className="py-2.5 px-1 font-semibold truncate" title={g.name}>{g.name}</td>
                          <td className="py-2.5 px-1 text-right tabular-nums">{fmt(g.outlets)}</td>
                          <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">{fmt(g.kegs)}</td>
                          <td className="py-2.5 px-1 text-right tabular-nums font-semibold">{pct(g.hb)}</td>
                          <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">{pct(g.trial)}</td>
                          <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">{pct(g.order)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {SECTIONS.map((sec, si) => (
                <QuestionResults key={sec.id} section={sec} n={si + 1} outlets={outlets} />
              ))}

              <Invites rows={rows} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function QuestionResults({ section, n, outlets }) {
  const qs = QUESTIONS.filter((q) => q.section === section.id)
  const reached = outlets.filter((s) => !text(s.skipped).includes(section.short)).length
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mt-2 mb-3 px-1">
        <h2 className="font-serif text-2xl">
          {n}. {section.title}
        </h2>
        <p className="text-xs text-ink/55">{reached} of {outlets.length} outlets answered this section</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {qs.map((q, i) => (
          <QuestionCard key={q.key} q={q} n={i + 1} outlets={outlets} />
        ))}
      </div>
    </section>
  )
}

function QuestionCard({ q, n, outlets }) {
  let body = null
  let base = 0
  if (q.type === 'single' || q.type === 'multi') {
    const r = optionCounts(outlets, q.key, q.options, q.type === 'multi')
    base = r.asked
    const ticks = <Bars rows={[...r.rows].sort((a, b) => b.count - a.count).map((x) => ({ label: x.label, rate: x.rate, extra: `${x.count}` }))} wide />
    if (q.main) {
      const m = optionCounts(outlets, q.main.key, q.options.filter((o) => o !== q.none))
      body = (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gold-dark mb-1.5">Matters most</p>
            <Bars rows={[...m.rows].filter((x) => x.count).sort((a, b) => b.count - a.count).map((x) => ({ label: x.label, rate: x.rate, extra: `${x.count}`, gold: true }))} wide />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gold-dark mb-1.5">Ticked at all</p>
            {ticks}
          </div>
        </div>
      )
    } else body = ticks
  } else if (q.type === 'pair') {
    const parts = q.parts.map((p) => ({ p, r: optionCounts(outlets, p.key, p.options) }))
    base = parts[0].r.asked
    body = (
      <div className="space-y-4">
        {parts.map(({ p, r }, i) => (
          <div key={p.key}>
            {i > 0 && <p className="text-[11px] uppercase tracking-wider text-gold-dark mb-1.5">{p.label}</p>}
            <Bars rows={r.rows.map((x) => ({ label: x.label, rate: x.rate, extra: `${x.count}`, gold: x.label === HB }))} wide={p.options.some((o) => o.length > 12)} />
          </div>
        ))}
      </div>
    )
  } else if (q.type === 'numbers') {
    const per = q.fields.map((f) => {
      const vals = outlets.map((s) => num(s[f.key])).filter((v) => v != null)
      return { ...f, avg: avg(vals), sum: vals.reduce((x, y) => x + y, 0), n: vals.length }
    })
    base = Math.max(0, ...per.map((p) => p.n))
    if (q.share) {
      // Shares of the total, e.g. men and women among waiters
      const total = per.reduce((x, p) => x + p.sum, 0)
      body = <Bars rows={per.map((p) => ({ label: p.label, rate: total ? p.sum / total : null, extra: `${one(p.avg)} on average` }))} />
    } else {
      const max = Math.max(0.0001, ...per.map((p) => p.avg || 0))
      body = <Bars rows={per.map((p) => ({ label: p.label, rate: (p.avg || 0) / max, show: `${one(p.avg)}`, extra: p.unit || q.unit, gold: p.label === HB }))} wide={per.some((p) => p.label.length > 12)} />
    }
  } else if (q.type === 'rating') {
    const per = q.rows.map(([r, l]) => {
      const sg = outlets.map((s) => num(s[`${q.prefix}${r}SG`])).filter((v) => v != null)
      const hb = outlets.map((s) => num(s[`${q.prefix}${r}HB`])).filter((v) => v != null)
      return { label: l, sg: avg(sg), hb: avg(hb), n: Math.max(sg.length, hb.length) }
    })
    base = Math.max(0, ...per.map((p) => p.n))
    body = (
      <div className="space-y-2.5">
        <div className="flex gap-4 text-[11px] uppercase tracking-wider text-ink/55">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-ink-soft" />{SG}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full gold-gradient" />{HB}</span>
          <span className="ml-auto">Average of 5</span>
        </div>
        {per.map((p) => (
          <div key={p.label} className="grid grid-cols-[80px_minmax(0,1fr)_74px] gap-3 items-center text-sm">
            <span className="text-ink/75">{p.label}</span>
            <span className="space-y-1">
              <span className="block h-2 rounded-full bg-mist overflow-hidden"><span className="block h-full rounded-full bg-ink-soft" style={{ width: `${((p.sg || 0) / 5) * 100}%` }} /></span>
              <span className="block h-2 rounded-full bg-mist overflow-hidden"><span className="block h-full rounded-full gold-gradient" style={{ width: `${((p.hb || 0) / 5) * 100}%` }} /></span>
            </span>
            <span className="text-right tabular-nums text-xs">
              {one(p.sg)} <span className="text-ink/35">/</span> <b className="text-gold-dark">{one(p.hb)}</b>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-white border border-ink/10 p-4 min-w-0">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-7 h-7 shrink-0 rounded-full bg-ink text-gold text-xs font-bold flex items-center justify-center">{n}</span>
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{qTitle(q)}</p>
          <p className="text-xs text-ink/50 mt-0.5">{base ? `${base} outlets answered` : 'No answers yet'}</p>
        </div>
      </div>
      {base ? body : null}
    </div>
  )
}

function Bars({ rows, wide }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className={`grid ${wide ? 'grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_64px]' : 'grid-cols-[96px_minmax(0,1fr)_64px]'} gap-3 items-center text-sm`}>
          <span className="text-ink/75 truncate" title={r.label}>{r.label}</span>
          <span className="h-2.5 rounded-full bg-mist overflow-hidden">
            <span className={`block h-full rounded-full ${r.gold ? 'gold-gradient' : 'bg-ink-soft'}`} style={{ width: `${Math.min(1, r.rate || 0) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">
            <b>{r.show ?? pct(r.rate).replace('.0%', '%')}</b>
            {r.extra && <span className="block text-[10px] text-ink/45 leading-tight">{r.extra}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

function Tile({ label, value, gold }) {
  return (
    <div className={`rounded-2xl p-4 border ${gold ? 'bg-ink text-paper border-ink' : 'bg-white border-ink/10'}`}>
      <p className={`font-serif text-2xl tabular-nums ${gold ? 'text-gold' : ''}`}>{value}</p>
      <p className={`text-[11px] uppercase tracking-wider mt-1 ${gold ? 'text-paper/60' : 'text-gold-dark'}`}>{label}</p>
    </div>
  )
}

function Card({ title, sub, right, children }) {
  return (
    <section className="rounded-2xl bg-white border border-ink/10 p-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h2 className="font-serif text-xl">{title}</h2>
          {sub && <p className="text-xs text-ink/55 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

// Consumers who agreed to the paid Q&A, newest first, every visit (not only the latest per outlet)
function Invites({ rows }) {
  const list = rows
    .filter((s) => text(s.c_qaInvite) === 'Yes, they agreed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const asked = rows.filter((s) => text(s.c_qaInvite)).length
  const [copied, setCopied] = useState(false)
  async function copy() {
    const lines = [['Name', 'Phone', 'Best time', 'Outlet', 'Area', 'BA', 'Date'].join('\t')].concat(
      list.map((s) => [text(s.c_qaName), text(s.c_qaPhone), text(s.c_qaWhen), text(s.outletName), text(s.area), text(s.baName), new Date(s.date).toLocaleDateString()].join('\t')),
    )
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <Card
      title="Paid consumer Q&A invites"
      sub={`${list.length} agreed out of ${asked} asked`}
      right={
        list.length > 0 && (
          <button type="button" onClick={copy} className="btn-hover h-9 px-4 rounded-full border border-ink/15 text-sm font-semibold hover:border-gold">
            {copied ? 'Copied' : 'Copy for Excel'}
          </button>
        )
      }
    >
      {!list.length ? (
        <p className="text-sm text-ink/55">Nobody has agreed yet.</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-white">
              <tr className="text-[11px] uppercase tracking-wider text-gold-dark text-left">
                <th className="py-2 px-1 font-semibold">Name</th>
                <th className="py-2 px-1 font-semibold">Phone</th>
                <th className="py-2 px-1 font-semibold hidden sm:table-cell">Best time</th>
                <th className="py-2 px-1 font-semibold">Outlet</th>
                <th className="py-2 px-1 font-semibold hidden md:table-cell">BA</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={text(s.id)} className="border-t border-ink/8">
                  <td className="py-2.5 px-1 font-semibold truncate">{text(s.c_qaName)}</td>
                  <td className="py-2.5 px-1 tabular-nums truncate">{text(s.c_qaPhone)}</td>
                  <td className="py-2.5 px-1 truncate hidden sm:table-cell">{text(s.c_qaWhen) || '–'}</td>
                  <td className="py-2.5 px-1 truncate" title={text(s.outletName)}>{text(s.outletName)}</td>
                  <td className="py-2.5 px-1 truncate hidden md:table-cell">{text(s.baName)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// Weekly Habesha keg gain per outlet: what the manager says they could sell,
// less what they sell now, then weighted by the BA's chance of conversion
function Opportunity({ opp }) {
  const [all, setAll] = useState(false)
  const list = all ? opp.rows : opp.rows.slice(0, 12)
  return (
    <Card title="Habesha keg opportunity" sub={`${opp.outlets} outlets gave a Habesha estimate · kegs a week · latest visit each`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Mini label="Habesha now" value={fmt(opp.now)} />
        <Mini label="Could sell" value={fmt(opp.potential)} />
        <Mini label="Gain" value={`+${fmt(opp.gain)}`} />
        <Mini label="Expected gain" value={`+${fmt(opp.expected)}`} gold />
      </div>
      <p className="text-xs text-ink/50 mb-2">Expected gain = gain x chance of conversion (High 70%, Medium 40%, Low 10%).</p>
      {!opp.rows.length ? (
        <p className="text-sm text-ink/55">No estimates yet.</p>
      ) : (
        <>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="sticky top-0 bg-white">
                <tr className="text-[11px] uppercase tracking-wider text-gold-dark text-left">
                  <th className="py-2 px-1 font-semibold w-[34%]">Outlet</th>
                  <th className="py-2 px-1 font-semibold hidden md:table-cell">Group</th>
                  <th className="py-2 px-1 font-semibold text-right hidden sm:table-cell">All kegs</th>
                  <th className="py-2 px-1 font-semibold text-right">Now</th>
                  <th className="py-2 px-1 font-semibold text-right">Could</th>
                  <th className="py-2 px-1 font-semibold text-right hidden sm:table-cell">Chance</th>
                  <th className="py-2 px-1 font-semibold text-right">Expected</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={text(r.s.id)} className="border-t border-ink/8">
                    <td className="py-2.5 px-1 truncate" title={text(r.s.outletName)}>
                      <span className="font-semibold">{text(r.s.outletName)}</span>
                      <span className="block text-[11px] text-ink/50 truncate">{text(r.s.area) || text(r.s.territory)}{text(r.s.a_barrier) ? ` · ${text(r.s.a_barrier)}` : ''}</span>
                    </td>
                    <td className="py-2.5 px-1 hidden md:table-cell">{groupShort(r.s.group)}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">{fmt(r.total)}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums">{fmt(r.now)}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums">{fmt(r.potential)}</td>
                    <td className="py-2.5 px-1 text-right hidden sm:table-cell">{r.likelihood || '–'}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums font-semibold text-gold-dark">+{r.expected.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {opp.rows.length > 12 && (
            <button type="button" onClick={() => setAll(!all)} className="mt-3 text-sm font-semibold text-gold-dark link-hover">
              {all ? 'Show top 12' : `Show all ${opp.rows.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

function Mini({ label, value, gold }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${gold ? 'bg-ink text-paper' : 'bg-mist/70'}`}>
      <p className={`font-serif text-2xl tabular-nums leading-none ${gold ? 'text-gold' : ''}`}>{value}</p>
      <p className={`text-[11px] mt-1 ${gold ? 'text-paper/65' : 'text-ink/60'}`}>{label}</p>
    </div>
  )
}
