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
//            as shares of their total in the results. `lte` keeps one field
//            at or below another (named orders <= orders watched).
//   rating   1 to 5 per row for St. George and Habesha. `brands` limits it to
//            the brands that apply (only brands on tap get a quality check).
//   pair     two single choices on one screen. A part with `show` appears
//            only when it applies.
//   text     an optional note in their exact words (quotes for the debrief).
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
    intro: 'Watch before you talk. Sit through at least 2 rounds of orders and catch the habit. Work in pairs: one watches, one talks.',
    skipLabel: "Can't observe this outlet now",
  },
  {
    id: 'manager', title: 'Outlet owner / manager', short: 'Owner / manager', tab: 'Manager',
    intro: 'Ask for the owner or the manager who decides which draught brands are sold. Talk off-peak.',
    skipLabel: 'Owner and manager not available',
  },
  {
    id: 'staff', title: 'Bar staff', short: 'Bar staff', tab: 'Staff',
    intro: 'Talk to a waiter or bartender off-peak, about 10 minutes. They are the real gatekeeper. Never say "Habesha" first.',
    skipLabel: 'No bar staff available',
  },
  {
    id: 'consumer', title: 'Draught consumer', short: 'Consumer', tab: 'Consumer',
    intro: 'Chat with one drinker after they have had a drink. Ask about tonight, not what they would do. Never say "Habesha" first.',
    skipLabel: 'No draught drinker to ask',
  },
  {
    id: 'assess', title: 'Your assessment', short: 'Assessment', tab: 'Assess',
    intro: "Your own view after the visit. Don't ask the outlet.", skipLabel: 'Skip my assessment',
  },
]

const onTap = (a, brand) => Array.isArray(a.o_onTap) && a.o_onTap.includes(brand)
const tapBrands = (a) => [SG, HB].filter((b) => onTap(a, b))
const notActive = (a) => a.group !== ACTIVE

export const QUESTIONS = [
  // 1. Outlet observation: watch the order habit before talking to anyone
  {
    section: 'observe', key: 'o_orders', type: 'numbers', q: 'Watch the orders', hint: 'Over at least 2 rounds. Count every draught order you see.',
    fields: [
      { key: 'o_drinkersNow', label: 'Draught drinkers', unit: 'people right now' },
      { key: 'o_ordersWatched', label: 'Orders watched', unit: 'draught orders' },
      { key: 'o_ordersNamed', label: 'Named a brand', unit: 'the rest said "jambo" or "single"' },
    ],
    lte: [['o_ordersNamed', 'o_ordersWatched']],
  },
  {
    section: 'observe', key: 'o_noBrand', type: 'pair', q: 'When someone orders without a brand',
    parts: [
      { key: 'o_waiterAction', label: 'The waiter…', options: ['Brought St. George without asking', 'Brought Habesha without asking', 'Asked "which one?"', 'Saw no such order'] },
      { key: 'o_whoDecides', label: 'Who really decides the brand?', options: ['The drinker', 'The waiter', 'The owner'] },
    ],
  },
  { section: 'observe', key: 'o_onTap', type: 'multi', q: 'Which draught brands are on tap here?', hint: 'Tick all that apply.', options: [SG, HB, 'Other'] },
  {
    section: 'observe', key: 'o_visible', type: 'multi', q: 'What brand do you see at the table and bar?', hint: 'Glassware, tap handles, signage, fridges. Tick all.',
    options: ['St. George glassware', 'St. George tap, signs or fridge', 'Habesha glassware', 'Habesha tap, signs or fridge', 'No branding at all'], none: 'No branding at all',
  },
  {
    section: 'observe', key: 'o_quality', type: 'rating', q: 'Draught quality check', hint: 'Order or watch a pour of each brand on tap. 1 = very poor, 5 = excellent.',
    rows: [['Temp', 'Temperature (cold)'], ['Fresh', 'Freshness of the keg'], ['Pour', 'Pour and head'], ['Foam', 'Little foam waste'], ['Glass', 'Clean glass']], prefix: 'o_quality',
    brands: tapBrands, show: (a) => tapBrands(a).length > 0,
  },
  {
    section: 'observe', key: 'o_push', type: 'multi', q: 'Anyone pushing a brand?', hint: 'Tick all you see.',
    options: ['Waiter pushed a brand', 'Brand rep in the outlet', 'Promotion or giveaway running', 'None seen'], none: 'None seen',
  },
  {
    section: 'observe', key: 'o_drinkers', type: 'pair', q: 'Who drinks draught here',
    parts: [
      { key: 'o_age', label: 'Most are aged', options: ['21 to 30', '30 to 50', 'Over 50'] },
      { key: 'o_gender', label: 'Mostly', options: ['Men', 'Women', 'Mixed'] },
    ],
  },
  {
    section: 'observe', key: 'o_how', type: 'pair', q: 'How they drink',
    parts: [
      { key: 'o_company', label: 'In groups or alone?', options: ['Mostly in groups', 'Mostly alone', 'Both'] },
      { key: 'o_rush', label: 'How busy is it?', options: ['Quiet', 'Busy', 'Rush, slow service'] },
    ],
  },
  {
    section: 'observe', key: 'o_waiters', type: 'numbers', q: 'Waiters and bar staff working now', share: true,
    fields: [{ key: 'o_waitersMen', label: 'Men', unit: 'people' }, { key: 'o_waitersWomen', label: 'Women', unit: 'people' }],
  },
  {
    section: 'observe', key: 'o_preference', type: 'pair', q: 'Draught or bottled beer?',
    parts: [
      { key: 'o_prefer', label: 'Most customers drink', options: ['Draught', 'Bottled (RGB)', 'About the same'] },
      { key: 'o_preferWhy', label: 'Why?', options: ['Price & affordability', 'Trend', 'Freshness', 'Other'], show: (a) => !!a.o_prefer && a.o_prefer !== 'About the same' },
    ],
  },
  { section: 'observe', key: 'o_peak', type: 'single', q: 'When do most people drink draught here?', hint: "Ask the staff if you're not sure.", options: ['Morning', 'Afternoon', 'Evening'] },
  { section: 'observe', key: 'o_surprise', type: 'text', q: 'Anything that surprised you?', hint: 'Exact words and behaviour, not opinions. Optional.', placeholder: 'He said "two jambo" and didn\'t look up' },

  // 2. Outlet owner / manager
  { section: 'manager', key: 'm_decider', type: 'single', q: 'Who decided which draught brands are on tap?', options: ['Owner', 'Manager', 'Other'], other: 'Other' },
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
    section: 'manager', key: 'm_moneyFast', type: 'pair', q: 'Margin and speed',
    parts: [
      { key: 'm_mostMoney', label: 'Which makes you the most money per keg?', options: [SG, HB, 'Other', 'About the same'] },
      { key: 'm_sellsFastest', label: 'Which sells fastest?', options: [SG, HB, 'Other', 'About the same'] },
    ],
  },
  {
    section: 'manager', key: 'm_sgDrivers', type: 'multi', show: notActive,
    q: (a) => (a.group === LOST ? 'What keeps St. George here instead of Habesha?' : 'What keeps St. George as the main draught here?'),
    title: 'What keeps St. George here', hint: 'Tick all that apply, then pick the main one.',
    options: ['Consumer demand', 'Better margin', 'Credit terms', 'Equipment (dispenser, cooler)', 'Reliable supply', 'Competitor investment', 'Contract / exclusivity', 'Rep relationship'],
    main: { key: 'm_sgDriverMain', label: 'Which matters most?' },
  },
  {
    section: 'manager', key: 'm_sgSupport', type: 'multi', show: notActive,
    q: 'What do you get from the St. George distributor?', hint: 'Tick all that apply.',
    options: ['Credit', 'Free kegs', 'Rebates / discounts', 'Dispenser, cooler or fridge', 'Branding and furniture', 'Regular rep visits', 'Cash sponsorship', 'Staff incentives', 'Nothing'], none: 'Nothing',
  },
  {
    section: 'manager', key: 'm_problems', type: 'pair', q: 'Problems with any brand?',
    parts: [
      { key: 'm_problemBrand', label: 'Which brand gives you the most problems?', options: [SG, HB, 'Other', 'None'] },
      { key: 'm_problem', label: 'What kind?', options: ['Delivery / stock-outs', 'Quality', 'Keg returns', 'Payment terms', 'Rep service'], show: (a) => !!a.m_problemBrand && a.m_problemBrand !== 'None' },
    ],
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
    q: (a) => (a.group === LOST ? 'What would it take to win you back?' : a.group === ACTIVE ? 'What would make you sell more Habesha draught?' : 'What would make you switch or add a tap?'),
    title: 'What would win the business', hint: 'Tick all that apply, then pick the main one.',
    options: ['Better margin', 'Credit', 'Equipment (dispenser, cooler)', 'Free trial kegs', 'Promotions', 'Staff incentive', 'Reliable supply', 'Nothing'], none: 'Nothing',
    main: { key: 'm_winBackMain', label: 'Which matters most?' },
  },
  {
    section: 'manager', key: 'm_stopper', type: 'single', q: 'And what would stop you?', title: 'What would stop them switching', show: notActive,
    options: ['Contract / exclusivity', "Customers wouldn't accept it", 'Margin', 'No space for another tap', 'Relationship with St. George', 'Nothing'],
  },
  {
    section: 'manager', key: 'm_potential', type: 'numbers',
    q: (a) => (a.group === ACTIVE ? 'With that, how many Habesha kegs a week could you sell?' : 'With that, how many Habesha kegs a week could you sell here?'),
    title: 'Habesha kegs a week they could sell', hint: 'Their honest estimate, in total.',
    fields: [{ key: 'm_hbPotential', label: HB, unit: 'kegs a week' }],
  },
  { section: 'manager', key: 'm_trial', type: 'single', q: 'Would you accept a Habesha draught trial?', options: ['Yes, now', 'Yes, after contract ends', 'No'], show: notActive },

  // 3. Bar staff: the gatekeeper
  {
    section: 'staff', key: 's_jambo', type: 'pair', q: 'A customer says only "jambo". What do you bring?',
    parts: [
      { key: 's_defaultServe', label: 'They bring', options: [SG, HB, 'Other'] },
      { key: 's_defaultWhy', label: 'Why that one?', options: ['Always on tap', "Owner's instruction", 'Most customers want it', 'Brewery incentive', 'Habit'], show: (a) => !!a.s_defaultServe },
    ],
  },
  { section: 'staff', key: 's_wrongBrand', type: 'single', q: 'What happens when you bring the wrong one?', options: ['Customer complains', "Customer doesn't notice", 'Customer accepts it'] },
  {
    section: 'staff', key: 's_easier', type: 'pair', q: 'Which beer makes your day easier?',
    parts: [
      { key: 's_easierBrand', label: 'Easier to work with', options: [SG, HB, 'Same'] },
      { key: 's_easierWhy', label: 'Why?', options: ['Less foam', 'Fewer keg changes', 'Fewer complaints', 'Faster pour'], show: (a) => !!a.s_easierBrand && a.s_easierBrand !== 'Same' },
    ],
  },
  {
    section: 'staff', key: 's_incentive', type: 'multi', q: 'What do you get from pushing one brand over another?', hint: 'Tick all that apply.',
    options: ['Cash or gifts from St. George', 'Cash or gifts from Habesha', 'Tips from customers', 'Owner tells us to', 'Rep relationship', 'Nothing'], none: 'Nothing',
  },
  {
    section: 'staff', key: 's_personal', type: 'pair', q: 'Which draught do you personally like?',
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
    section: 'staff', key: 's_removedReason', type: 'single', q: 'Habesha was sold here before. Why was it removed?', hint: 'Tick one.', show: (a) => a.group === LOST,
    options: ['Competitor offer', 'Low demand', 'Stock-outs', 'Quality', 'Equipment', "Don't know"],
  },
  {
    section: 'staff', key: 's_reason', type: 'single', q: 'If someone gave you a reason to bring a different beer, what would it have to be?', title: 'What would make them bring a different beer',
    options: ['Cash or gifts', 'Training', 'Better quality', 'Customers asking for it', "Owner's instruction", 'Nothing would'],
  },
  { section: 'staff', key: 's_quote', type: 'text', q: 'Best thing they said', hint: 'Their exact words. Optional.', placeholder: 'e.g. "Nobody asks, I just bring what is on the tap"' },

  // 4. Draught consumer: tonight's behaviour, no hypotheticals
  { section: 'consumer', key: 'c_drinking', type: 'single', q: 'What beer is this right now?', hint: 'Ask before anything else. Note it if they don\'t know.', options: [SG, HB, 'Other', "Doesn't know"] },
  {
    section: 'consumer', key: 'c_ordered', type: 'single', q: 'What did they say when they ordered?',
    options: ['Named a brand', 'Just "jambo" or "single"', 'A friend ordered for the table'],
    follow: { when: 'any', fields: [{ key: 'c_orderWords', label: 'Their exact words (optional)', placeholder: 'e.g. "ሁለት ጃምቦ"' }] },
  },
  {
    section: 'consumer', key: 'c_size', type: 'pair', q: 'Single or jambo tonight?',
    parts: [
      { key: 'c_sizePick', label: 'Tonight', options: ['Single', 'Jambo'] },
      { key: 'c_sizeWhy', label: 'Why that size?', options: ['Money', 'Pace', 'Status', 'Buying rounds', 'Habit'], show: (a) => !!a.c_sizePick },
    ],
  },
  { section: 'consumer', key: 'c_swapped', type: 'single', q: 'Has a waiter ever brought a different beer? What did you do?', options: ['Sent it back or complained', 'Drank it anyway', 'Never happened or never noticed'] },
  { section: 'consumer', key: 'c_blame', type: 'single', q: 'If the beer was bad, who would you blame?', options: ['The bar', 'The brand', 'Both'] },
  {
    section: 'consumer', key: 'c_goodDraught', type: 'multi', q: 'What does a good draught look like to you?', hint: 'Let them answer first, then tick what they said.',
    options: ['Cold', 'Fresh taste', 'Good head of foam', 'Clean glass', 'Served fast', 'The brand'],
  },
  { section: 'consumer', key: 'c_groupDecides', type: 'single', q: 'Who in your group decides where to go and what is drunk?', options: ['Me', 'Someone else', 'We decide together', 'Came alone'] },
  { section: 'consumer', key: 'c_everHabesha', type: 'single', q: 'Have you ever drunk Habesha draught?', hint: 'Only now, at the end, name Habesha.', options: ['Yes, regularly', 'Yes, in the past', 'Tried once', 'Never'] },
  {
    section: 'consumer', key: 'c_whyNot', type: 'single', q: 'Why did you stop, or never drink it?', hint: 'Tick one.', show: (a) => a.c_everHabesha && a.c_everHabesha !== 'Yes, regularly',
    options: ['Not available', 'Taste', 'Inconsistent quality', 'Brand image', 'Never offered'],
  },
  { section: 'consumer', key: 'c_quote', type: 'text', q: 'Best thing they said', hint: 'Their exact words. Optional.', placeholder: 'e.g. "It\'s all the same, I don\'t care"' },
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
      if (q.lte && q.lte.some(([x, y]) => has(x) && has(y) && Number(a[x]) > Number(a[y]))) return false
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
    } else if (q.type === 'text') {
      put(q.key)
    } else {
      put(q.key)
      if (q.other && a[q.key] === q.other) put(q.key + 'Other')
      if (followOn(q, a)) followKeys(q).forEach(put)
    }
  }
  return out
}
