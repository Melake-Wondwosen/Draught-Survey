import { Component, useEffect, useMemo, useState } from 'react'
import Question from '../components/Question'
import { Button, Notice, Segmented, Spinner, inputClass } from '../components/ui'
import { ANSWER_KEYS, BASE_QUESTIONS, GROUP_CODE, SECTIONS, buildQuestion, extraColumns, isShown, qText } from '../questionnaire'
import { saveQuestions } from '../questions'

/* The admin's editor for one question: wording, answers, follow-up boxes,
   number boxes, rating rows, two-part questions, who gets it and when.
   Built-in questions keep their key and type; everything a BA sees can change. */

export const TYPE_INFO = {
  single: ['One answer', 'The BA taps one'],
  multi: ['Tick all', 'Any number of answers'],
  numbers: ['Numbers', 'One or more number boxes'],
  rating: ['Rating 1 to 5', 'Rows scored 1 to 5'],
  pair: ['Two answers', 'Two short questions on one screen'],
  text: ['Note', 'Their exact words'],
}
export const GROUP_SHORT = { lost: 'Lost', sg: 'St. George-dominant', hb: 'Habesha draught' }
const CODES = Object.keys(GROUP_CODE)

// Answers the Analysis or the built-in rules look for by their exact words
const KEEP = {
  o_onTap: 'St. George, Habesha and Other decide which brands later questions offer.',
  o_waiterAction: 'Answers starting with "Brought" count as the waiter deciding (H2). Answers naming a brand follow the taps.',
  o_whoDecides: '"The waiter" is counted in H2.',
  o_visible: '"No branding at all" and answers naming Habesha are counted in H4.',
  c_drinking: `"Doesn't know" is counted in H1. "Habesha" skips the "ever drunk Habesha" questions.`,
  c_swapped: '"Drank it anyway" is counted in H1.',
  c_ordered: '"Named a brand" is counted in H3.',
  c_groupDecides: '"Someone else" is counted in H3.',
  c_blame: '"The bar" is counted in H5.',
  c_goodDraught: '"The brand" is counted in H5.',
  s_wrongBrand: '"Customer complains" is counted in H2.',
  c_everHabesha: '"Yes, regularly" skips "why not".',
  c_qaInvite: '"Yes, they agreed" puts the person on the Q&A invite list.',
  m_trial: '"Yes, now" and "Yes, after contract ends" count as agreeing to a trial.',
  a_likelihood: 'High, Medium and Low weight the expected keg gain (70%, 40%, 10%).',
  m_problems: '"None" hides "What kind?".',
  s_easier: '"Same" hides "Why?".',
  m_hbStopReason: 'Changing answers here changes the lost-reasons chart.',
}

const newKey = () => 'x_' + Math.random().toString(36).slice(2, 8)
const rowId = () => 'r' + Math.random().toString(36).slice(2, 5)
const typical = (code) => ({ group: GROUP_CODE[code], o_onTap: code === 'hb' ? ['St. George', 'Habesha', 'Other'] : ['St. George', 'Other'] })
const defaultRequired = (type) => ['single', 'multi', 'pair', 'rating'].includes(type)

// The editable picture of a question, from its current form (and the admin's row for groups and condition)
export function specFrom(q, row) {
  const rs = (row && row.spec) || {}
  return {
    type: q.type,
    q: typeof q.q === 'string' ? q.q : '',
    qByGroup: typeof q.q === 'function' ? Object.fromEntries(CODES.map((c) => [c, q.q({ group: GROUP_CODE[c] })])) : null,
    title: q.custom ? rs.title || '' : q.title || '',
    hint: q.hint || '',
    required: q.required ?? defaultRequired(q.type),
    options: q.options ? [...q.options] : [],
    other: q.other || '',
    otherHint: q.otherHint || '',
    follow: q.follow ? { when: q.follow.when === 'any' ? 'any' : [...q.follow.when], fields: q.follow.fields.map((f) => ({ key: f.key, label: f.label, required: !!f.required, tel: f.inputMode === 'tel' })) } : null,
    none: q.none || '',
    main: q.main ? { key: q.main.key, label: q.main.label } : null,
    fields: (q.fields || []).map((f) => ({ key: f.key, label: f.label, unit: f.unit || '' })),
    unit: q.unit || '',
    max: q.max ?? '',
    digits: q.digits ?? '',
    rows: (q.rows || []).map(([id, label]) => ({ id, label })),
    perBrand: q.custom ? !!rs.perBrand : true,
    parts: (q.parts || []).map((p) => ({ key: p.key, label: p.label, options: [...p.options] })),
    placeholder: q.custom ? rs.placeholder || '' : q.placeholder || '',
    groups: rs.groups && rs.groups.length ? [...rs.groups] : [...CODES],
    when: rs.when || null,
    brandFilter: !!rs.brandFilter,
  }
}

const COMMON = ['q', 'qByGroup', 'title', 'hint', 'required', 'groups', 'when']
const BY_TYPE = {
  single: ['options', 'other', 'otherHint', 'follow', 'brandFilter'],
  multi: ['options', 'none', 'main', 'brandFilter'],
  numbers: ['fields', 'unit', 'max', 'digits'],
  rating: ['rows', 'perBrand'],
  pair: ['parts', 'brandFilter'],
  text: ['placeholder'],
}
const norm = (k, v) => (k === 'groups' && Array.isArray(v) && v.length === CODES.length ? [] : v)
const same = (k, x, y) => JSON.stringify(norm(k, x)) === JSON.stringify(norm(k, y))

// What gets stored: for a built-in question only what differs from the original, for an added one all of it
function toSpec(draft, base, wording) {
  const keys = [...COMMON, ...(BY_TYPE[draft.type] || [])]
  const d = { ...draft, qByGroup: wording ? draft.qByGroup : null, groups: norm('groups', draft.groups) }
  if (!base) {
    const out = { type: d.type }
    keys.forEach((k) => {
      const v = d[k]
      if (v === '' || v == null || (Array.isArray(v) && !v.length && k !== 'options') || v === false) return
      out[k] = v
    })
    out.required = !!d.required
    return out
  }
  const from = specFrom(base)
  const out = {}
  keys.forEach((k) => { if (k !== 'brandFilter' && !same(k, d[k], from[k])) out[k] = d[k] })
  if (!wording && from.qByGroup && !out.q) delete out.qByGroup
  return out
}

function problems(d, wording) {
  const out = []
  const words = wording ? Object.values(d.qByGroup || {}).some((x) => x && x.trim()) || d.q.trim() : d.q.trim()
  if (!words) out.push('Write the question.')
  const dup = (l) => new Set(l.map((x) => x.trim().toLowerCase())).size !== l.length
  if (d.type === 'single' || d.type === 'multi') {
    const opts = d.options.map((o) => o.trim()).filter(Boolean)
    if (opts.length < 2) out.push('Add at least two answers.')
    if (dup(opts)) out.push('Two answers have the same words.')
  }
  if (d.type === 'numbers' && !d.fields.filter((f) => f.label.trim()).length) out.push('Add at least one number box with a name.')
  if (d.type === 'rating' && !d.rows.filter((r) => r.label.trim()).length) out.push('Add at least one row to rate.')
  if (d.type === 'pair') d.parts.forEach((p, i) => {
    if (!p.label.trim()) out.push(`Name part ${i + 1}.`)
    if (p.options.map((o) => o.trim()).filter(Boolean).length < 2) out.push(`Give part ${i + 1} at least two answers.`)
  })
  if (!d.groups.length) out.push('Pick at least one outlet group.')
  if (d.follow && !d.follow.fields.length) out.push('Add a box to the follow-up, or switch the follow-up off.')
  if (d.follow && d.follow.when !== 'any' && !d.follow.when.length) out.push('Pick which answers open the follow-up.')
  return out
}

// Trim lists before saving
function tidy(d) {
  const t = (s) => (typeof s === 'string' ? s.trim() : s)
  const opts = (l) => l.map(t).filter(Boolean)
  return {
    ...d,
    q: t(d.q), title: t(d.title), hint: t(d.hint),
    qByGroup: d.qByGroup ? Object.fromEntries(CODES.map((c) => [c, t(d.qByGroup[c] || '')])) : null,
    options: opts(d.options),
    fields: d.fields.filter((f) => t(f.label)).map((f) => ({ ...f, label: t(f.label), unit: t(f.unit) })),
    rows: d.rows.filter((r) => t(r.label)).map((r) => ({ ...r, label: t(r.label) })),
    parts: d.parts.map((p) => ({ ...p, label: t(p.label), options: opts(p.options) })),
    follow: d.follow ? { ...d.follow, fields: d.follow.fields.map((f) => ({ ...f, label: t(f.label) })) } : null,
    max: d.max === '' ? '' : Number(d.max),
    digits: d.digits === '' ? '' : Number(d.digits),
  }
}

export default function QuestionEditor({ q, row, section, all, order, say, onClose }) {
  const isNew = !q
  const base = q && !q.custom ? BASE_QUESTIONS.find((b) => b.key === q.key) : null
  const [key] = useState(() => (q ? q.key : newKey()))
  const [sec, setSec] = useState(q ? q.section : section)
  const [d, setD] = useState(() =>
    q
      ? specFrom(q, row)
      : { ...specFrom({ type: 'single', custom: true }), options: ['', ''], required: true },
  )
  const [wording, setWording] = useState(() => !!(q && typeof q.q === 'function'))
  const [place, setPlace] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState([])
  const [view, setView] = useState('lost')
  const [pa, setPa] = useState({})
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function setType(type) {
    setD((x) => {
      const n = { ...x, type, required: defaultRequired(type) }
      if ((type === 'single' || type === 'multi') && !n.options.length) n.options = ['', '']
      if (type === 'numbers' && !n.fields.length) n.fields = [{ key: newKey(), label: '', unit: '' }]
      if (type === 'rating' && !n.rows.length) n.rows = [{ id: rowId(), label: '' }]
      if (type === 'pair' && n.parts.length < 2) n.parts = [0, 1].map(() => ({ key: newKey(), label: '', options: ['', ''] }))
      return n
    })
  }

  const spec = useMemo(() => toSpec(tidy(d), base, wording), [d, base, wording])
  const preview = useMemo(() => (base ? buildQuestion(base, spec) : buildQuestion(null, spec, key, sec)), [base, spec, key, sec])
  const answers = { ...typical(view), ...pa }
  const shownHere = (() => { try { return isShown(preview, answers) } catch { return true } })()

  // Earlier questions an answer of which can switch this one on
  const earlier = useMemo(() => {
    const idx = all.findIndex((x) => x.key === key)
    const before = (idx > -1 ? all.slice(0, idx) : all.filter((x) => SECTIONS.findIndex((s) => s.id === x.section) <= SECTIONS.findIndex((s) => s.id === sec))).filter((x) => !x.off)
    return before.flatMap((x) => {
      if (x.type === 'single' || x.type === 'multi') return [{ key: x.key, label: x.title || qText(x, {}), options: x.options }]
      if (x.type === 'pair') return x.parts.map((p) => ({ key: p.key, label: `${x.title || qText(x, {})}: ${p.label}`, options: p.options }))
      return []
    })
  }, [all, key, sec])
  const cond = earlier.find((x) => d.when && x.key === d.when.key)

  async function save() {
    const t = tidy(d)
    const errs = problems(t, wording)
    setErrors(errs)
    if (errs.length) return
    setBusy(true)
    try {
      const built = base ? buildQuestion(base, spec) : buildQuestion(null, spec, key, sec)
      const rows = [{ key, section: sec, spec, columns: extraColumns(built).filter((c) => !ANSWER_KEYS.includes(c.key)), active: row ? row.active !== false : true }]
      if (isNew) {
        const keys = all.filter((x) => x.section === sec).map((x) => x.key)
        const at = place === '^' ? 0 : place ? keys.indexOf(place) + 1 : keys.length
        keys.splice(at, 0, key)
        rows.push({ key: '_order_' + sec, section: sec, spec: { order: keys } })
      } else if (q.custom && sec !== q.section) {
        rows.push({ key: '_order_' + sec, section: sec, spec: { order: [...all.filter((x) => x.section === sec).map((x) => x.key), key] } })
      }
      await saveQuestions(rows)
      say(isNew ? 'Question added' : 'Question saved')
      onClose()
    } catch (err) {
      setErrors([err.message])
      setBusy(false)
    }
  }

  async function reset() {
    setBusy(true)
    try {
      await saveQuestions([{ key, section: sec, spec: {}, columns: [], active: row ? row.active !== false : true }])
      say('Back to the original')
      onClose()
    } catch (err) {
      setErrors([err.message])
      setBusy(false)
    }
  }

  const choices = d.type === 'single' || d.type === 'multi'
  const optList = d.options.map((o) => o.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 z-[2000] bg-paper flex flex-col anim-fade" role="dialog" aria-label={isNew ? 'New question' : 'Edit question'}>
      <header className="shrink-0 bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold font-semibold">{isNew ? 'New question' : base ? 'Built-in question' : 'Added question'}</p>
            <p className="font-serif text-lg truncate">{(wording ? Object.values(d.qByGroup || {}).find(Boolean) : d.q) || 'Untitled'}</p>
          </div>
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-full text-sm font-semibold text-paper/75 hover:text-paper hover:bg-white/10">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="h-10 px-5 rounded-full gold-gradient text-ink text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2">
            {busy ? <Spinner /> : isNew ? 'Add question' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">
          <div className="space-y-5 min-w-0">
            {errors.length > 0 && <Notice>{errors.join(' ')}</Notice>}

            <Card title="Question">
              {!base && (
                <Row label="Section">
                  <select className={inputClass} value={sec} onChange={(e) => setSec(e.target.value)}>
                    {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </Row>
              )}
              <Row label="Answer type">
                {base ? (
                  <p className="text-sm"><span className="font-semibold">{TYPE_INFO[d.type][0]}</span> <span className="text-ink/55">· built-in questions keep their type</span></p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(TYPE_INFO).map(([t, [label, sub]]) => (
                      <button key={t} type="button" onClick={() => setType(t)} aria-pressed={d.type === t} className={`rounded-xl border px-3 py-2.5 text-left ${d.type === t ? 'border-gold bg-gold/10' : 'border-ink/12 bg-white hover:border-gold/60'}`}>
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="block text-xs text-ink/55">{sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Row>
              <Row label="Wording">
                {!wording ? (
                  <textarea className={`${inputClass} py-3 min-h-[76px]`} value={d.q} onChange={(e) => set('q', e.target.value)} maxLength={300} placeholder="e.g. Is there a TV showing football?" />
                ) : (
                  <div className="space-y-2">
                    {CODES.map((c) => (
                      <div key={c}>
                        <p className="text-xs font-semibold text-ink/55 mb-1">{GROUP_SHORT[c]}</p>
                        <textarea className={`${inputClass} py-2.5 min-h-[56px]`} value={(d.qByGroup || {})[c] || ''} onChange={(e) => set('qByGroup', { ...(d.qByGroup || {}), [c]: e.target.value })} maxLength={300} />
                      </div>
                    ))}
                  </div>
                )}
                <Toggle
                  on={wording}
                  label="Different wording for each outlet group"
                  onChange={(on) => {
                    setWording(on)
                    if (on && !d.qByGroup) set('qByGroup', Object.fromEntries(CODES.map((c) => [c, d.q])))
                  }}
                />
              </Row>
              <div className="grid sm:grid-cols-2 gap-3">
                <Row label="Short name in the results" hint="Optional">
                  <input className={inputClass} value={d.title} onChange={(e) => set('title', e.target.value)} maxLength={80} />
                </Row>
                <Row label="Note for the BA" hint="Shown under the question">
                  <input className={inputClass} value={d.hint} onChange={(e) => set('hint', e.target.value)} maxLength={300} />
                </Row>
              </div>
            </Card>

            <Card title="Answers">
              {base && KEEP[base.key] && <p className="rounded-xl bg-gold/10 border border-gold/30 px-3.5 py-2.5 text-sm">Keep these words: {KEEP[base.key]}</p>}
              {base && <p className="text-xs text-ink/55">Renaming an answer starts a new answer in the results. Surveys already sent keep the old words.</p>}

              {choices && <ListEditor label="Answers" items={d.options} onChange={(v) => set('options', v)} add="Add an answer" />}

              {d.type === 'single' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Row label="Answer that opens a text box" hint='e.g. "Other"'>
                      <select className={inputClass} value={d.other} onChange={(e) => set('other', e.target.value)}>
                        <option value="">None</option>
                        {optList.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Row>
                    {d.other && (
                      <Row label="Text box hint">
                        <input className={inputClass} value={d.otherHint} onChange={(e) => set('otherHint', e.target.value)} placeholder="Say what" maxLength={60} />
                      </Row>
                    )}
                  </div>
                  <FollowEditor follow={d.follow} options={optList} onChange={(v) => set('follow', v)} />
                </>
              )}

              {d.type === 'multi' && (
                <>
                  <Row label="Answer that clears the others" hint='e.g. "None" or "Nothing"'>
                    <select className={inputClass} value={d.none} onChange={(e) => set('none', e.target.value)}>
                      <option value="">None</option>
                      {optList.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Row>
                  <Toggle on={!!d.main} label="When two or more are ticked, ask which matters most" onChange={(on) => set('main', on ? { key: newKey(), label: 'Which matters most?' } : null)} />
                  {d.main && <input className={inputClass} value={d.main.label} onChange={(e) => set('main', { ...d.main, label: e.target.value })} maxLength={120} />}
                </>
              )}

              {d.type === 'numbers' && (
                <>
                  <p className="text-sm font-semibold text-ink/80">Number boxes</p>
                  <Items
                    items={d.fields}
                    onChange={(v) => set('fields', v)}
                    make={() => ({ key: newKey(), label: '', unit: '' })}
                    add="Add a number box"
                    render={(f, upd) => (
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2 flex-1 min-w-0">
                        <input className={inputClass} value={f.label} onChange={(e) => upd({ ...f, label: e.target.value })} placeholder="Name, e.g. St. George" maxLength={60} />
                        <input className={inputClass} value={f.unit} onChange={(e) => upd({ ...f, unit: e.target.value })} placeholder="Unit (optional)" maxLength={40} />
                      </div>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Row label="Unit for all boxes"><input className={inputClass} value={d.unit} onChange={(e) => set('unit', e.target.value)} placeholder="kegs a week" maxLength={40} /></Row>
                    <Row label="Highest number"><input className={inputClass} inputMode="numeric" value={d.max} onChange={(e) => set('max', e.target.value.replace(/\D/g, ''))} placeholder="No limit" /></Row>
                    <Row label="Most digits"><input className={inputClass} inputMode="numeric" value={d.digits} onChange={(e) => set('digits', e.target.value.replace(/\D/g, '').slice(0, 1))} placeholder="4" /></Row>
                  </div>
                </>
              )}

              {d.type === 'rating' && (
                <>
                  <p className="text-sm font-semibold text-ink/80">Rows to score from 1 to 5</p>
                  <Items
                    items={d.rows}
                    onChange={(v) => set('rows', v)}
                    make={() => ({ id: rowId(), label: '' })}
                    add="Add a row"
                    render={(r, upd) => <input className={`${inputClass} flex-1 min-w-0`} value={r.label} onChange={(e) => upd({ ...r, label: e.target.value })} placeholder="e.g. Temperature (cold)" maxLength={60} />}
                  />
                  {base ? (
                    <p className="text-xs text-ink/55">Each row is scored for every brand on tap.</p>
                  ) : (
                    <Toggle on={d.perBrand} label="Score each brand on tap (St. George, Habesha) separately" onChange={(on) => set('perBrand', on)} />
                  )}
                </>
              )}

              {d.type === 'pair' &&
                d.parts.map((p, i) => (
                  <div key={p.key} className="rounded-xl border border-ink/10 p-3 space-y-2.5">
                    <Row label={`Part ${i + 1}`}>
                      <input className={inputClass} value={p.label} onChange={(e) => set('parts', d.parts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="e.g. Most are aged" maxLength={80} />
                    </Row>
                    <ListEditor label="Answers" items={p.options} onChange={(v) => set('parts', d.parts.map((x, j) => (j === i ? { ...x, options: v } : x)))} add="Add an answer" />
                  </div>
                ))}

              {d.type === 'text' && (
                <Row label="Hint inside the box">
                  <input className={inputClass} value={d.placeholder} onChange={(e) => set('placeholder', e.target.value)} placeholder="Their exact words" maxLength={80} />
                </Row>
              )}

              {!base && (d.type === 'single' || d.type === 'multi' || d.type === 'pair') && (
                <Toggle on={d.brandFilter} label="Only offer brands sold at the outlet (answers naming St. George, Habesha or Other follow the taps)" onChange={(on) => set('brandFilter', on)} />
              )}
            </Card>

            <Card title="Who gets it">
              <Row label="Outlet groups">
                <div className="flex flex-wrap gap-2">
                  {CODES.map((c) => {
                    const on = d.groups.includes(c)
                    return (
                      <button key={c} type="button" aria-pressed={on} onClick={() => set('groups', on ? d.groups.filter((x) => x !== c) : [...d.groups, c])} className={`h-10 px-3.5 rounded-full border text-sm font-semibold ${on ? 'border-gold bg-gold/15' : 'border-ink/15 text-ink/55'}`}>
                        {on ? '✓ ' : ''}{GROUP_SHORT[c]}
                      </button>
                    )
                  })}
                </div>
                {base && base.show && <p className="text-xs text-ink/55 mt-2">This question also has a built-in rule (the outlet group or the brands on tap). It still applies.</p>}
              </Row>
              <Row label="Only ask when" hint="Optional: an answer to an earlier question">
                <select className={inputClass} value={d.when ? d.when.key : ''} onChange={(e) => set('when', e.target.value ? { key: e.target.value, values: [] } : null)}>
                  <option value="">Always</option>
                  {earlier.map((x) => <option key={x.key} value={x.key}>{x.label.slice(0, 80)}</option>)}
                </select>
                {cond && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {cond.options.map((o) => {
                      const on = d.when.values.includes(o)
                      return (
                        <button key={o} type="button" aria-pressed={on} onClick={() => set('when', { ...d.when, values: on ? d.when.values.filter((x) => x !== o) : [...d.when.values, o] })} className={`min-h-[38px] px-3 rounded-full border text-sm font-semibold ${on ? 'border-gold bg-gold/15' : 'border-ink/15 text-ink/60'}`}>
                          {on ? '✓ ' : ''}{o}
                        </button>
                      )
                    })}
                  </div>
                )}
                {cond && !d.when.values.length && <p className="text-xs text-gold-dark mt-1.5">Pick the answers that switch it on.</p>}
              </Row>
              {isNew && (
                <Row label="Place it">
                  <select className={inputClass} value={place} onChange={(e) => setPlace(e.target.value)}>
                    <option value="">At the end of the section</option>
                    <option value="^">At the start of the section</option>
                    {all.filter((x) => x.section === sec).map((x) => <option key={x.key} value={x.key}>After: {(x.title || qText(x, {})).slice(0, 70)}</option>)}
                  </select>
                </Row>
              )}
              <Toggle on={d.required} label="Answer required (off lets the BA move on without answering)" onChange={(on) => set('required', on)} />
            </Card>

            {base && row && row.spec && Object.keys(row.spec).length > 0 && (
              <button type="button" onClick={reset} disabled={busy} className="text-sm font-semibold text-ink/60 hover:text-ink underline underline-offset-4">
                Undo all changes to this question
              </button>
            )}
          </div>

          <aside className="lg:sticky lg:top-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-gold-dark font-semibold">Preview</p>
              <button type="button" onClick={() => setPa({})} className="text-xs font-semibold text-ink/55 hover:text-ink">Clear answers</button>
            </div>
            <Segmented value={view} onChange={(v) => { setView(v); setPa({}) }} options={CODES.map((c) => ({ value: c, label: c === 'sg' ? 'St. George' : c === 'hb' ? 'Habesha' : 'Lost' }))} />
            <div className="rounded-[28px] border-[6px] border-ink bg-paper shadow-xl overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto px-4 py-5">
                {shownHere ? (
                  <PreviewSafe q={preview} a={answers} set={(patch) => setPa((x) => ({ ...x, ...patch }))} />
                ) : (
                  <p className="text-sm text-ink/55 py-10 text-center">Not asked in this outlet group{d.when ? ' unless the earlier answer matches' : ''}.</p>
                )}
              </div>
            </div>
            <p className="text-xs text-ink/50">The preview assumes St. George and Other on tap{view === 'hb' ? ', plus Habesha' : ''}.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

// Half-written questions can fail to draw; the preview then waits for more input
class PreviewSafe extends Component {
  state = { failed: false, sig: '' }
  static getDerivedStateFromProps(props, state) {
    const sig = JSON.stringify([props.q.key, props.q.type, props.q.options, props.q.fields, props.q.rows, props.q.parts])
    return sig !== state.sig ? { failed: false, sig } : null
  }
  componentDidCatch() { this.setState({ failed: true }) }
  render() {
    const { q, a, set } = this.props
    if (this.state.failed) return <p className="text-sm text-ink/55">Fill in the question to see it.</p>
    return <Question q={q} a={a} set={set} onPicked={() => {}} eyebrow={SECTIONS.find((s) => s.id === q.section)?.title} />
  }
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl bg-white border border-ink/10 p-4 sm:p-5 space-y-4">
      <h3 className="font-serif text-xl">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, hint, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink/80 mb-1.5">
        {label} {hint && <span className="font-normal text-ink/45">· {hint}</span>}
      </p>
      {children}
    </div>
  )
}

function Toggle({ on, label, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[#C9A227]" checked={!!on} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  )
}

// A list of rows that can be added, removed and moved
function Items({ items, onChange, make, render, add }) {
  const move = (i, j) => { const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n) }
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {render(it, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
          <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>↑</IconBtn>
          <IconBtn label="Move down" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>↓</IconBtn>
          <IconBtn label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</IconBtn>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, make()])} className="h-10 px-4 rounded-full border border-dashed border-ink/25 text-sm font-semibold text-ink/70 hover:border-gold hover:text-ink">
        + {add}
      </button>
    </div>
  )
}

function ListEditor({ label, items, onChange, add }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink/80 mb-1.5">{label}</p>
      <Items items={items} onChange={onChange} make={() => ''} add={add} render={(o, upd, i) => <input className={`${inputClass} flex-1 min-w-0`} value={o} onChange={(e) => upd(e.target.value)} placeholder={`Answer ${i + 1}`} maxLength={120} />} />
    </div>
  )
}

function IconBtn({ label, onClick, disabled, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="w-9 h-11 shrink-0 rounded-lg text-lg text-ink/60 hover:bg-mist hover:text-ink disabled:opacity-25">
      {children}
    </button>
  )
}

// Boxes that open after an answer (e.g. name and phone after "Yes, they agreed")
function FollowEditor({ follow, options, onChange }) {
  const on = !!follow
  return (
    <div className="space-y-2.5">
      <Toggle on={on} label="Ask for more after an answer (text or phone boxes)" onChange={(v) => onChange(v ? { when: [], fields: [{ key: newKey(), label: '', required: false, tel: false }] } : null)} />
      {on && (
        <div className="rounded-xl border border-ink/10 p-3 space-y-3">
          <Row label="Open the boxes after">
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={follow.when === 'any'} onClick={() => onChange({ ...follow, when: follow.when === 'any' ? [] : 'any' })} className={`min-h-[38px] px-3 rounded-full border text-sm font-semibold ${follow.when === 'any' ? 'border-gold bg-gold/15' : 'border-ink/15 text-ink/60'}`}>
                {follow.when === 'any' ? '✓ ' : ''}Any answer
              </button>
              {follow.when !== 'any' &&
                options.map((o) => {
                  const sel = follow.when.includes(o)
                  return (
                    <button key={o} type="button" aria-pressed={sel} onClick={() => onChange({ ...follow, when: sel ? follow.when.filter((x) => x !== o) : [...follow.when, o] })} className={`min-h-[38px] px-3 rounded-full border text-sm font-semibold ${sel ? 'border-gold bg-gold/15' : 'border-ink/15 text-ink/60'}`}>
                      {sel ? '✓ ' : ''}{o}
                    </button>
                  )
                })}
            </div>
          </Row>
          <Items
            items={follow.fields}
            onChange={(fields) => onChange({ ...follow, fields })}
            make={() => ({ key: newKey(), label: '', required: false, tel: false })}
            add="Add a box"
            render={(f, upd) => (
              <div className="flex-1 min-w-0 space-y-1.5">
                <input className={inputClass} value={f.label} onChange={(e) => upd({ ...f, label: e.target.value })} placeholder="Box name, e.g. Their name" maxLength={60} />
                <div className="flex gap-4">
                  <Toggle on={f.required} label="Required" onChange={(v) => upd({ ...f, required: v })} />
                  <Toggle on={f.tel} label="Phone number" onChange={(v) => upd({ ...f, tel: v })} />
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  )
}
