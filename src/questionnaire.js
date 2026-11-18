// Draught Market Visit Questionnaire (Addis Ababa, high-end outlets).
// Every answer is saved in its own column, named by `key`. The same keys are
// listed in ANSWER_KEYS in apps-script/Survey.gs: change both together.
//
// Question types
//   single   one tap, moves on by itself. `other` opens a text box. `follow`
//            asks extra fields for some answers (name, phone, their words...).
//   multi    tick any; `none` clears the others. `main` then asks which one
//            matters most when two or more are ticked.
//   numbers  one number per field, blank = unknown. `share` shows the fields
//            as shares of their total in the results.
//   rating   1 to 5 per row for St. George and Habesha. `brands` limits it to
//            the brands that apply (only brands on tap get a quality check).
//   pair     two single choices on one screen. A part with `show` appears
//            only when it applies (no brand when there is no complaint).
// `q` can be a function of the answers, so the wording fits the outlet group;
// `title` is the fixed wording used in the results.

export const SG = 'St. George'
export const HB = 'Habesha'
export const BRAND_CODE = { [SG]: 'SG', [HB]: 'HB' }

export const GROUPS = ['Lost Habesha outlet', 'St. George-dominant (never Habesha)', 'Active Habesha outlet']
const LOST = GROUPS[0], SGDOM = GROUPS[1], ACTIVE = GROUPS[2]

export const SECTIONS = [
  {
    id: 'observe', title: 'Outlet observation', short: 'Observation', tab: 'Observe',
    intro: "Look around before you talk to anyone. Count, watch and check a pour.", skipLabel: "Can't observe this outlet now",
  },
  {
    id: 'manager', title: 'Outlet owner / manager', short: 'Owner / manager', tab: 'Manager',
    intro: 'Ask for the owner or the manager who decides which draught brands are sold.', skipLabel: 'Owner and manager not available',
  },
  {
    id: 'staff', title: 'Bar staff', short: 'Bar staff', tab: 'Staff',
    intro: 'Talk to the bartender or the waiter who pours the draught.', skipLabel: 'No bar staff available',
  },
  {
    id: 'consumer', title: 'Draught consumer', short: 'Consumer', tab: 'Consumer',
    intro: 'Pick one customer who is drinking draught right now.', skipLabel: 'No draught drinker to ask',
  },
  {
    id: 'assess', title: 'Your assessment', short: 'Assessment', tab: 'Assess',
    intro: "Your own view after the visit. Don't ask the outlet.", skipLabel: 'Skip my assessment',
  },
]

const onTap = (a, brand) => Array.isArray(a.o_onTap) && a.o_onTap.includes(brand)
const tapBrands = (a) => [SG, HB].filter((b) => onTap(a, b))

export const QUESTIONS = [
  // 1. Outlet observation (the BA looks, counts and checks a pour)
  {
    section: 'observe', key: 'o_count', type: 'numbers', q: 'Count what you see', hint: 'Right now, at this visit.',
    fields: [{ key: 'o_tables', label: 'Tables', unit: 'in the outlet' }, { key: 'o_drinkersNow', label: 'Draught drinkers', unit: 'people right now' }],
  },
  { section: 'observe', key: 'o_onTap', type: 'multi', q: 'Which draught brands are on tap here?', hint: 'Tick all that apply.', options: [SG, HB, 'Other'] },
  {
    section: 'observe', key: 'o_quality', type: 'rating', q: 'Draught quality check', hint: 'Order or watch a pour of each brand on tap. 1 = very poor, 5 = excellent.',
    rows: [['Temp', 'Temperature (cold)'], ['Fresh', 'Freshness'], ['Pour', 'Pour and head'], ['Foam', 'Little foam waste']], prefix: 'o_quality',
    brands: tapBrands, show: (a) => tapBrands(a).length > 0,
  },
  { section: 'observe', key: 'o_age', type: 'single', q: 'Most draught drinkers here are aged', options: ['21 to 30', '30 to 50', 'Over 50'] },
  { section: 'observe', key: 'o_gender', type: 'single', q: 'Draught drinkers here are mostly', options: ['Men', 'Women', 'Mixed'] },
  { section: 'observe', key: 'o_company', type: 'single', q: 'Do they drink draught in groups or alone?', options: ['Mostly in groups', 'Mostly alone', 'Both'] },
  {
    section: 'observe', key: 'o_waiters', type: 'numbers', q: 'Waiters and bar staff working now', share: true,
    fields: [{ key: 'o_waitersMen', label: 'Men', unit: 'people' }, { key: 'o_waitersWomen', label: 'Women', unit: 'people' }],
  },
  {
    section: 'observe', key: 'o_preference', type: 'pair', q: 'Do customers here prefer draught or bottled beer?',
    parts: [
      { key: 'o_prefer', label: 'Most customers drink', options: ['Draught', 'Bottled (RGB)', 'About the same'] },
      { key: 'o_preferWhy', label: 'Why?', options: ['Price & affordability', 'Trend', 'Freshness', 'Other'], show: (a) => !!a.o_prefer && a.o_prefer !== 'About the same' },
    ],
  },
  { section: 'observe', key: 'o_peak', type: 'single', q: 'When do most people drink draught here?', hint: "Ask the staff if you're not sure.", options: ['Morning', 'Afternoon', 'Evening'] },

  // 2. Outlet owner / manager
  { section: 'manager', key: 'm_decider', type: 'single', q: 'Who decides which draught brands are sold here?', options: ['Owner', 'Manager', 'Other'], other: 'Other' },
  {
    section: 'manager', key: 'm_kegs', type: 'numbers', q: 'Weekly draught kegs sold, by brand', hint: "Leave blank if they don't know.",
    fields: [{ key: 'm_kegsStGeorge', label: SG }, { key: 'm_kegsHabesha', label: HB }, { key: 'm_kegsOther', label: 'Other' }], unit: 'kegs a week',
  },
  {
    section: 'manager', key: 'm_prices', type: 'numbers', q: 'Draught prices, in birr', hint: 'What they pay for a keg and charge for a glass. Leave blank if not sold.', digits: 6,
    fields: [
      { key: 'm_priceKegStGeorge', label: `${SG} keg`, unit: 'birr they pay' },
      { key: 'm_priceGlassStGeorge', label: `${SG} glass`, unit: 'birr they charge' },
      { key: 'm_priceKegHabesha', label: `${HB} keg`, unit: 'birr they pay' },
      { key: 'm_priceGlassHabesha', label: `${HB} glass`, unit: 'birr they charge' },
    ],
  },
  {
    section: 'manager', key: 'm_sgDrivers', type: 'multi', show: (a) => a.group !== ACTIVE,
    q: (a) => (a.group === LOST ? 'What keeps St. George here instead of Habesha?' : 'What keeps St. George as the main draught here?'),
    title: 'What keeps St. George here', hint: 'Tick all that apply, then pick the main one.',
    options: ['Consumer demand', 'Better margin', 'Credit terms', 'Equipment (dispenser, cooler)', 'Reliable supply', 'Competitor investment', 'Contract / exclusivity', 'Rep relationship'],
    main: { key: 'm_sgDriverMain', label: 'Which matters most?' },
  },
  {
    section: 'manager', key: 'm_sgSupport', type: 'multi', show: (a) => a.group !== ACTIVE,
    q: 'What has St. George given this outlet?', hint: 'Tick all that apply.',
    options: ['Free kegs', 'Rebates / discounts', 'Dispenser or cooler', 'Branding and furniture', 'Cash sponsorship', 'Staff incentives', 'Nothing'], none: 'Nothing',
  },
  {
    section: 'manager', key: 'm_agreement', type: 'single', q: 'Do you have an agreement that limits other draught brands?',
    options: ['Yes, written', 'Yes, verbal', 'No'],
    follow: { when: ['Yes, written', 'Yes, verbal'], fields: [{ key: 'm_agreementEnds', label: 'When does it end?', placeholder: 'e.g. June 2027' }] },
  },
  {
    section: 'manager', key: 'm_lostWhen', type: 'single', q: 'When did you stop selling Habesha draught?', show: (a) => a.group === LOST,
    options: ['Less than 3 months ago', '3 to 6 months ago', '6 to 12 months ago', 'Over a year ago'],
  },
  {
    section: 'manager', key: 'm_hbStopReason', type: 'single', q: 'What was the real reason Habesha draught stopped?', title: 'Why Habesha draught stopped', hint: 'Tick the main one, then note it in their words.', show: (a) => a.group === LOST,
    options: ['Competitor offer', 'Exclusivity contract', 'Stock-outs / late delivery', 'Quality complaints', 'Low customer demand', 'Equipment problem', 'Poor rep service', 'Payment dispute', 'Ownership change'],
    follow: { when: 'any', fields: [{ key: 'm_hbStopWords', label: 'In their words (optional)', placeholder: 'What exactly happened?' }] },
  },
  {
    section: 'manager', key: 'm_winBack', type: 'multi',
    q: (a) => (a.group === LOST ? 'What would it take to win you back?' : a.group === ACTIVE ? 'What would make you sell more Habesha draught?' : 'What would make you list Habesha draught?'),
    title: 'What would win the business', hint: 'Tick all that apply, then pick the main one.',
    options: ['Better margin', 'Credit', 'Equipment (dispenser, cooler)', 'Free trial kegs', 'Promotions', 'Staff incentive', 'Reliable supply', 'Nothing'], none: 'Nothing',
    main: { key: 'm_winBackMain', label: 'Which matters most?' },
  },
  {
    section: 'manager', key: 'm_potential', type: 'numbers',
    q: (a) => (a.group === ACTIVE ? 'With that, how many Habesha kegs a week could you sell?' : 'With that, how many Habesha kegs a week could you sell here?'),
    title: 'Habesha kegs a week they could sell', hint: 'Their honest estimate, in total.',
    fields: [{ key: 'm_hbPotential', label: HB, unit: 'kegs a week' }],
  },
  { section: 'manager', key: 'm_trial', type: 'single', q: 'Would you accept a Habesha draught trial?', options: ['Yes, now', 'Yes, after contract ends', 'No'], show: (a) => a.group !== ACTIVE },

  // 3. Bar staff
  { section: 'staff', key: 's_defaultServe', type: 'single', q: 'When a customer just says "draught", which brand do you serve?', options: [SG, HB, 'Other'] },
  {
    section: 'staff', key: 's_askByName', type: 'numbers', q: 'Out of 10 draught customers, how many ask by brand name?', max: 10, total: 10,
    fields: [{ key: 's_askStGeorge', label: SG }, { key: 's_askHabesha', label: HB }], unit: 'out of 10',
  },
  { section: 'staff', key: 's_incentive', type: 'multi', q: 'Does any brewery give you benefits or incentives (cash, gifts, bonuses)?', hint: 'Tick all that apply.', options: [SG, HB, 'Other', 'None'], none: 'None' },
  {
    section: 'staff', key: 's_personal', type: 'pair', q: 'Which draught brand do you personally like?',
    parts: [
      { key: 's_personalBrand', label: 'Their favourite', options: [SG, HB, 'Other'] },
      { key: 's_personalWhy', label: 'Why?', options: ['Taste', 'Freshness', 'Brand image', 'Incentives', 'Customers ask for it'], show: (a) => !!a.s_personalBrand },
    ],
  },
  {
    section: 'staff', key: 's_foam', type: 'numbers', q: 'How many glasses per keg are lost to foam?', hint: 'Only brands they pour.',
    fields: [{ key: 's_foamStGeorge', label: SG }, { key: 's_foamHabesha', label: HB }], unit: 'glasses per keg',
  },
  { section: 'staff', key: 's_lineClean', type: 'single', q: 'When were the draught lines last cleaned?', options: ['This week', 'This month', 'Longer ago', "Don't know"] },
  {
    section: 'staff', key: 's_stockouts', type: 'numbers', q: 'Stock-outs in the last 3 months', hint: 'How many times each brand ran out.',
    fields: [{ key: 's_stockoutStGeorge', label: SG }, { key: 's_stockoutHabesha', label: HB }], unit: 'times',
  },
  {
    section: 'staff', key: 's_complaint', type: 'pair', q: 'Most common customer complaint about draught',
    parts: [
      { key: 's_complaintIssue', label: 'What is the complaint?', options: ['Warm', 'Flat', 'Taste', 'Price', 'None'] },
      { key: 's_complaintBrand', label: 'Which brand?', options: [SG, HB], show: (a) => !!a.s_complaintIssue && a.s_complaintIssue !== 'None' },
    ],
  },
  {
    section: 'staff', key: 's_removedReason', type: 'single', q: 'Habesha was sold here before. Why was it removed?', hint: 'Tick one.', show: (a) => a.group === LOST,
    options: ['Competitor offer', 'Low demand', 'Stock-outs', 'Quality', 'Equipment', "Don't know"],
  },
  { section: 'staff', key: 's_recommend', type: 'single', q: 'What would make you recommend Habesha draught?', hint: 'Tick one.', options: ['Staff incentive', 'Training', 'Better quality', 'Customer demand', 'Nothing'] },

  // 4. Draught consumer
  { section: 'consumer', key: 'c_drinking', type: 'single', q: 'Which draught brand are you drinking now?', options: [SG, HB, 'Other'] },
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
  {
    section: 'consumer', key: 'c_qaInvite', type: 'single', q: 'Invite them to the paid consumer Q&A?',
    hint: 'Only keen draught drinkers. It is paid, and being honest is the only requirement. Ask before taking their number.',
    options: ['Yes, they agreed', 'Asked, they said no', 'Not a fit'],
    follow: {
      when: ['Yes, they agreed'],
      fields: [
        { key: 'c_qaName', label: 'Name', placeholder: 'First name is fine', required: true },
        { key: 'c_qaPhone', label: 'Phone', placeholder: '09…', inputMode: 'tel', required: true },
        { key: 'c_qaWhen', label: 'Best day and time', placeholder: 'e.g. Saturday afternoon' },
      ],
    },
  },

  // 5. The BA's own assessment
  {
    section: 'assess', key: 'a_likelihood', type: 'single',
    q: (a) => (a.group === ACTIVE ? 'How likely is this outlet to sell more Habesha draught?' : 'How likely is this outlet to switch to, or add, Habesha draught?'),
    title: 'Chance of conversion', options: ['High', 'Medium', 'Low'],
  },
  {
    section: 'assess', key: 'a_barrier', type: 'single', q: 'What is the biggest thing in the way?',
    options: ['Contract / exclusivity', 'Margin', 'Credit', 'Equipment', 'Consumer demand', 'Supply', 'Relationship with St. George', 'Nothing'],
  },
]

// Wording on screen (some questions change with the outlet group) and in the results
export const qText = (q, a = {}) => (typeof q.q === 'function' ? q.q(a) : q.q)
export const qTitle = (q) => q.title || (typeof q.q === 'function' ? q.q({}) : q.q)

const followKeys = (q) => (q.follow ? q.follow.fields.map((f) => f.key) : [])
const followOn = (q, a) => !!q.follow && !!a[q.key] && (q.follow.when === 'any' || q.follow.when.includes(a[q.key]))
const ratingBrands = (q, a) => (q.brands ? q.brands(a) : [SG, HB])
const ratingKeys = (q, brands = [SG, HB]) => q.rows.flatMap(([r]) => brands.map((b) => `${q.prefix}${r}${BRAND_CODE[b]}`))

// Every column a survey can fill, in sheet order
export const ANSWER_KEYS = QUESTIONS.flatMap((q) => {
  if (q.type === 'numbers') return q.fields.map((f) => f.key)
  if (q.type === 'rating') return ratingKeys(q)
  if (q.type === 'pair') return q.parts.map((p) => p.key)
  const keys = [q.key]
  if (q.other) keys.push(q.key + 'Other')
  if (q.main) keys.push(q.main.key)
  return keys.concat(followKeys(q))
})

export const isShown = (q, a) => !q.show || !!q.show(a)
export const partShown = (p, a) => !p.show || !!p.show(a)
export { ratingBrands, followOn }

// Whether a question has what it needs to move on
export function answered(q, a) {
  const has = (k) => a[k] != null && String(a[k]).trim() !== ''
  switch (q.type) {
    case 'single':
      if (!has(q.key)) return false
      if (q.other && a[q.key] === q.other && !has(q.key + 'Other')) return false
      if (followOn(q, a) && q.follow.fields.some((f) => f.required && !has(f.key))) return false
      return true
    case 'multi': {
      const list = Array.isArray(a[q.key]) ? a[q.key] : []
      if (!list.length) return false
      if (q.main && list.filter((x) => x !== q.none).length >= 2 && !list.includes(a[q.main.key])) return false
      return true
    }
    case 'numbers':
      if (q.total) {
        const sum = q.fields.reduce((s, f) => s + (Number(a[f.key]) || 0), 0)
        if (sum > q.total) return false
      }
      return true
    case 'rating':
      return ratingKeys(q, ratingBrands(q, a)).every(has)
    case 'pair':
      return q.parts.every((p) => !partShown(p, a) || has(p.key))
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
    followKeys(q).forEach((k) => delete out[k])
    if (q.main) delete out[q.main.key]
  }
  return out
}

// Answers ready for the sheet: lists joined, numbers as numbers, blanks left out
export function answersForSheet(a, skipped) {
  const out = {}
  const put = (k) => { if (a[k] != null && String(a[k]).trim() !== '') out[k] = String(a[k]).trim() }
  for (const q of QUESTIONS) {
    if (skipped.includes(q.section) || !isShown(q, a)) continue
    if (q.type === 'multi') {
      const list = Array.isArray(a[q.key]) ? a[q.key] : []
      if (list.length) out[q.key] = list.join(', ')
      if (q.main) {
        const real = list.filter((x) => x !== q.none)
        if (real.length === 1) out[q.main.key] = real[0]
        else if (real.includes(a[q.main.key])) out[q.main.key] = a[q.main.key]
      }
    } else if (q.type === 'numbers' || q.type === 'rating') {
      const keys = q.type === 'numbers' ? q.fields.map((f) => f.key) : ratingKeys(q, ratingBrands(q, a))
      keys.forEach((k) => { if (a[k] !== '' && a[k] != null) out[k] = Number(a[k]) })
    } else if (q.type === 'pair') {
      q.parts.forEach((p) => partShown(p, a) && put(p.key))
    } else {
      put(q.key)
      if (q.other && a[q.key] === q.other) put(q.key + 'Other')
      if (followOn(q, a)) followKeys(q).forEach(put)
    }
  }
  return out
}
