import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { flushQueue } from '../api'
import { getFix, latestFix, locationError, locationMessage } from '../location'
import { setActivity } from '../presence'
import { RETURN_HOME_MS } from '../config'
import { clearDraft, countDone, getDraft, getUser, logField, pushQueue, setDraft } from '../storage'
import { Button, Sheet, Spinner } from '../components/ui'
import { StepOutlet } from '../components/steps'
import Question from '../components/Question'
import { GUIDES } from '../guides'
import { GROUPS, QUESTIONS, SECTIONS, answered, answersForSheet, isShown, pruneHidden } from '../questionnaire'

const EMPTY = { outletName: '', outletId: '', division: '', agent: '', parentTerritory: '', territory: '', area: '', picked: false, offline: false, answers: {}, skipped: [] }
const GROUP_Q = { key: 'group', type: 'single', q: 'Which group is this outlet in?', options: GROUPS }

// The screens of one survey, worked out from the answers so far
function buildSteps(d) {
  const steps = [{ id: 'outlet', kind: 'outlet' }, { id: 'group', kind: 'group' }]
  SECTIONS.forEach((s, si) => {
    // Only the questions this outlet gets, so the count matches what the BA will see
    const shown = QUESTIONS.filter((q) => q.section === s.id && isShown(q, d.answers))
    steps.push({ id: 'intro-' + s.id, kind: 'intro', section: s, n: si + 1, count: shown.length })
    if (d.skipped.includes(s.id)) return
    shown.forEach((q, qi) => steps.push({ id: q.key, kind: 'question', q, section: s, n: qi + 1, of: shown.length }))
  })
  steps.push({ id: 'review', kind: 'review' })
  return steps
}

function ready(step, d) {
  if (step.kind === 'outlet') return d.outletId.trim() !== '' && (d.picked || d.offline)
  if (step.kind === 'group') return !!d.answers.group
  if (step.kind === 'question') return answered(step.q, d.answers)
  return true
}

function makeId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tail = ''
  for (let i = 0; i < 6; i++) tail += chars[Math.floor(Math.random() * chars.length)]
  return `SRV-${Date.now()}-${tail}`
}

function buildRecord(d, user, location, start) {
  return {
    id: makeId(),
    date: new Date().toISOString(),
    baId: user.id,
    baName: user.name,
    token: user.token,
    location: location ? { lat: location.lat, lng: location.lng, accuracy: location.accuracy } : null,
    outletId: d.outletId.trim().toUpperCase(),
    outletName: d.outletName.trim(),
    division: d.division,
    agent: d.agent,
    parentTerritory: d.parentTerritory,
    territory: d.territory,
    area: d.area,
    startedAt: start.at,
    startLocation: start.fix ? { lat: start.fix.lat, lng: start.fix.lng, accuracy: start.fix.accuracy } : null,
    group: d.answers.group || '',
    skipped: SECTIONS.filter((s) => d.skipped.includes(s.id)).map((s) => s.short).join(', '),
    answers: answersForSheet(d.answers, d.skipped),
  }
}

const SECTION_ICON = {
  assess: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  observe: <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3.2" /></>,
  manager: <><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21c.8-4.2 3.6-6.5 7-6.5s6.2 2.3 7 6.5" /><path d="M12 14.5l-1.2 2.3L12 21l1.2-4.2z" /></>,
  staff: <><path d="M7 21h10" /><path d="M12 21V10" /><path d="M8 10h8V6.5a4 4 0 0 0-8 0z" /><path d="M16 8h3v3" /></>,
  consumer: <><path d="M6 6h9v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" /><path d="M15 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><path d="M6 9.5h9" /></>,
}

export default function Survey() {
  const navigate = useNavigate()
  // Pick up a survey that was left part-way
  const [draft] = useState(() => {
    const d = getDraft()
    return d && d.stepId ? d : null
  })
  const [data, setData] = useState(() => (draft ? { ...EMPTY, ...draft.data } : EMPTY))
  const [stepId, setStepId] = useState(draft?.stepId ?? 'outlet')
  const [dir, setDir] = useState(1)
  const [status, setStatus] = useState('idle') // idle | sending | saved | queued
  const [error, setError] = useState('')
  const [advance, setAdvance] = useState(0)
  const scroller = useRef(null)

  const steps = useMemo(() => buildSteps(data), [data])
  let index = steps.findIndex((s) => s.id === stepId)
  if (index < 0) index = 0
  const step = steps[index]
  const isLast = step.kind === 'review'
  const canGo = ready(step, data)

  // Outlet fields sit on the survey; answers go through pruneHidden so a changed
  // answer clears the questions it no longer leads to
  const setOutlet = (patch) => setData((d) => ({ ...d, ...patch }))
  const setAnswer = (patch) => setData((d) => ({ ...d, answers: pruneHidden({ ...d.answers, ...patch }) }))

  function goTo(id, d) {
    const to = steps.findIndex((s) => s.id === id)
    setDir(d ?? (to >= index ? 1 : -1))
    setStepId(id)
  }
  const next = () => index < steps.length - 1 && goTo(steps[index + 1].id, 1)
  const back = () => index > 0 && goTo(steps[index - 1].id, -1)

  // A single-choice tap moves on by itself, after the tick has shown
  useEffect(() => {
    if (!advance) return
    const t = setTimeout(next, 320)
    return () => clearTimeout(t)
  }, [advance])

  function startSection(id) {
    if (!data.skipped.includes(id)) return next()
    // Un-skipping adds the section's questions back; move on once they're in
    setData((d) => ({ ...d, skipped: d.skipped.filter((x) => x !== id) }))
    setAdvance((n) => n + 1)
  }
  function skipSection(id) {
    const after = steps.slice(index + 1).find((s) => s.kind !== 'question' || s.section.id !== id)
    setData((d) => ({ ...d, skipped: d.skipped.includes(id) ? d.skipped : [...d.skipped, id] }))
    setDir(1)
    setStepId(after ? after.id : 'review')
  }

  // Start time and location are taken the moment the survey opens.
  // A resumed survey keeps its original start time and location.
  const start = useRef(draft?.start || { at: new Date().toISOString(), fix: null })
  const [startFix, setStartFix] = useState(start.current.fix)
  const [startLoc, setStartLoc] = useState(start.current.fix ? 'ok' : 'finding') // finding | ok | off
  useEffect(() => {
    if (start.current.fix) return
    let live = true
    getFix()
      .then((f) => {
        start.current.fix = f
        if (live) {
          setStartFix(f)
          setStartLoc('ok')
        }
      })
      .catch((err) => {
        // Weak signal: use the last fix if it's under two minutes old
        const f = latestFix()
        if (err?.code !== 1 && f && Date.now() - f.at < 120000) {
          start.current.fix = f
          if (live) {
            setStartFix(f)
            setStartLoc('ok')
          }
        } else if (live) setStartLoc('off')
      })
    return () => {
      live = false
    }
  }, [])
  const startTime = new Date(start.current.at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const where =
    step.kind === 'question' ? `${step.section.short} · question ${step.n} of ${step.of}` : step.kind === 'intro' ? step.section.title : step.kind === 'review' ? 'Ready to send' : step.kind === 'group' ? 'Outlet group' : 'Outlet'

  // Save progress after every change
  const touched = stepId !== 'outlet' || JSON.stringify(data) !== JSON.stringify(EMPTY)
  const finished = useRef(false)
  useEffect(() => {
    if (finished.current || !touched) return
    setDraft({ baId: getUser()?.id, data, stepId, where, start: start.current, savedAt: Date.now() })
  }, [data, stepId, startFix])

  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
    const outlet = data.outletId.trim() ? ` at ${data.outletName.trim() || 'outlet'} (${data.outletId.trim()})` : ''
    setActivity(stepId === 'outlet' ? 'Starting a survey' : `Surveying${outlet}: ${where}`, stepId === 'group')
  }, [stepId])

  // In-app dialog, since some browsers and embedded views block window.confirm
  const [leaving, setLeaving] = useState(false)
  const [guide, setGuide] = useState(null)
  function abandon() {
    if (touched) setLeaving(true)
    else navigate('/', { replace: true })
  }
  function discard() {
    finished.current = true
    clearDraft()
    navigate('/', { replace: true })
  }

  // Submitting never waits on the network. The survey goes into the phone's
  // queue, the BA sees it saved, and the upload runs in the background.
  async function submit() {
    setStatus('sending')
    setError('')
    if (locationError()?.code === 1) {
      setError(locationMessage(locationError()))
      setStatus('idle')
      return
    }
    // Use the running GPS fix. Only if it's stale, give a fresh one 4 seconds.
    let fix = latestFix()
    if (!fix || Date.now() - fix.at > 5 * 60000) {
      fix = await Promise.race([getFix().catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))])
      fix = fix || latestFix() || start.current.fix
    }
    const record = buildRecord(data, getUser(), fix, start.current)
    finished.current = true
    pushQueue(record)
    clearDraft()
    countDone()
    const ans = record.answers
    logField({
      at: Date.now(),
      orders: Number(ans.o_ordersWatched) || 0,
      server: !data.skipped.includes('staff'),
      owner: !data.skipped.includes('manager'),
      quotes: ['o_surprise', 's_quote', 'c_quote', 'c_orderWords', 'm_hbStopWords'].filter((k) => ans[k]).length,
    })
    setActivity(`Submitted survey at ${record.outletName || 'outlet'} (${record.outletId})`, true)
    setStatus(navigator.onLine ? 'saved' : 'queued')
    flushQueue()
    setTimeout(() => navigate('/', { replace: true }), RETURN_HOME_MS)
  }

  if (status === 'saved' || status === 'queued') {
    const saved = status === 'saved'
    return (
      <main className="min-h-full flex flex-col items-center justify-center px-8 text-center safe-top safe-bottom">
        <div className={`anim-pop w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${saved ? 'gold-gradient text-ink' : 'bg-mist text-ink'}`}>
          {saved ? (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path className="anim-draw" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" /><path className="anim-draw" d="M7 10l5 5 5-5" /><path d="M5 20h14" />
            </svg>
          )}
        </div>
        <h2 className="anim-rise font-serif text-2xl mt-6" style={{ animationDelay: '120ms' }}>{saved ? 'Survey saved. Thank you.' : 'Saved on the phone'}</h2>
        {!saved && <p className="anim-rise text-ink/65 mt-2" style={{ animationDelay: '200ms' }}>Uploads when online</p>}
      </main>
    )
  }

  const progress = steps.length > 1 ? index / (steps.length - 1) : 0
  const sectionNow = step.section?.id

  return (
    <main className="h-full flex flex-col safe-top anim-fade">
      <header className="bg-ink text-paper px-4 pt-3 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-gold font-semibold">Draught Market Visit</p>
            <button type="button" onClick={abandon} className="w-10 h-10 -mr-2 rounded-full text-2xl text-paper/80" aria-label="Leave survey">
              ×
            </button>
          </div>
          <p className="text-xs text-paper/60 -mt-1 mb-3 truncate">
            Started {startTime}
            <span className="text-paper/30"> · </span>
            {startLoc === 'ok' ? <span className="text-gold">Location ±{startFix.accuracy} m</span> : startLoc === 'finding' ? 'Getting location…' : 'No location'}
          </p>
          <div className="h-1.5 rounded-full bg-paper/15 overflow-hidden">
            <div className="h-full rounded-full gold-gradient transition-[width] duration-500 ease-[cubic-bezier(.22,1,.36,1)]" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide">
            {SECTIONS.map((s) => {
              const skipped = data.skipped.includes(s.id)
              const sIndex = steps.findIndex((x) => x.id === 'intro-' + s.id)
              const state = sectionNow === s.id ? 'now' : index > sIndex && sIndex >= 0 ? 'done' : 'todo'
              return (
                <span key={s.id} className={`truncate transition-colors ${state === 'now' ? 'text-gold' : state === 'done' ? 'text-paper/70' : 'text-paper/30'} ${skipped ? 'line-through' : ''}`}>
                  {s.tab}
                </span>
              )
            })}
          </div>
        </div>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-7">
          <div key={step.id} className={dir > 0 ? 'anim-slide-r' : 'anim-slide-l'}>
            {step.kind === 'outlet' && <StepOutlet data={data} set={setOutlet} />}
            {step.kind === 'group' && (
              <Question q={GROUP_Q} a={data.answers} set={setAnswer} eyebrow="Outlet group" onPicked={() => setAdvance((n) => n + 1)} />
            )}
            {step.kind === 'question' && GUIDES[step.section.id] && (
              <div className="flex justify-end -mt-3 mb-1">
                <button type="button" onClick={() => setGuide(step.section.id)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-gold-dark hover:bg-gold/10">
                  <BookIcon /> መመሪያ
                </button>
              </div>
            )}
            {step.kind === 'question' && (
              <Question q={step.q} a={data.answers} set={setAnswer} eyebrow={`${step.section.short} · ${step.n} of ${step.of}`} onPicked={() => setAdvance((n) => n + 1)} />
            )}
            {step.kind === 'intro' && <Intro step={step} skipped={data.skipped.includes(step.section.id)} onSkip={() => skipSection(step.section.id)} onGuide={() => setGuide(step.section.id)} />}
            {step.kind === 'review' && <Review data={data} steps={steps} onEdit={(id) => goTo(id, -1)} />}
          </div>
        </div>
      </div>

      <footer className="border-t border-ink/10 bg-paper px-5 pt-3 safe-bottom">
        <div className="max-w-md mx-auto space-y-2">
          {error && <p className="rounded-xl bg-paper border border-ink/15 border-l-4 border-l-gold text-ink text-sm px-4 py-3">{error}</p>}
          <div className="flex gap-3">
            {index > 0 && (
              <Button variant="ghost" className="w-auto! flex-[0_0_32%]" onClick={back} disabled={status === 'sending'}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button variant="gold" onClick={submit} disabled={status === 'sending'}>
                {status === 'sending' ? <Spinner /> : 'Submit survey'}
              </Button>
            ) : step.kind === 'intro' ? (
              <Button onClick={() => startSection(step.section.id)}>Start</Button>
            ) : (
              <Button onClick={next} disabled={!canGo}>
                {step.kind === 'question' && steps[index + 1]?.kind !== 'question' ? 'Finish section' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </footer>
      {leaving && (
        <Sheet
          title="Leave this survey?"
          onClose={() => setLeaving(false)}
          footer={
            <div className="space-y-2">
              <Button variant="gold" onClick={() => navigate('/', { replace: true })}>
                Save and continue later
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" onClick={() => setLeaving(false)}>
                  Stay
                </Button>
                <Button onClick={discard}>Discard</Button>
              </div>
            </div>
          }
        >
          <p className="text-sm text-ink/70">Your answers are saved on the phone. You can carry on from the home screen.</p>
        </Sheet>
      )}
      {guide && <GuideSheet guide={GUIDES[guide]} onClose={() => setGuide(null)} />}
    </main>
  )
}

function Intro({ step, skipped, onSkip, onGuide }) {
  const s = step.section
  return (
    <div className="pt-4 text-center">
      <div className="anim-pop mx-auto w-20 h-20 rounded-full bg-ink text-gold flex items-center justify-center shadow-lg">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {SECTION_ICON[s.id]}
        </svg>
      </div>
      <p className="anim-rise mt-6 text-xs uppercase tracking-[0.16em] text-gold-dark font-semibold" style={{ animationDelay: '80ms' }}>
        Section {step.n} of {SECTIONS.length}
      </p>
      <h2 className="anim-rise font-serif text-[30px] leading-tight mt-1.5" style={{ animationDelay: '120ms' }}>
        {s.title}
      </h2>
      <p className="anim-rise text-ink/60 mt-3 leading-relaxed max-w-xs mx-auto" style={{ animationDelay: '160ms' }}>
        {s.intro}
      </p>
      <p className="anim-rise text-sm text-ink/45 mt-2" style={{ animationDelay: '200ms' }}>
        {step.count} {step.count === 1 ? 'question' : 'questions'}
      </p>
      {GUIDES[s.id] && (
        <button type="button" onClick={onGuide} className="anim-rise btn-hover mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full border border-gold/60 text-sm font-semibold text-ink hover:bg-gold/10" style={{ animationDelay: '220ms' }}>
          <BookIcon /> {GUIDES[s.id].title.split('፦')[0]}
        </button>
      )}
      {skipped && <p className="anim-rise mt-5 text-sm font-semibold text-gold-dark">Skipped. Press Start to answer it after all.</p>}
      <button type="button" onClick={onSkip} className="anim-rise mt-8 text-sm text-ink/55 underline underline-offset-4 min-h-[44px] px-3 hover:text-ink" style={{ animationDelay: '240ms' }}>
        {s.skipLabel}
      </button>
    </div>
  )
}

function Review({ data, steps, onEdit }) {
  return (
    <div>
      <div className="mb-6 anim-rise">
        <p className="text-xs uppercase tracking-[0.14em] text-gold-dark font-semibold">Last step</p>
        <h2 className="font-serif text-[28px] mt-1.5 leading-tight">Ready to send</h2>
        <p className="text-sm text-ink/55 mt-1.5">Check the outlet and the sections, then submit.</p>
      </div>
      <div className="rounded-2xl bg-ink text-paper p-5 anim-pop">
        <p className="font-serif text-xl leading-tight">{data.outletName || 'Outlet'}</p>
        <p className="text-gold text-sm font-semibold mt-1">
          {data.outletId}
          {data.territory && <span className="text-paper/60 font-normal"> · {data.territory}</span>}
        </p>
        <p className="text-sm text-paper/75 mt-3 pt-3 border-t border-paper/15">{data.answers.group || 'No group picked'}</p>
      </div>
      <ul className="mt-4 space-y-2.5 stagger">
        {SECTIONS.map((s, i) => {
          const skipped = data.skipped.includes(s.id)
          const qs = steps.filter((x) => x.kind === 'question' && x.section.id === s.id)
          const done = qs.filter((x) => answered(x.q, data.answers)).length
          return (
            <li key={s.id} style={{ '--i': i }}>
              <button type="button" onClick={() => onEdit('intro-' + s.id)} className="pick w-full flex items-center gap-3 rounded-2xl bg-white border border-ink/12 px-4 py-3.5 text-left hover:border-gold/70">
                <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${skipped ? 'bg-mist text-ink/40' : 'gold-gradient text-ink'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {SECTION_ICON[s.id]}
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-xs text-ink/55">{skipped ? s.skipLabel : `${done} of ${qs.length} answered`}</span>
                </span>
                <span className="text-sm text-gold-dark font-semibold">Edit</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  )
}

// The field kit guide for this section, in Amharic
function GuideSheet({ guide, onClose }) {
  return (
    <Sheet title={guide.title} onClose={onClose} footer={<Button variant="gold" onClick={onClose}>ዝጋ</Button>}>
      <p className="text-xs uppercase tracking-wider text-gold-dark font-semibold -mt-2">{guide.en}</p>
      <p className="text-[15px] leading-relaxed text-ink/75">{guide.intro}</p>
      <ol className="space-y-3">
        {guide.items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-ink text-gold text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <div className="pt-0.5">
              <p className="text-[15px] leading-relaxed">{it.q}</p>
              {it.note && <p className="text-[13px] text-ink/55 mt-0.5 leading-relaxed">{it.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      {guide.rule && <p className="rounded-xl bg-gold/10 border border-gold/30 px-3.5 py-3 text-[14px] leading-relaxed">{guide.rule}</p>}
    </Sheet>
  )
}
