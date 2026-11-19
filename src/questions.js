// The admin's question changes, kept on the phone so surveys work offline.
// The server sends a new version when the admin saves; phones pick it up on
// the next heartbeat (or when the home screen opens).
import { fetchQuestions, saveQuestions as save } from './api'
import { applyQuestionConfig } from './questionnaire'

const KEY = 'draught_questions_v1'

function stored() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null } catch { return null }
}

export function loadStoredQuestions() {
  const c = stored()
  if (c) applyQuestionConfig(c.rows)
}

let running = null
export function syncQuestions(version) {
  const have = stored()
  if (version && have && have.version === version) return Promise.resolve(false)
  if (running) return running
  running = fetchQuestions(version ? have?.version : '')
    .then((r) => {
      if (r.same) return false
      try { localStorage.setItem(KEY, JSON.stringify({ version: r.version, rows: r.rows || [] })) } catch { /* storage full */ }
      applyQuestionConfig(r.rows || [])
      window.dispatchEvent(new Event('questions-changed'))
      return true
    })
    .catch(() => false)
    .finally(() => { running = null })
  return running
}

// Saves one or more rows (a question, a section order) and reloads the questionnaire
export async function saveQuestions(rows) {
  const r = await save(Array.isArray(rows) ? rows : [rows])
  await syncQuestions()
  return r
}
