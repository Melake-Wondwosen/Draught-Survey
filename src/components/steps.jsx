import { useEffect, useMemo, useState } from 'react'
import { requestOutlet } from '../api'
import { latestFix } from '../location'
import { clearPack, packCount, searchPack, syncPack } from '../outlets'
import { Button, Field, Notice, Sheet, Spinner, inputClass } from './ui'

function Title({ children, sub }) {
  return (
    <div className="mb-6 anim-rise">
      <p className="text-xs uppercase tracking-[0.14em] text-gold-dark font-semibold">Outlet</p>
      <h2 className="font-serif text-[26px] mt-1.5 leading-[1.18]">{children}</h2>
      {sub && <p className="text-sm text-ink/55 mt-1.5">{sub}</p>}
    </div>
  )
}

// Step 1: the BA types only the outlet ID. Name, division, agent and territory
// are filled from the National Outlet data, and the server fills them again on
// save, so a survey sent offline still gets the right details.
const DETAIL_ROWS = [
  ['division', 'Division'],
  ['agent', 'Agent'],
  ['parentTerritory', 'Parent territory'],
  ['territory', 'Territory'],
  ['area', 'Area'],
]
const CLEAR = { picked: false, offline: false, outletName: '', division: '', agent: '', parentTerritory: '', territory: '', area: '' }

export function StepOutlet({ data, set }) {
  const [query, setQuery] = useState('')
  const [asking, setAsking] = useState(false)
  const [count, setCount] = useState(packCount)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Make sure the outlet list is on the phone. Quick when it's already there.
  async function download(force) {
    if (force) clearPack()
    setLoading(true)
    setLoadError('')
    await syncPack()
    const n = packCount()
    setCount(n)
    setLoading(false)
    if (!n) setLoadError(navigator.onLine ? 'The outlet list came back empty. Ask your admin to check the National Outlet tab.' : 'No connection. Connect once to download the outlet list.')
  }
  useEffect(() => {
    if (!data.picked) download(false)
  }, [])

  const matches = useMemo(() => (query.trim().length >= 2 ? searchPack(query) : []), [query, count])

  function pick(o) {
    set({ ...CLEAR, picked: true, outletId: o.outletId, outletName: o.outletName, division: o.division, agent: o.agent, parentTerritory: o.parentTerritory, territory: o.territory, area: o.area || '' })
  }

  if (data.picked) {
    return (
      <>
        <Title>Outlet</Title>
        <div className="anim-pop rounded-2xl bg-ink text-paper p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full gold-gradient text-ink flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            <div className="min-w-0">
              <p className="font-serif text-xl leading-tight">{data.outletName || 'No name in the data'}</p>
              <p className="text-gold font-semibold tracking-wide mt-1">{data.outletId}</p>
            </div>
          </div>
          <dl className="mt-4 pt-4 border-t border-paper/15 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {DETAIL_ROWS.filter(([k]) => data[k]).map(([k, label]) => (
              <div key={k} className="contents">
                <dt className="text-paper/55">{label}</dt>
                <dd className="font-semibold min-w-0 break-words">{data[k]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Button variant="ghost" className="mt-4 btn-hover" onClick={() => { set({ ...CLEAR, outletId: '' }); setQuery('') }}>
          Change outlet
        </Button>
      </>
    )
  }

  return (
    <>
      <Title sub="Type part of the outlet name, then tap the outlet.">Find the outlet</Title>
      <div className="relative anim-rise">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          className={`${inputClass} text-lg pl-12 pr-11`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="e.g. Haykoch"
          autoFocus
          inputMode="search"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-ink/45 text-xl">
            ×
          </button>
        )}
      </div>

      {loading && !count && (
        <p className="mt-4 text-sm text-ink/60 flex items-center gap-2">
          <Spinner /> Downloading the outlet list…
        </p>
      )}
      {loadError && !count && (
        <Notice className="mt-3">
          {loadError}{' '}
          <button type="button" className="underline font-semibold" onClick={() => download(true)}>
            Try again
          </button>
        </Notice>
      )}

      {query.trim().length === 1 && <p className="mt-3 text-sm text-ink/55">Keep typing…</p>}

      {matches.length > 0 && (
        <ul className="mt-3 space-y-2 stagger">
          {matches.map((o, i) => (
            <li key={o.outletId} style={{ '--i': Math.min(i, 8) }}>
              <button type="button" onClick={() => pick(o)} className="pick w-full text-left rounded-2xl bg-white border border-ink/15 px-4 py-3 active:scale-[0.98] hover:border-gold">
                <span className="block text-[16px] font-semibold leading-snug">{o.outletName}</span>
                <span className="block text-xs text-ink/55 mt-0.5">
                  <span className="text-gold-dark font-semibold">{o.outletId}</span>
                  {o.territory && ` · ${o.territory}`}
                  {o.parentTerritory && ` · ${o.parentTerritory}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim().length >= 2 && count > 0 && matches.length === 0 && (
        <Notice className="mt-3">No outlet matches "{query.trim()}". Try fewer letters or another word from the name.</Notice>
      )}

      {count > 0 && !query && <p className="mt-3 text-xs text-ink/45">{count} outlets on this phone</p>}

      <Button variant="quiet" className="mt-4" onClick={() => setAsking(true)}>
        Not on the list?
      </Button>
      {asking && <RequestOutlet initial={query} onClose={() => setAsking(false)} />}
    </>
  )
}

function RequestOutlet({ initial, onClose }) {
  const looksLikeId = /\d/.test(initial) && !/\s/.test(initial.trim())
  const [form, setForm] = useState({ outletName: looksLikeId ? '' : initial.trim(), outletId: looksLikeId ? initial.trim().toUpperCase() : '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const put = (k) => (e) => setForm({ ...form, [k]: k === 'outletId' ? e.target.value.toUpperCase() : e.target.value })

  async function send() {
    setBusy(true)
    setError('')
    try {
      await requestOutlet({ ...form, location: latestFix() })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title="Request outlet"
      onClose={onClose}
      footer={
        done ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <Button variant="gold" onClick={send} disabled={busy || !form.outletName.trim()}>
            {busy ? <Spinner /> : 'Send'}
          </Button>
        )
      }
    >
      {done ? (
        <div className="anim-rise text-center py-6">
          <p className="font-serif text-xl">Request sent</p>
        </div>
      ) : (
        <>
          <Field label="Outlet name">
            <input className={inputClass} value={form.outletName} onChange={put('outletName')} autoComplete="off" />
          </Field>
          <Field label="Outlet ID">
            <input className={`${inputClass} uppercase`} value={form.outletId} onChange={put('outletId')} autoComplete="off" autoCapitalize="characters" />
          </Field>
          {error && <Notice>{error}</Notice>}
        </>
      )}
    </Sheet>
  )
}
