import { useEffect, useState } from 'react'
import { Button, Spinner } from '../components/ui'
import { CONFIG, GROUP_CODE, SECTIONS, mergeQuestions, qText } from '../questionnaire'
import { saveQuestions, syncQuestions } from '../questions'
import QuestionEditor, { GROUP_SHORT, TYPE_INFO } from './QuestionEditor'

const CODES = Object.keys(GROUP_CODE)

// Which outlet groups see a question, trying a typical outlet of each group
function groupsOf(q) {
  if (!q.show) return CODES
  return CODES.filter((c) => {
    const a = { group: GROUP_CODE[c], o_onTap: c === 'hb' ? ['St. George', 'Habesha', 'Other'] : ['St. George', 'Other'], c_everHabesha: 'Never' }
    try { return !!q.show(a) } catch { return true }
  })
}

export default function QuestionsTab({ say }) {
  const [, setTick] = useState(0)
  const [section, setSection] = useState(SECTIONS[0].id)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  useEffect(() => {
    syncQuestions().finally(() => setLoading(false))
    const on = () => setTick((n) => n + 1)
    window.addEventListener('questions-changed', on)
    return () => window.removeEventListener('questions-changed', on)
  }, [])

  const all = mergeQuestions(CONFIG)
  const list = all.filter((q) => q.section === section)
  const rowOf = (key) => CONFIG.find((r) => r.key === key)
  const added = all.filter((q) => q.custom).length
  const off = all.filter((q) => q.off).length
  let n = 0

  async function run(key, rows, msg) {
    setBusy(key)
    try {
      await saveQuestions(rows)
      if (msg) say(msg)
    } catch (err) {
      say(err.message)
    }
    setBusy('')
  }

  function toggle(q) {
    const r = rowOf(q.key)
    run(q.key, [{ key: q.key, section: q.section, spec: (r && r.spec) || {}, columns: (r && r.columns) || [], active: !!q.off }], q.off ? 'Question turned on' : 'Question turned off')
  }

  function move(i, j) {
    const keys = list.map((q) => q.key)
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
    run(list[i].key, [{ key: '_order_' + section, section, spec: { order: keys } }])
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
        <Button variant="gold" className="!w-auto px-5" onClick={() => setEditing({ isNew: true })}>
          Add a question
        </Button>
      </div>

      <p className="text-sm text-ink/55">
        Edit any question: wording, answers, follow-up boxes, number boxes, rating rows, who gets it and when. Use the arrows to change the order. Changes reach the phones on their next sync, usually within a minute. A question turned off keeps its answers in the sheet.
      </p>

      {loading && !CONFIG.length ? (
        <div className="py-10 flex justify-center text-ink/40"><Spinner /></div>
      ) : (
        <ul className="space-y-2">
          {list.map((q, i) => {
            const num = q.off ? null : ++n
            const gs = groupsOf(q)
            const count = q.options ? `${q.options.length} answers` : q.fields ? `${q.fields.length} boxes` : q.rows ? `${q.rows.length} rows` : q.parts ? `${q.parts.length} parts` : ''
            return (
              <li key={q.key} className={`rounded-2xl border px-3 sm:px-4 py-3 flex flex-wrap sm:flex-nowrap items-start gap-x-3 gap-y-2 ${q.off ? 'bg-mist/60 border-ink/8' : 'bg-white border-ink/10'}`}>
                <span className={`shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${q.off ? 'bg-ink/10 text-ink/40' : 'bg-ink text-gold'}`}>{num ?? '–'}</span>
                <button type="button" onClick={() => setEditing({ q })} className="flex-1 min-w-0 text-left">
                  <p className={`font-semibold leading-snug ${q.off ? 'text-ink/45 line-through' : ''}`}>{qText(q, { group: GROUP_CODE.lost })}</p>
                  <p className="text-xs text-ink/55 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    <span>{TYPE_INFO[q.type][0]}</span>
                    {count && <><span>·</span><span>{count}</span></>}
                    <span>·</span>
                    <span>{gs.length === CODES.length ? 'All outlets' : gs.length ? gs.map((c) => GROUP_SHORT[c]).join(', ') : 'Depends on earlier answers'}</span>
                    {q.custom && <span className="rounded-full gold-gradient text-ink px-2 font-semibold">Added</span>}
                    {q.edited && <span className="rounded-full bg-mist px-2 font-semibold">Edited</span>}
                    {q.off && <span className="rounded-full bg-ink text-paper px-2 font-semibold">Off</span>}
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto pl-11 sm:pl-0">
                  {busy === q.key ? (
                    <span className="w-[72px] h-9 flex items-center justify-center text-ink/40"><Spinner /></span>
                  ) : (
                    <>
                      <button type="button" aria-label="Move up" title="Move up" disabled={i === 0 || !!busy} onClick={() => move(i, i - 1)} className="w-9 h-9 rounded-full text-ink/60 hover:bg-mist disabled:opacity-25">↑</button>
                      <button type="button" aria-label="Move down" title="Move down" disabled={i === list.length - 1 || !!busy} onClick={() => move(i, i + 1)} className="w-9 h-9 rounded-full text-ink/60 hover:bg-mist disabled:opacity-25">↓</button>
                    </>
                  )}
                  <button type="button" onClick={() => setEditing({ q })} className="h-9 px-3 rounded-full border border-ink/15 text-sm font-semibold hover:border-gold">Edit</button>
                  <button type="button" onClick={() => toggle(q)} disabled={!!busy} className="h-9 px-3 rounded-full text-sm font-semibold text-ink/60 hover:text-ink hover:bg-mist">{q.off ? 'Turn on' : 'Turn off'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <QuestionEditor
          q={editing.q || null}
          row={editing.q ? rowOf(editing.q.key) : undefined}
          section={section}
          all={all}
          say={say}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
