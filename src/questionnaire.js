// Draught Market Visit Questionnaire (Addis Ababa, high-end outlets).
// Every answer is saved in its own column, named by `key`. The same keys are
// listed in ANSWER_KEYS in apps-script/Survey.gs: change both together.
//
// Question types
//   single   one tap, moves on by itself. `other` opens a text box, `follow`
//            asks a short extra field for some answers.
//   multi    tick any; `none` clears the others.
//   numbers  one number per field, blank = unknown.
//   rating   1 to 5 for St. George and Habesha on each row.
//   pair     two single choices on one screen (brand + issue).

export const SG = 'St. George'
export const HB = 'Habesha'

export const GROUPS = ['Lost Habesha outlet', 'St. George-dominant (never Habesha)', 'Active Habesha outlet']

export const SECTIONS = [
  {
    id: 'manager',
    title: 'Outlet owner / manager',
    short: 'Owner / manager',
    intro: 'Ask for the owner or the manager who decides which draught brands are sold.',
    skipLabel: 'Owner and manager not available',
  },
  {
    id: 'staff',
    title: 'Bar staff',
    short: 'Bar staff',
    intro: 'Talk to the bartender or the waiter who pours the draught.',
    skipLabel: 'No bar staff available',
  },
  {
    id: 'consumer',
    title: 'Draught consumer',
    short: 'Consumer',
    intro: 'Pick one customer who is drinking draught right now.',
    skipLabel: 'No draught drinker to ask',
  },
]

// Habesha was sold here once and has gone: a lost outlet, or the manager said so (not an active outlet)
const lostHabesha = (a) => a.group === GROUPS[0] || (a.m_soldHabesha === 'Yes' && a.group !== GROUPS[2])

export const QUESTIONS = [
  // 1. Outlet owner / manager
  { section: 'manager', key: 'm_decider', type: 'single', q: 'Who decides which draught brands are sold here?', options: ['Owner', 'Manager', 'Other'], other: 'Other' },
  {
    section: 'manager', key: 'm_kegs', type: 'numbers', q: 'Weekly draught kegs sold, by brand', hint: 'Leave blank if they don\'t know.',
    fields: [{ key: 'm_kegsStGeorge', label: SG }, { key: 'm_kegsHabesha', label: HB }, { key: 'm_kegsOther', label: 'Other' }], unit: 'kegs a week',
  },
  {
    section: 'manager', key: 'm_sgReason', type: 'single', q: 'Main reason St. George sells most here', hint: 'Tick one.',
    options: ['Customer demand', 'Better margin', 'Credit terms', 'Free kegs / rebates', 'Equipment provided', 'Exclusivity agreement', 'Reliable supply', 'Rep relationship'],
  },
  {
    section: 'manager', key: 'm_agreement', type: 'single', q: 'Do you have an agreement that limits other draught brands?',
    options: ['Yes, written', 'Yes, verbal', 'No'],
    follow: { when: ['Yes, written', 'Yes, verbal'], key: 'm_agreementEnds', label: 'When does it end?', placeholder: 'e.g. June 2027' },
  },
  { section: 'manager', key: 'm_soldHabesha', type: 'single', q: 'Did you sell Habesha draught before?', options: ['Yes', 'No'] },
  { section: 'manager', key: 'm_hbVsSg', type: 'single', q: 'At its best, how did Habesha sell compared with St. George?', options: ['More', 'About the same', 'Less'], show: (a) => a.m_soldHabesha === 'Yes' },
  {
    section: 'manager', key: 'm_hbStopReason', type: 'single', q: 'Main reason Habesha draught was stopped', hint: 'Tick one.', show: (a) => a.m_soldHabesha === 'Yes' && a.group !== GROUPS[2],
    options: ['Competitor offer', 'Exclusivity contract', 'Stock-outs / late delivery', 'Quality complaints', 'Low customer demand', 'Equipment problem', 'Poor rep service', 'Payment dispute', 'Ownership change'],
  },
  {
    section: 'manager', key: 'm_rate', type: 'rating', q: 'Rate each brand from 1 to 5', hint: '1 = very poor, 5 = excellent',
    rows: [['Demand', 'Demand'], ['Profit', 'Profit'], ['Supply', 'Supply'], ['Quality', 'Quality'], ['Service', 'Service']], prefix: 'm_rate',
  },
  {
    section: 'manager', key: 'm_relist', type: 'single', q: 'What would make you list (or re-list) Habesha draught?', hint: 'Tick one.',
    options: ['Better margin', 'Credit', 'Equipment', 'Promotions', 'Staff incentive', 'Reliable supply', 'Nothing'],
  },
  { section: 'manager', key: 'm_trial', type: 'single', q: 'Would you accept a Habesha draught trial?', options: ['Yes, now', 'Yes, after contract ends', 'No'] },

  // 2. Bar staff
  { section: 'staff', key: 's_defaultServe', type: 'single', q: 'When a customer just says "draught", which brand do you serve?', options: [SG, HB, 'Other'] },
  {
    section: 'staff', key: 's_askByName', type: 'numbers', q: 'Out of 10 draught customers, how many ask by brand name?', max: 10, total: 10,
    fields: [{ key: 's_askStGeorge', label: SG }, { key: 's_askHabesha', label: HB }], unit: 'out of 10',
  },
  { section: 'staff', key: 's_incentive', type: 'multi', q: 'Does any brewery give staff incentives (cash, gifts, bonuses)?', hint: 'Tick all that apply.', options: [SG, HB, 'Other', 'None'], none: 'None' },
  { section: 'staff', key: 's_easierPour', type: 'single', q: 'Which brand is easier to pour with less foam waste?', options: [SG, HB, 'Same'] },
  {
    section: 'staff', key: 's_stockouts', type: 'numbers', q: 'Stock-outs in the last 3 months', hint: 'How many times each brand ran out.',
    fields: [{ key: 's_stockoutStGeorge', label: SG }, { key: 's_stockoutHabesha', label: HB }], unit: 'times',
  },
  {
    section: 'staff', key: 's_complaint', type: 'pair', q: 'Most common customer complaint about draught',
    parts: [
      { key: 's_complaintBrand', label: 'Which brand?', options: [SG, HB] },
      { key: 's_complaintIssue', label: 'What is the complaint?', options: ['Warm', 'Flat', 'Taste', 'Price', 'None'] },
    ],
  },
  {
    section: 'staff', key: 's_removedReason', type: 'single', q: 'Habesha was sold here before. Why was it removed?', hint: 'Tick one.', show: lostHabesha,
    options: ['Competitor offer', 'Low demand', 'Stock-outs', 'Quality', 'Equipment', "Don't know"],
  },
  { section: 'staff', key: 's_recommend', type: 'single', q: 'What would make you recommend Habesha draught?', hint: 'Tick one.', options: ['Staff incentive', 'Training', 'Better quality', 'Customer demand', 'Nothing'] },

  // 3. Draught consumer
  { section: 'consumer', key: 'c_drinking', type: 'single', q: 'Which draught brand are you drinking now?', options: [SG, HB, 'Other'] },
  { section: 'consumer', key: 'c_byName', type: 'single', q: 'Did you ask for it by name?', options: ['Yes, by name', 'No, just asked for "draught"'] },
  { section: 'consumer', key: 'c_reason', type: 'single', q: 'Main reason you chose it', hint: 'Tick one.', options: ['Taste', 'Fresh / cold', 'Price', 'Image / status', 'Habit', 'Friends drink it', 'Only brand here'] },
  { section: 'consumer', key: 'c_everHabesha', type: 'single', q: 'Have you ever drunk Habesha draught?', options: ['Yes, regularly', 'Yes, in the past', 'Tried once', 'Never'] },
  {
    section: 'consumer', key: 'c_whyNot', type: 'single', q: 'Why did you stop, or never drink it?', hint: 'Tick one.', show: (a) => a.c_everHabesha && a.c_everHabesha !== 'Yes, regularly',
    options: ['Not available', 'Taste', 'Inconsistent quality', 'Brand image', 'Never offered'],
  },
  {
    section: 'consumer', key: 'c_rate', type: 'rating', q: 'Rate each brand from 1 to 5', hint: '1 = very poor, 5 = excellent',
    rows: [['Taste', 'Taste'], ['Freshness', 'Freshness'], ['Value', 'Value'], ['Image', 'Image']], prefix: 'c_rate',
  },
  { section: 'consumer', key: 'c_ifUnavailable', type: 'single', q: 'If your brand was not available here, what would you do?', options: ['Drink other draught', 'Drink bottled', 'Other drink', 'Leave'] },
  { section: 'consumer', key: 'c_wouldOrder', type: 'single', q: 'Would you order Habesha draught if it were served here?', options: ['Yes', 'Maybe', 'No'] },
]

// Every column a survey can fill, in sheet order
export const ANSWER_KEYS = QUESTIONS.flatMap((q) => {
  if (q.type === 'numbers') return q.fields.map((f) => f.key)
  if (q.type === 'rating') return q.rows.flatMap(([r]) => [`${q.prefix}${r}SG`, `${q.prefix}${r}HB`])
  if (q.type === 'pair') return q.parts.map((p) => p.key)
  const keys = [q.key]
  if (q.other) keys.push(q.key + 'Other')
  if (q.follow) keys.push(q.follow.key)
  return keys
})

export const isShown = (q, a) => !q.show || !!q.show(a)

// Whether a question has what it needs to move on
export function answered(q, a) {
  const has = (k) => a[k] != null && String(a[k]).trim() !== ''
  switch (q.type) {
    case 'single':
      if (!has(q.key)) return false
      if (q.other && a[q.key] === q.other && !has(q.key + 'Other')) return false
      return true
    case 'multi':
      return Array.isArray(a[q.key]) && a[q.key].length > 0
    case 'numbers':
      if (q.total) {
        const sum = q.fields.reduce((s, f) => s + (Number(a[f.key]) || 0), 0)
        if (sum > q.total) return false
      }
      return true
    case 'rating':
      return q.rows.every(([r]) => has(`${q.prefix}${r}SG`) && has(`${q.prefix}${r}HB`))
    case 'pair':
      return has(q.parts[1].key) && (a[q.parts[1].key] === 'None' || has(q.parts[0].key))
    default:
      return true
  }
}

// Clears answers of questions that are hidden now (after a changed answer)
export function pruneHidden(a) {
  const out = { ...a }
  for (const q of QUESTIONS) {
    if (isShown(q, out)) continue
    for (const k of ANSWER_KEYS.filter((k) => k === q.key || k.startsWith(q.key))) delete out[k]
  }
  return out
}

// Answers ready for the sheet: lists joined, numbers as numbers, blanks left out
export function answersForSheet(a, skipped) {
  const out = {}
  for (const q of QUESTIONS) {
    if (skipped.includes(q.section) || !isShown(q, a)) continue
    if (q.type === 'multi') {
      if (Array.isArray(a[q.key]) && a[q.key].length) out[q.key] = a[q.key].join(', ')
      continue
    }
    if (q.type === 'numbers' || q.type === 'rating') {
      const keys = q.type === 'numbers' ? q.fields.map((f) => f.key) : q.rows.flatMap(([r]) => [`${q.prefix}${r}SG`, `${q.prefix}${r}HB`])
      keys.forEach((k) => { if (a[k] !== '' && a[k] != null) out[k] = Number(a[k]) })
      continue
    }
    const keys = q.type === 'pair' ? q.parts.map((p) => p.key) : [q.key, q.other && q.key + 'Other', q.follow && q.follow.key].filter(Boolean)
    keys.forEach((k) => { if (a[k] != null && String(a[k]).trim() !== '') out[k] = String(a[k]).trim() })
    if (q.other && a[q.key] !== q.other) delete out[q.key + 'Other']
    if (q.follow && !q.follow.when.includes(a[q.key])) delete out[q.follow.key]
    if (q.type === 'pair' && a[q.parts[1].key] === 'None') delete out[q.parts[0].key]
  }
  return out
}
