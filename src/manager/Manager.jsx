import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { managerData } from '../api'
import { MANAGER_REFRESH_MS } from '../config'
import { clearUser, getUser } from '../storage'
import { Emblem, SignOutButton, Spinner } from '../components/ui'
import Bell from '../components/Bell'
import { clearNotesMemory, setServerNotes } from '../notes'
import MapView from './MapView'
import { GROUPS } from '../questionnaire'
import { ago, answerRate, groupCounts, groupShort, kegShare, pct, surveyLine, teamStatus, text } from './calc'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All' },
]

function dayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function periodFrom(key) {
  if (key === 'today') return dayStart().toISOString()
  if (key === '7d') return new Date(dayStart().getTime() - 6 * 864e5).toISOString()
  if (key === '30d') return new Date(dayStart().getTime() - 29 * 864e5).toISOString()
  return ''
}

const FLAG_LABEL = { devtools: 'Dev tools', 'location-off': 'Location off', jump: 'GPS jump', 'out-of-range': 'Away from outlet' }
const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const dateTime = (iso) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Manager() {
  const navigate = useNavigate()
  const user = getUser()
  const [period, setPeriod] = useState('today')
  const [data, setData] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const d = await managerData(periodFrom(period), dayStart().toISOString())
      setData(d)
      setServerNotes(d.notes)
      setFetchedAt(Date.now())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [period])

  useEffect(() => {
    load()
    const t = setInterval(load, MANAGER_REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  // Use the server clock so a manager's phone with the wrong time doesn't mark everyone offline
  const serverNow = data?.serverTime ? new Date(data.serverTime).getTime() + (now - fetchedAt) : now

  const team = useMemo(
    () => (data ? teamStatus({ bas: data.bas, presence: data.presence, surveys: data.surveys, track: data.track, flags: data.flags }, serverNow, dayStart().getTime()) : []),
    [data, serverNow],
  )
  const share = useMemo(() => (data ? kegShare(data.surveys) : null), [data])
  const groups = useMemo(() => (data ? groupCounts(data.surveys, GROUPS) : []), [data])
  const trial = useMemo(() => (data ? answerRate(data.surveys, 'm_trial', ['Yes, now', 'Yes, after contract ends']) : null), [data])
  const order = useMemo(() => (data ? answerRate(data.surveys, 'c_wouldOrder', ['Yes']) : null), [data])
  const recent = useMemo(() => (data ? [...data.surveys].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15) : []), [data])

  function signOut() {
    clearNotesMemory()
    clearUser()
    navigate('/login', { replace: true })
  }

  const online = team.filter((b) => b.online).length
  const activeToday = team.filter((b) => b.seenToday).length
  const outlets = share?.outlets ?? 0

  return (
    <main className="min-h-full safe-bottom anim-fade">
      <header className="relative z-[1200] bg-ink text-paper safe-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-4">
          <div className="flex items-center gap-2 min-[380px]:gap-3">
            <Emblem className="w-11 h-11 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-gold truncate">{data?.division ? `Manager · ${data.division}` : user.role === 'admin' ? 'Manager view · All divisions' : 'Manager'}</p>
              <p className="font-serif text-lg truncate">{user.name}</p>
            </div>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn-hover hidden sm:inline-flex items-center text-sm text-gold border border-gold/40 rounded-full px-4 min-h-[40px] hover:bg-gold hover:text-ink">
                Admin console
              </Link>
            )}
            <Bell onOpenItem={(n) => n.kind === 'flag' && setSelected(team.find((b) => n.title.startsWith(b.name + ':'))?.id ?? null)} />
            <SignOutButton onClick={signOut} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-paper/10 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 sm:px-4 min-h-[34px] rounded-full text-sm font-semibold ${period === p.key ? 'gold-gradient text-ink' : 'text-paper/75'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={load} disabled={busy} className="ml-auto text-xs text-paper/70 min-h-[34px] px-2 inline-flex items-center gap-2">
              {busy ? <Spinner /> : '↻'} {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {error && <p className="rounded-xl bg-paper border border-ink/15 border-l-4 border-l-gold text-ink text-sm px-4 py-3">{error}</p>}
        {!data && !error && (
          <div className="py-20 text-center text-ink/60">
            <Spinner />
          </div>
        )}

        {data && (
          <>
            <MarketShare share={share} groups={groups} trial={trial} order={order} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
              <Tile i={0} label="Online now" value={online} sub={`of ${team.length} BAs`} live />
              <Tile i={1} label="Active today" value={activeToday} />
              <Tile i={2} label="Surveys" value={data.surveys.length} />
              <Tile i={3} label="Outlets" value={outlets} />
            </div>

            <div className="grid lg:grid-cols-5 gap-4 anim-rise" style={{ animationDelay: '160ms' }}>
              <section className="lg:col-span-3 h-[360px] sm:h-[440px] lg:h-[600px] rounded-2xl bg-white border border-ink/10 p-1.5">
                <MapView team={team} surveys={data.surveys} selectedId={selected} onSelect={setSelected} now={fetchedAt} />
              </section>
              <section className="lg:col-span-2 rounded-2xl bg-white border border-ink/10 flex flex-col lg:h-[600px] min-w-0">
                <div className="px-4 pt-4 pb-2 flex items-baseline justify-between">
                  <h2 className="font-serif text-xl">Team</h2>
                </div>
                <ul className="flex-1 overflow-y-auto divide-y divide-ink/10 max-h-[560px] lg:max-h-none">
                  {team.map((ba) => (
                    <TeamRow key={ba.id} ba={ba} now={serverNow} selected={selected === ba.id} onClick={() => setSelected(selected === ba.id ? null : ba.id)} />
                  ))}
                  {!team.length && <li className="px-4 py-6 text-sm text-ink/60">No BAs yet.</li>}
                </ul>
              </section>
            </div>


            <section className="rounded-2xl bg-white border border-ink/10 p-4">
              <h2 className="font-serif text-xl">Latest surveys</h2>
              {!recent.length && <p className="text-sm text-ink/60 mt-2">No surveys.</p>}
              <ul className="mt-2 divide-y divide-ink/10">
                {recent.map((s) => (
                  <li key={text(s.id)} className="row-hover px-2 -mx-2 rounded-lg py-2.5 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[110px_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-x-3 gap-y-0.5 text-sm">
                    <span className="text-ink/55 order-3 sm:order-none">{dateTime(s.date)}</span>
                    <span className="font-semibold truncate">
                      {text(s.outletName)} <span className="font-normal text-ink/50">{text(s.outletId)}</span>
                    </span>
                    <span className="text-ink/70 truncate order-4 sm:order-none">{text(s.baName)}</span>
                    <span className="text-right whitespace-nowrap">
                      {s.group && <b>{groupShort(s.group)}</b>}
                      <span className="hidden sm:inline text-ink/55">{s.group ? ' · ' : ''}{surveyLine(s)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Tile({ i, label, value, sub, live }) {
  return (
    <div className="lift rounded-2xl bg-white border border-ink/10 px-4 py-3.5" style={{ '--i': i }}>
      <p className="text-xs uppercase tracking-wider text-gold-dark flex items-center gap-1.5">
        {live && <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />}
        {label}
      </p>
      <p className="font-serif text-3xl mt-1">{value}</p>
      {sub && <p className="text-xs text-ink/50">{sub}</p>}
    </div>
  )
}

function TeamRow({ ba, now, selected, onClick }) {
  const status = ba.online ? `Online · ${ago(ba.lastSeen, now)}` : ba.lastSeen ? `Last seen ${ago(ba.lastSeen, now)}` : 'Not seen yet'
  const flags = [...new Map(ba.flags.map((f) => [f.type, f])).values()]
  return (
    <li>
      <button type="button" onClick={onClick} className={`row-hover w-full text-left px-4 py-3 ${selected ? 'bg-gold/10' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ba.online ? 'bg-gold' : ba.seenToday ? 'bg-ink/50' : 'bg-ink/15'}`} />
          <span className="font-semibold truncate">{ba.name}</span>
          <span className="ml-auto text-xs text-ink/55 shrink-0">{status}</span>
        </div>
        {ba.activity && <p className="text-sm text-ink/75 mt-0.5 pl-[18px] truncate">{ba.activity}</p>}
        <p className="text-xs text-ink/55 mt-1 pl-[18px]">
          Today {ba.surveysToday} · Period {ba.surveysPeriod}
          {ba.lastSurvey && ` · Last ${text(ba.lastSurvey.outletName)} ${time(ba.lastSurvey.date)}`}
        </p>
        {(flags.length > 0 || ba.lat != null) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pl-[18px]">
            {flags.map((f) => (
              <span key={f.type} title={`${f.detail} · ${dateTime(f.at)}`} className="text-[11px] font-semibold rounded-full bg-ink text-gold px-2 py-0.5">
                {FLAG_LABEL[f.type] || f.type}
              </span>
            ))}
            {ba.lat != null && (
              <a
                href={`https://maps.google.com/?q=${ba.lat},${ba.lng}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-gold-dark link-hover"
              >
                ±{ba.accuracy ?? '?'} m · fix {ago(ba.locTime, now)}
              </a>
            )}
          </div>
        )}
      </button>
    </li>
  )
}

function MarketShare({ share, groups, trial, order }) {
  const max = Math.max(0.0001, ...share.rows.map((r) => r.share || 0))
  // Bars grow in from zero after the first paint
  const [grow, setGrow] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setGrow(true)))
    return () => cancelAnimationFrame(t)
  }, [])
  return (
    <section className="rounded-2xl bg-white border border-ink/10 p-4 anim-rise grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-x-8 gap-y-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl">Draught keg share</h2>
          <p className="text-xs text-ink/55">
            {share.counted} of {share.outlets} outlets gave keg counts · {share.total.toLocaleString()} kegs a week
          </p>
        </div>
        <ul className="mt-3 space-y-3">
          {share.rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[96px_minmax(0,1fr)_60px] gap-3 items-center">
              <span className="font-semibold flex items-center gap-1.5 text-sm">
                {r.label}
                {r.ours && <span className="text-[9px] font-bold tracking-widest rounded-full px-1.5 py-0.5 gold-gradient text-ink">OURS</span>}
              </span>
              <span className="h-3 rounded-full bg-mist overflow-hidden">
                <span className={`block h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${r.ours ? 'gold-gradient' : 'bg-ink-soft'}`} style={{ width: `${grow ? ((r.share || 0) / max) * 100 : 0}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums text-sm">{pct(r.share)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 grid grid-cols-2 gap-3 content-start">
        {groups.map((g) => (
          <div key={g.label} className="rounded-xl bg-mist/70 px-3 py-2.5">
            <p className="font-serif text-2xl tabular-nums leading-none">{g.count}</p>
            <p className="text-[11px] text-ink/60 mt-1 leading-tight">{g.label}</p>
          </div>
        ))}
        <div className="rounded-xl bg-ink text-paper px-3 py-2.5">
          <p className="font-serif text-2xl tabular-nums leading-none text-gold">{pct(trial.rate)}</p>
          <p className="text-[11px] text-paper/65 mt-1 leading-tight">Accept a Habesha trial</p>
        </div>
        <div className="rounded-xl bg-ink text-paper px-3 py-2.5 col-span-2 sm:col-span-1 lg:col-span-2">
          <p className="font-serif text-2xl tabular-nums leading-none text-gold">{pct(order.rate)}</p>
          <p className="text-[11px] text-paper/65 mt-1 leading-tight">Consumers who would order Habesha draught</p>
        </div>
      </div>
    </section>
  )
}
