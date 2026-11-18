import { useRef } from 'react'
import { HB, SG } from '../questionnaire'
import { inputClass } from './ui'

// One question on one screen. `onPicked` runs after a single-choice tap, so the
// survey can move on by itself.

function Check({ on, square }) {
  return (
    <span
      className={`w-6 h-6 shrink-0 flex items-center justify-center transition-all duration-300 ${square ? 'rounded-md' : 'rounded-full'} ${
        on ? 'gold-gradient text-ink scale-100' : 'border-2 border-ink/20 scale-95'
      }`}
    >
      {on && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="anim-pop">
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
    </span>
  )
}

function Option({ label, on, onClick, square, i }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{ '--i': i }}
      className={`pick w-full min-h-[58px] flex items-center gap-3.5 rounded-2xl border px-4 py-3 text-left active:scale-[0.985] ${
        on ? 'bg-ink text-paper border-ink shadow-[0_10px_24px_-14px_rgba(0,0,0,.6)]' : 'bg-white border-ink/12 hover:border-gold/70'
      }`}
    >
      <Check on={on} square={square} />
      <span className="flex-1 text-[16.5px] font-semibold leading-snug">{label}</span>
    </button>
  )
}

function Single({ q, a, set, onPicked }) {
  const value = a[q.key]
  const showOther = q.other && value === q.other
  const showFollow = q.follow && q.follow.when.includes(value)
  function choose(v) {
    set({ [q.key]: v })
    const needsMore = (q.other && v === q.other) || (q.follow && q.follow.when.includes(v))
    if (!needsMore) onPicked()
  }
  return (
    <>
      <div className="space-y-2.5 stagger">
        {q.options.map((o, i) => (
          <Option key={o} i={i} label={o} on={value === o} onClick={() => choose(o)} />
        ))}
      </div>
      {showOther && (
        <div className="mt-4 anim-rise">
          <input className={inputClass} value={a[q.key + 'Other'] || ''} onChange={(e) => set({ [q.key + 'Other']: e.target.value })} placeholder="Who?" autoFocus autoComplete="off" />
        </div>
      )}
      {showFollow && (
        <label className="block mt-4 anim-rise">
          <span className="block text-sm font-semibold text-ink/70 mb-1.5">{q.follow.label}</span>
          <input className={inputClass} value={a[q.follow.key] || ''} onChange={(e) => set({ [q.follow.key]: e.target.value })} placeholder={q.follow.placeholder} autoComplete="off" />
        </label>
      )}
    </>
  )
}

function Multi({ q, a, set }) {
  const list = Array.isArray(a[q.key]) ? a[q.key] : []
  function toggle(o) {
    if (o === q.none) return set({ [q.key]: list.includes(o) ? [] : [o] })
    const next = list.includes(o) ? list.filter((x) => x !== o) : [...list.filter((x) => x !== q.none), o]
    set({ [q.key]: next })
  }
  return (
    <div className="space-y-2.5 stagger">
      {q.options.map((o, i) => (
        <Option key={o} i={i} square label={o} on={list.includes(o)} onClick={() => toggle(o)} />
      ))}
    </div>
  )
}

function Stepper({ label, unit, value, onChange, max }) {
  const n = value === '' || value == null ? null : Number(value)
  const put = (v) => onChange(v == null ? '' : String(Math.max(0, max != null ? Math.min(max, v) : v)))
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white border border-ink/12 pl-4 pr-2 py-2">
      <span className="flex-1 min-w-0">
        <span className="block text-[16.5px] font-semibold truncate">{label}</span>
        <span className="block text-[11px] uppercase tracking-wider text-ink/45">{unit}</span>
      </span>
      <button type="button" onClick={() => put(n == null ? null : n - 1 < 0 ? null : n - 1)} disabled={n == null} className="w-11 h-11 shrink-0 rounded-xl bg-mist text-2xl leading-none disabled:opacity-30" aria-label={`Less ${label}`}>
        −
      </button>
      <input
        className="w-16 h-11 shrink-0 rounded-xl border border-ink/15 text-center text-lg font-semibold outline-none focus:border-gold"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ''}
        placeholder="–"
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 4)
          put(t === '' ? null : Number(t))
        }}
        aria-label={label}
      />
      <button type="button" onClick={() => put(n == null ? 1 : n + 1)} className="w-11 h-11 shrink-0 rounded-xl bg-ink text-paper text-2xl leading-none" aria-label={`More ${label}`}>
        +
      </button>
    </div>
  )
}

function Numbers({ q, a, set }) {
  const sum = q.fields.reduce((s, f) => s + (Number(a[f.key]) || 0), 0)
  return (
    <>
      <div className="space-y-2.5 stagger">
        {q.fields.map((f, i) => (
          <div key={f.key} style={{ '--i': i }}>
            <Stepper label={f.label} unit={q.unit} max={q.max} value={a[f.key]} onChange={(v) => set({ [f.key]: v })} />
          </div>
        ))}
      </div>
      {q.total && sum > q.total && <p className="mt-3 text-sm text-gold-dark font-semibold anim-rise">Together that's {sum}. It can't be more than {q.total}.</p>}
    </>
  )
}

function Scale({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[76px] shrink-0 text-sm font-semibold text-ink/75">{label}</span>
      <div className="flex-1 grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = Number(value) === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(on ? '' : n)}
              aria-pressed={on}
              aria-label={`${label} ${n}`}
              className={`h-11 rounded-xl text-[17px] font-semibold active:scale-95 ${on ? 'gold-gradient text-ink shadow-md' : 'bg-mist text-ink/70 hover:bg-gold/15'}`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Rating({ q, a, set }) {
  const rowsRef = useRef([])
  const filled = (x, k) => x[k] != null && x[k] !== ''
  // When a row gets its second rating, bring the next row into view
  function rate(i, key, v) {
    const [r] = q.rows[i]
    const next = { ...a, [key]: v }
    set({ [key]: v })
    const wasDone = filled(a, `${q.prefix}${r}SG`) && filled(a, `${q.prefix}${r}HB`)
    const nowDone = filled(next, `${q.prefix}${r}SG`) && filled(next, `${q.prefix}${r}HB`)
    if (!wasDone && nowDone && rowsRef.current[i + 1]) setTimeout(() => rowsRef.current[i + 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 180)
  }
  return (
    <div className="space-y-3 stagger">
      {q.rows.map(([r, label], i) => {
        const kSG = `${q.prefix}${r}SG`
        const kHB = `${q.prefix}${r}HB`
        const done = filled(a, kSG) && filled(a, kHB)
        return (
          <div key={r} ref={(el) => (rowsRef.current[i] = el)} style={{ '--i': i }} className={`rounded-2xl border p-3.5 transition-colors ${done ? 'border-gold/50 bg-gold/[0.04]' : 'border-ink/12 bg-white'}`}>
            <p className="font-serif text-lg mb-2.5 flex items-center gap-2">
              {label}
              {done && <span className="w-2 h-2 rounded-full bg-gold" />}
            </p>
            <div className="space-y-2">
              <Scale label={SG} value={a[kSG]} onChange={(v) => rate(i, kSG, v)} />
              <Scale label={HB} value={a[kHB]} onChange={(v) => rate(i, kHB, v)} />
            </div>
          </div>
        )
      })}
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-ink/45 px-1 pt-1">
        <span>1 very poor</span>
        <span>5 excellent</span>
      </div>
    </div>
  )
}

function Pair({ q, a, set, onPicked }) {
  const [brand, issue] = q.parts
  const noIssue = a[issue.key] === 'None'
  function pick(part, v) {
    const next = { ...a, [part.key]: v }
    set({ [part.key]: v })
    const ok = next[issue.key] === 'None' || (next[issue.key] && next[brand.key])
    if (ok) onPicked()
  }
  return (
    <div className="space-y-6">
      {[issue, brand].map((part) =>
        part === brand && noIssue ? null : (
          <div key={part.key} className="anim-rise">
            <p className="text-sm font-semibold text-ink/70 mb-2.5">{part.label}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {part.options.map((o) => {
                const on = a[part.key] === o
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => pick(part, o)}
                    aria-pressed={on}
                    className={`pick min-h-[54px] rounded-2xl border px-3 text-[16px] font-semibold active:scale-[0.97] ${on ? 'bg-ink text-paper border-ink' : 'bg-white border-ink/12 hover:border-gold/70'}`}
                  >
                    {o}
                  </button>
                )
              })}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

const BODY = { single: Single, multi: Multi, numbers: Numbers, rating: Rating, pair: Pair }

export default function Question({ q, a, set, onPicked, eyebrow }) {
  const Body = BODY[q.type]
  return (
    <>
      <div className="mb-6 anim-rise">
        <p className="text-xs uppercase tracking-[0.14em] text-gold-dark font-semibold">{eyebrow}</p>
        <h2 className="font-serif text-[26px] mt-1.5 leading-[1.18]">{q.q}</h2>
        {q.hint && <p className="text-sm text-ink/55 mt-1.5">{q.hint}</p>}
      </div>
      <Body q={q} a={a} set={set} onPicked={onPicked} />
    </>
  )
}
