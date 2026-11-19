import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Notice, Sheet, Spinner, inputClass } from '../components/ui'
import { BASE_QUESTIONS, CONFIG, GROUPS, GROUP_CODE, SECTIONS, mergeQuestions, qText } from '../questionnaire'
import { saveQuestion, syncQuestions } from '../questions'

const TYPES = [
  { value: 'single', label: 'One answer', sub: 'The BA taps one' },
  { value: 'multi', label: 'Tick all', sub: 'Any number of answers' },
  { value: 'number', label: 'Number', sub: 'Kegs, people, birr…' },
  { value: 'text', label: 'Note', sub: 'Their exact words' },
]
const TYPE_LABEL = { single: 'One answer', multi: 'Tick all', numbers: 'Numbers', number: 'Number', rating: '1 to 5 rating', pair: 'Two answers', text: 'Note' }
const GROUP_SHORT = { lost: 'Lost', sg: 'St. George-dominant', hb: 'Habesha draught' }
const CODES = Object.keys(GROUP_CODE)

// Which outlet groups see a question (built-in rules are worked out by trying each group)
function groupsOf(q) {
  if (!q.show) return CODES
  return CODES.filter((c) => {
    try { return !!q.show({ group: GROUP_CODE[c], o_onTap: ['St. George', 'Habesha'], c_everHabesha: 'Never', o_prefer: 'Draught' }) } catch { return true }
  })
}

export default function QuestionsTab({ say }) {
  const [, setTick] = useState(0)
  const [section, setSection] = useState(SECTIONS[0].id)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    syncQuestions().finally(() => setLoading(false))
    const on = () => setTick((n) => n + 1)
    window.addEventListener('questions-changed', on)
    return () => window.removeEventListener('questions-changed', on)
  }, [])

  const all = mergeQuestions(CONFIG)
  const list = all.filter((q) => q.section === section)
  const rowOf = (key) => CONFIG.find((r) => r.key === key)
  const added = CONFIG.filter((r) => /^x_/.test(r.key)).length
  const off = all.filter((q) => q.off).length
  let n = 0

  async function toggle(q) {
    const r = rowOf(q.key) || {}
    try {
      await saveQuestion({ ...baseRow(q, r), active: !!q.off })
      say(q.off ? 'Question turned on' : 'Question turned off')
    } catch (err) {
      say(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          [all.filter((q) => !q.off).length, 'Questions on'],
          [added, 'Added by admin'],
          [off, 'Turned off'],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-white border border-ink/10 px-3 sm:px-4 py-3 min-w-0">
            <p className="font-serif text-2xl">{v}</p>
            <p className="text-[11px] uppercase tracking-wider text-gold-dark truncate">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)} className={`h-9 px-3.5 rounded-full text-sm font-semibold ${section === s.id ? 'bg-ink text-paper' : 'bg-white border border-ink/12 text-ink/65 hover:text-ink'}`}>
              {s.tab}
            </button>
          ))}
        </div>
        <Button variant="gold" className="!w-auto px-5" onClick={() => setEditing({ section, key: '' })}>
          Add a question
        </Button>
      </div>

      <p className="text-sm text-ink/55">
        Changes reach the phones on their next sync, usually within a minute. A question turned off keeps its answers in the sheet. Answers to built-in questions stay fixed, because the analysis counts them.
      </p>

      {loading && !CONFIG.length ? (
        <div className="py-10 flex justify-center text-ink/40"><Spinner /></div>
      ) : (
        <ul className="space-y-2">
          {list.map((q) => {
            const num = q.off ? null : ++n
            const gs = groupsOf(q)
            return (
              <li key={q.key} className={`rounded-2xl border px-4 py-3 flex flex-wrap sm:flex-nowrap items-start gap-x-3 gap-y-2 ${q.off ? 'bg-mist/60 border-ink/8' : 'bg-white border-ink/10'}`}>
                <span className={`shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${q.off ? 'bg-ink/10 text-ink/40' : 'bg-ink text-gold'}`}>{num ?? '–'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold leading-snug ${q.off ? 'text-ink/45 line-through' : ''}`}>{q.title || qText(q, {})}</p>
                  <p className="text-xs text-ink/55 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    <span>{TYPE_LABEL[q.type]}</span>
                    <span>·</span>
                    <span>{gs.length === CODES.length ? 'All outlets' : gs.map((c) => GROUP_SHORT[c]).join(', ')}</span>
                    {q.custom && <span className="rounded-full gold-gradient text-ink px-2 font-semibold">Added</span>}
                    {q.edited && <span className="rounded-full bg-mist px-2 font-semibold">Reworded</span>}
                    {q.off && <span className="rounded-full bg-ink text-paper px-2 font-semibold">Off</span>}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0 w-full sm:w-auto pl-11 sm:pl-0">
                  <button type="button" onClick={() => setEditing(q)} className="h-9 px-3 rounded-full border border-ink/15 text-sm font-semibold hover:border-gold">Edit</button>
                  <button type="button" onClick={() => toggle(q)} className="h-9 px-3 rounded-full text-sm font-semibold text-ink/60 hover:text-ink hover:bg-mist">{q.off ? 'Turn on' : 'Turn off'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && <QuestionSheet q={editing} row={rowOf(editing.key)} all={all} say={say} onClose={() => setEditing(null)} />}
    </div>
  )
}

// The stored row for a question, before any change
function baseRow(q, r = {}) {
  if (q.custom) return { ...r, key: q.key, section: q.section }
  return { key: q.key, section: q.section, after: '', type: 'builtin', q: r.q || '', hint: r.hint || '', options: [], unit: '', groups: [], required: false, active: r.active !== false }
}

function QuestionSheet({ q, row, all, say, onClose }) {
  const isNew = !q.key
  const builtIn = !isNew && !q.custom
  const r = row || {}
  const [form, setForm] = useState(() => ({
    q: isNew ? '' : builtIn ? r.q || '' : r.q,
    hint: builtIn ? r.hint || '' : r.hint || '',
    type: r.type || 'single',
    options: (r.options || []).join('\n'),
    unit: r.unit || '',
    groups: r.groups && r.groups.length ? r.groups : CODES,
    after: isNew ? '' : r.after || '',
    required: isNew ? true : !!r.required,
    section: r.section || q.section,
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const places = useMemo(() => all.filter((x) => x.section === form.section && x.key !== q.key), [all, form.section, q.key])
  const choices = form.type === 'single' || form.type === 'multi'

  async function save() {
    if (!builtIn && !form.groups.length) return setError('Pick at least one outlet group.')
    setBusy(true)
    setError('')
    try {
      const out = builtIn
        ? { ...baseRow(q, r), q: form.q.trim(), hint: form.hint.trim() }
        : {
            key: q.key || '', section: form.section, after: form.after, type: form.type, q: form.q.trim(), hint: form.hint.trim(),
            options: choices ? form.options.split('\n').map((o) => o.trim()).filter(Boolean) : [], unit: form.type === 'number' ? form.unit.trim() : '',
            groups: form.groups.length === CODES.length ? [] : form.groups, required: form.required, active: r.active !== false,
          }
      await saveQuestion(out)
      say(isNew ? 'Question added' : 'Question saved')
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={isNew ? 'Add a question' : builtIn ? 'Reword a question' : 'Edit question'}
      onClose={onClose}
      footer={
        <Button variant="gold" disabled={busy || (!builtIn && !form.q.trim())} onClick={save}>
          {busy ? <Spinner /> : isNew ? 'Add question' : 'Save'}
        </Button>
      }
    >
      {builtIn && (
        <div className="rounded-xl bg-mist px-3.5 py-3 text-sm">
          <p className="text-ink/55 text-xs uppercase tracking-wider font-semibold">Now reads</p>
          <p className="mt-1 font-semibold">{qText(BASE_QUESTIONS.find((x) => x.key === q.key) || q, { group: GROUPS[0] })}</p>
          <p className="text-xs text-ink/55 mt-1.5">You can change the wording and the note. Its answers stay as they are. Leave a box empty to keep the original.</p>
        </div>
      )}
      {!builtIn && (
        <Field label="Section">
          <select className={inputClass} value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value, after: '' }))} disabled={!isNew}>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </Field>
      )}
      <Field label="Question">
        <textarea className={`${inputClass} py-3 min-h-[80px]`} value={form.q} onChange={(e) => set('q')(e.target.value)} maxLength={300} placeholder={builtIn ? 'New wording' : 'e.g. Is there a TV showing football?'} />
      </Field>
      <Field label="Note for the BA" hint="Optional. Shown under the question.">
        <input className={inputClass} value={form.hint} onChange={(e) => set('hint')(e.target.value)} maxLength={300} />
      </Field>
      {!builtIn && (
        <>
          <Group label="Answer">
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, type: t.value, required: t.value === 'single' || t.value === 'multi' }))} className={`rounded-xl border px-3 py-2.5 text-left ${form.type === t.value ? 'border-gold bg-gold/10' : 'border-ink/12 bg-white hover:border-gold/60'}`}>
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs text-ink/55">{t.sub}</p>
                </button>
              ))}
            </div>
          </Group>
          {choices && (
            <Field label="Answers to choose from" hint="One per line. Write None or Nothing as an answer that clears the others.">
              <textarea className={`${inputClass} py-3 min-h-[120px]`} value={form.options} onChange={(e) => set('options')(e.target.value)} placeholder={'Yes\nNo'} />
            </Field>
          )}
          {form.type === 'number' && (
            <Field label="Unit" hint="Optional, e.g. kegs a week">
              <input className={inputClass} value={form.unit} onChange={(e) => set('unit')(e.target.value)} maxLength={40} />
            </Field>
          )}
          <Group label="Asked in">
            <div className="flex flex-wrap gap-2">
              {CODES.map((c) => {
                const on = form.groups.includes(c)
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => set('groups')(on ? form.groups.filter((x) => x !== c) : [...form.groups, c])} className={`h-10 px-3.5 rounded-full border text-sm font-semibold ${on ? 'border-gold bg-gold/15' : 'border-ink/15 text-ink/55'}`}>
                    {on ? '✓ ' : ''}{GROUP_SHORT[c]}
                  </button>
                )
              })}
            </div>
          </Group>
          <Field label="Place it">
            <select className={inputClass} value={form.after} onChange={(e) => set('after')(e.target.value)}>
              <option value="">At the end of the section</option>
              <option value="^">At the start of the section</option>
              {places.map((x) => <option key={x.key} value={x.key}>After: {(x.title || qText(x, {})).slice(0, 70)}</option>)}
            </select>
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-ink/12 bg-white px-3.5 py-3">
            <span>
              <span className="block text-sm font-semibold">Answer required</span>
              <span className="block text-xs text-ink/55">Off lets the BA move on without answering</span>
            </span>
            <input type="checkbox" className="w-5 h-5 accent-[#C9A227]" checked={form.required} onChange={(e) => set('required')(e.target.checked)} />
          </label>
        </>
      )}
      {error && <Notice>{error}</Notice>}
    </Sheet>
  )
}

// A label over a row of buttons (a <label> would pass every click to the first one)
function Group({ label, children }) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-sm font-semibold text-ink/80 mb-1.5">{label}</p>
      {children}
    </div>
  )
}
