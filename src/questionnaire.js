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
export const BRAND_CODE = { [SG]: 'SG', [HB]: 'HB', '': '' }

export const GROUPS = ['Lost Habesha outlet', 'St. George-dominant (never Habesha)', 'Habesha draught outlet']
const LOST = GROUPS[0], SGDOM = GROUPS[1], ACTIVE = GROUPS[2] // ACTIVE = Habesha draught outlet

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
// Is this brand sold here? From the taps ticked in Observation; if Observation
// was skipped, Habesha is only sold in a Habesha draught outlet.
const tapKnown = (a) => Array.isArray(a.o_onTap) && a.o_onTap.length > 0
const sells = (a, brand) => (tapKnown(a) ? a.o_onTap.includes(brand) : brand === HB ? a.group === ACTIVE : true)
const brandsHere = (a) => [SG, HB, 'Other'].filter((b) => sells(a, b))
// Brands the bar staff can compare: what is sold now, plus Habesha in a lost outlet (they poured it before)
const staffBrands = (a) => { const b = brandsHere(a).filter((x) => x !== 'Other'); return a.group === LOST && !b.includes(HB) ? [...b, HB] : b }
// Keeps an answer only if the brand it names is sold here ("Other" and "another brand" need another brand on tap).
// Choice filters work on whatever answers the admin has written, so renamed answers still follow the taps.
export const brandOk = (a) => (x) =>
  x.includes(SG) ? sells(a, SG) : x.includes(HB) ? sells(a, HB) : x === 'Other' || /another brand/i.test(x) ? sells(a, 'Other') : true
const byBrand = (a, o) => o.filter(brandOk(a))

const BASE = [
  // 1. Outlet observation: watch the order habit before talking to anyone
  { section: 'observe', key: 'o_onTap', type: 'multi', q: 'Which draught brands are on tap here?', hint: 'Tick all that apply.', options: [SG, HB, 'Other'], choices: (a, o) => (a.group === ACTIVE ? o : o.filter((x) => !x.includes(HB))) },
  {
    section: 'observe', key: 'o_orders', type: 'numbers', q: 'Watch the orders', hint: 'Over at least 2 rounds. Count every draught order you see.',
    fields: [
      { key: 'o_drinkersNow', label: 'Draught consumers', unit: 'people right now' },
      { key: 'o_ordersWatched', label: 'Orders observed', unit: 'draught orders' },
      { key: 'o_ordersNamed', label: 'Named a brand', unit: 'the rest said "Jambo" or "Single"' },
    ],
    lte: [['o_ordersNamed', 'o_ordersWatched']],
  },
  {
    section: 'observe', key: 'o_noBrand', type: 'pair', q: 'When someone orders without a brand',
    parts: [
      {
        key: 'o_waiterAction', label: 'The waiter…',
        options: ['Brought St. George without asking', 'Brought Habesha without asking', 'Brought another brand without asking', 'Asked "which one?"', 'Saw no such order'],
        choices: byBrand,
      },
      { key: 'o_whoDecides', label: 'Who really decides the brand?', options: ['The consumer', 'The waiter', 'The owner or manager', 'The barman'] },
    ],
  },
  {
    section: 'observe', key: 'o_visible', type: 'multi', q: 'What brand do you see at the table and bar?', hint: 'Look at the glasses on the tables and the bar. Tick all.',
    options: ['St. George glass', 'Habesha glass', 'No branding at all'], none: 'No branding at all',
    choices: (a, o) => (a.group === SGDOM ? o.filter((x) => !x.includes(HB)) : o),
  },
  {
    section: 'observe', key: 'o_quality', type: 'rating', q: 'Draught quality check', hint: 'Order or watch a pour of each brand on tap. 1 = very poor, 5 = excellent.',
    rows: [['Temp', 'Temperature (cold)'], ['Fresh', 'Freshness of the keg'], ['Pour', 'Pour and head'], ['Foam', 'Little foam waste'], ['Glass', 'Clean glass']], prefix: 'o_quality',
    brands: tapBrands, show: (a) => tapBrands(a).length > 0,
  },
  {
    section: 'observe', key: 'o_push', type: 'multi', q: 'Anyone pushing a brand?', hint: 'Tick all you see.',
    options: ['Waiter pushed a brand', 'Promotion or giveaway running', 'None seen'], none: 'None seen',
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
  { section: 'observe', key: 'o_prefer', type: 'single', q: 'Draught or bottled beer?', hint: 'What most customers drink.', options: ['Draught', 'Bottled (RGB)', 'About the same'] },
  { section: 'observe', key: 'o_peak', type: 'single', q: 'When do most people drink draught here?', hint: "Ask the staff if you're not sure.", options: ['Morning', 'Afternoon', 'Evening'] },
  { section: 'observe', key: 'o_surprise', type: 'text', q: 'Anything that surprised you?', hint: 'Exact words and behaviour, not opinions. Optional.', placeholder: 'He said "two jambo" and didn\'t look up' },

  // 2. Outlet owner / manager
  { section: 'manager', key: 'm_decider', type: 'single', q: 'Who decided which draught brands are sold at the bar?', options: ['Owner', 'Manager', 'Other'], other: 'Other', otherHint: 'Who?' },
  {
    section: 'manager', key: 'm_kegs', type: 'numbers', q: 'Weekly draught kegs sold, by brand', hint: "Leave blank if they don't know.",
    // A brand not sold here is 0 kegs, so keg share still counts the outlet
    fields: [
      { key: 'm_kegsStGeorge', label: SG, show: (a) => sells(a, SG), zeroWhenHidden: true },
      { key: 'm_kegsHabesha', label: HB, show: (a) => sells(a, HB), zeroWhenHidden: true },
      { key: 'm_kegsOther', label: 'Other', show: (a) => sells(a, 'Other'), zeroWhenHidden: true },
    ], unit: 'kegs a week',
  },
  {
    section: 'manager', key: 'm_prices', type: 'numbers', q: 'Draught prices, in birr', hint: 'What they charge for a single and a jambo. Leave blank if not sold.', digits: 5,
    fields: [
      { key: 'm_priceSingleStGeorge', label: `${SG} single`, unit: 'birr they charge', show: (a) => sells(a, SG) },
      { key: 'm_priceJamboStGeorge', label: `${SG} jambo`, unit: 'birr they charge', show: (a) => sells(a, SG) },
      { key: 'm_priceSingleHabesha', label: `${HB} single`, unit: 'birr they charge', show: (a) => sells(a, HB) },
      { key: 'm_priceJamboHabesha', label: `${HB} jambo`, unit: 'birr they charge', show: (a) => sells(a, HB) },
    ],
  },
  {
    section: 'manager', key: 'm_fastProfit', type: 'single', q: 'Which sells fastest and is most profitable?', options: [SG, HB, 'Other', 'About the same'],
    choices: byBrand, show: (a) => brandsHere(a).length > 1,
  },
  {
    section: 'manager', key: 'm_sgDrivers', type: 'multi', show: (a) => notActive(a) && sells(a, SG),
    q: (a) => (a.group === LOST ? 'What keeps St. George here instead of Habesha?' : 'What keeps St. George as the main draught here?'),
    title: 'What keeps St. George here', hint: 'Tick all that apply, then pick the main one.',
    options: ['Consumer demand', 'Better margin', 'Service quality', 'Draught machine performance (dispenser, cooler)', 'Trade marketing investments', 'Exclusivity deal', 'Sales team relationship'],
    main: { key: 'm_sgDriverMain', label: 'Which matters most?' },
  },
  {
    section: 'manager', key: 'm_sgSupport', type: 'multi', show: (a) => notActive(a) && sells(a, SG),
    q: 'What do you get from the St. George distributor?', hint: 'Tick all that apply.',
    options: ['Credit', 'Free kegs', 'Rebates / discounts', 'Dispenser, cooler or fridge', 'Branding and furniture', 'Regular rep visits', 'Cash sponsorship', 'Staff incentives', 'Nothing'], none: 'Nothing',
  },
  {
    section: 'manager', key: 'm_problems', type: 'pair', q: 'Problems with any brand?',
    parts: [
      { key: 'm_problemBrand', label: 'Which brand gives you the most problems?', options: [SG, HB, 'Other', 'None'], choices: byBrand },
      { key: 'm_problem', label: 'What kind?', options: ['Delivery / stock-outs', 'Quality', 'Keg returns', 'Sales team service'], show: (a) => !!a.m_problemBrand && a.m_problemBrand !== 'None' },
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
      { key: 's_defaultServe', label: 'They bring', options: [SG, HB, 'Other'], choices: byBrand },
      { key: 's_defaultWhy', label: 'Why that one?', options: ['Always on tap', "Owner's instruction", 'Most customers want it', 'Brewery incentive', 'Habit'], show: (a) => !!a.s_defaultServe },
    ],
  },
  { section: 'staff', key: 's_wrongBrand', type: 'single', q: 'What happens when you bring the wrong one?', show: (a) => brandsHere(a).length > 1, options: ['Customer complains', "Customer doesn't notice", 'Customer accepts it'] },
  {
    section: 'staff', key: 's_easier', type: 'pair', q: 'Which beer makes your day easier?', show: (a) => staffBrands(a).length > 1,
    parts: [
      { key: 's_easierBrand', label: 'Easier to work with', options: [SG, HB, 'Same'], choices: (a, o) => o.filter((x) => (x.includes(SG) ? staffBrands(a).includes(SG) : x.includes(HB) ? staffBrands(a).includes(HB) : true)) },
      { key: 's_easierWhy', label: 'Why?', options: ['Less foam', 'Fewer keg changes', 'Fewer complaints', 'Faster pour'], show: (a) => !!a.s_easierBrand && a.s_easierBrand !== 'Same' },
    ],
  },
  {
    section: 'staff', key: 's_incentive', type: 'multi', q: 'What do you get from pushing one brand over another?', hint: 'Tick all that apply.',
    options: ['Cash or gifts from St. George', 'Cash or gifts from Habesha', 'Tips from customers', 'Owner tells us to', 'Rep relationship', 'Nothing'], none: 'Nothing',
    choices: byBrand,
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
    fields: [{ key: 's_foamStGeorge', label: SG, show: (a) => sells(a, SG) }, { key: 's_foamHabesha', label: HB, show: (a) => sells(a, HB) }], unit: 'glasses per keg',
    show: (a) => sells(a, SG) || sells(a, HB),
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
  { section: 'consumer', key: 'c_drinking', type: 'single', q: 'What beer is this right now?', hint: 'Ask before anything else. Note it if they don\'t know.', options: [SG, HB, 'Other', "Doesn't know"], choices: byBrand },
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
  { section: 'consumer', key: 'c_everHabesha', type: 'single', q: 'Have you ever drunk Habesha draught?', show: (a) => a.c_drinking !== HB, hint: 'Only now, at the end, name Habesha.', options: ['Yes, regularly', 'Yes, in the past', 'Tried once', 'Never'] },
  {
    section: 'consumer', key: 'c_whyNot', type: 'single', q: 'Why did you stop, or never drink it?', hint: 'Tick one.', show: (a) => a.c_drinking !== HB && a.c_everHabesha && a.c_everHabesha !== 'Yes, regularly',
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

// Every column a question fills, in sheet order
export const keysOf = (list) => list.flatMap((q) => {
  if (q.type === 'numbers') return q.fields.map((f) => f.key)
  if (q.type === 'rating') return ratingKeys(q, q.allBrands || [SG, HB])
  if (q.type === 'pair') return q.parts.map((p) => p.key)
  const keys = [q.key]
  if (q.other) keys.push(q.key + 'Other')
  if (q.main) keys.push(q.main.key)
  return keys.concat(followKeys(q))
})
// The built-in columns. Survey.gs has the same list; questions the admin adds get their own columns after these.
export const ANSWER_KEYS = keysOf(BASE)

/* ---------- questions the admin changes from the app ----------
   Rows come from the Questions tab of the sheet (see src/questions.js):
   { key, section, spec, active }. `spec` describes the question in plain data:

     type        single | multi | numbers | rating | pair | text   (added questions)
     q           wording;  qByGroup { lost, sg, hb } for wording per outlet group
     title       short name in the results;  hint  note for the BA
     options     answers (single, multi);  brandFilter  drop brands not sold here
     other       the answer that opens a text box;  otherHint  its placeholder
     follow      { when: 'any' | [answers], fields: [{ key, label, required, tel }] }
     none        the answer that clears the others;  main { key, label }  "which matters most"
     fields      [{ key, label, unit }], unit, max, digits   (numbers)
     rows        [{ id, label }], perBrand   (rating, 1 to 5)
     parts       [{ key, label, options }]   (pair)
     placeholder (text);  required
     groups      [lost, sg, hb] outlet groups that get it
     when        { key, values } shown only when that answer is one of the values

   For a built-in question the spec holds only what the admin changed; the
   built-in rules (which brands are on tap, which group) still apply on top.
   Rows keyed _order_<section> hold the question order of that section. */
export const GROUP_CODE = { lost: GROUPS[0], sg: GROUPS[1], hb: GROUPS[2] }
export const groupCode = (g) => Object.keys(GROUP_CODE).find((c) => GROUP_CODE[c] === g)
export const BASE_QUESTIONS = BASE
export let QUESTIONS = BASE
export let CONFIG = []

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])

// Rows saved by the first version of the editor (type, q, hint, options, unit, groups, required)
function legacySpec(r) {
  if (r.spec && typeof r.spec === 'object') return r.spec
  if (!/^x_/.test(r.key)) return { ...(r.q ? { q: r.q } : {}), ...(r.hint ? { hint: r.hint } : {}) }
  const base = { q: r.q, hint: r.hint, groups: r.groups, required: !!r.required }
  if (r.type === 'number') return { ...base, type: 'numbers', fields: [{ key: r.key, label: r.unit || 'Number' }] }
  if (r.type === 'single' || r.type === 'multi') return { ...base, type: r.type, options: r.options }
  return { ...base, type: 'text' }
}

// One question from its built-in form (or nothing, for an added one) and the admin's spec
export function buildQuestion(base, spec, key, section) {
  const sp = spec || {}
  const has = (k) => Object.prototype.hasOwnProperty.call(sp, k)
  const q = base ? { ...base } : { key, section, type: sp.type || 'single', custom: true }
  if (base && Object.keys(sp).length) q.edited = true

  const byGroup = sp.qByGroup && Object.values(sp.qByGroup).some(str) ? sp.qByGroup : null
  if (byGroup) {
    const fallback = str(sp.q) || (base ? base.q : '')
    q.q = (a) => str(byGroup[groupCode(a.group)]) || (typeof fallback === 'function' ? fallback(a) : fallback)
  } else if (str(sp.q)) q.q = str(sp.q)
  if (str(sp.title)) q.title = str(sp.title)
  else if (q.custom) q.title = str(sp.q) || (byGroup && Object.values(byGroup).map(str).find(Boolean)) || 'Question'
  if (has('hint')) q.hint = str(sp.hint) || undefined
  if (has('required')) q.required = !!sp.required
  if (q.custom && !has('required')) q.required = q.type === 'single' || q.type === 'multi' || q.type === 'pair' || q.type === 'rating'

  if (has('options')) q.options = list(sp.options)
  if (has('other')) q.other = str(sp.other) || undefined
  if (has('otherHint')) q.otherHint = str(sp.otherHint) || undefined
  if (has('none')) q.none = str(sp.none) || undefined
  if (has('main')) q.main = sp.main && str(sp.main.key) ? { key: str(sp.main.key), label: str(sp.main.label) || 'Which matters most?' } : undefined
  if (has('follow')) {
    const old = Object.fromEntries(((base && base.follow && base.follow.fields) || []).map((f) => [f.key, f]))
    const fields = ((sp.follow && sp.follow.fields) || []).filter((f) => str(f.key))
    q.follow = fields.length
      ? {
          when: sp.follow.when === 'any' ? 'any' : list(sp.follow.when),
          fields: fields.map((f) => ({ ...(old[f.key] || {}), key: f.key, label: str(f.label) || 'Details', required: !!f.required, inputMode: f.tel ? 'tel' : undefined, placeholder: f.tel ? '09…' : (old[f.key] || {}).placeholder })),
        }
      : undefined
  }
  if (has('fields')) {
    const old = Object.fromEntries(((base && base.fields) || []).map((f) => [f.key, f]))
    q.fields = (sp.fields || []).filter((f) => str(f.key)).map((f) => ({ ...(old[f.key] || {}), key: f.key, label: str(f.label) || 'Number', unit: str(f.unit) || undefined }))
  }
  if (has('unit')) q.unit = str(sp.unit) || undefined
  if (has('max')) q.max = sp.max === '' || sp.max == null ? undefined : Number(sp.max)
  if (has('digits')) q.digits = Number(sp.digits) || undefined
  if (has('rows')) q.rows = (sp.rows || []).filter((r) => str(r.id)).map((r) => [r.id, str(r.label) || 'Row'])
  if (has('parts')) {
    const old = Object.fromEntries(((base && base.parts) || []).map((p) => [p.key, p]))
    q.parts = (sp.parts || []).filter((p) => str(p.key)).map((p) => ({ ...(old[p.key] || {}), key: p.key, label: str(p.label), options: list(p.options) }))
  }
  if (has('placeholder')) q.placeholder = str(sp.placeholder) || undefined

  if (q.custom) {
    if (q.type === 'numbers' && !q.fields) q.fields = []
    if (q.type === 'rating') {
      q.prefix = q.key + '_'
      q.rows = q.rows || []
      q.brands = sp.perBrand ? tapBrands : () => ['']
      if (!sp.perBrand) q.allBrands = ['']
    }
    if (q.type === 'pair') q.parts = q.parts || []
    if (q.type === 'text' && !q.placeholder) q.placeholder = 'Their exact words'
    if (sp.brandFilter) {
      if (q.type === 'pair') q.parts = q.parts.map((p) => ({ ...p, choices: byBrand }))
      else q.choices = byBrand
    }
  }

  // Who gets it: the built-in rule, then the admin's outlet groups and condition
  const tests = []
  if (base && base.show) tests.push(base.show)
  const gs = list(sp.groups).map((c) => GROUP_CODE[c]).filter(Boolean)
  if (gs.length && gs.length < GROUPS.length) tests.push((a) => gs.includes(a.group))
  if (sp.when && str(sp.when.key) && list(sp.when.values).length) {
    const k = sp.when.key, vals = list(sp.when.values)
    tests.push((a) => (Array.isArray(a[k]) ? a[k].some((x) => vals.includes(x)) : vals.includes(a[k])))
  }
  if (q.custom && q.type === 'rating' && sp.perBrand) tests.push((a) => tapBrands(a).length > 0)
  q.show = tests.length ? (a) => tests.every((t) => t(a)) : undefined
  return q
}

// Every question with the admin's changes, in the admin's order; `off` marks questions turned off
export function mergeQuestions(rows = []) {
  const byKey = {}
  const order = {}
  rows.forEach((r) => {
    if (/^_order_/.test(r.key)) order[r.key.slice(7)] = list((r.spec || {}).order)
    else byKey[r.key] = r
  })
  const all = BASE.map((b) => {
    const r = byKey[b.key]
    if (!r) return b
    const q = buildQuestion(b, legacySpec(r))
    if (r.active === false) q.off = true
    return q
  })
  // Added questions: after the question named in `after` (first editor), else at the end of their section
  rows.filter((r) => /^x_/.test(r.key) && SECTIONS.some((x) => x.id === r.section)).forEach((r) => {
    const q = buildQuestion(null, legacySpec(r), r.key, r.section)
    if (r.active === false) q.off = true
    let at = r.after && r.after !== '^' ? all.findIndex((x) => x.key === r.after && x.section === r.section) + 1 : -1
    if (r.after === '^') at = all.findIndex((x) => x.section === r.section)
    if (at <= 0 && r.after !== '^') {
      const ids = SECTIONS.map((x) => x.id)
      at = all.findIndex((x) => ids.indexOf(x.section) > ids.indexOf(r.section))
      if (at < 0) at = all.length
    }
    all.splice(at, 0, q)
  })
  // The admin's order per section; anything not in it keeps its place after the question before it
  return SECTIONS.flatMap((sec) => {
    const items = all.filter((x) => x.section === sec.id)
    const ord = order[sec.id]
    if (!ord || !ord.length) return items
    let last = -1
    const rank = items.map((x, i) => {
      const r = ord.indexOf(x.key)
      if (r > -1) last = r
      return { x, r: r > -1 ? r : last + 0.5 + i / 1000 }
    })
    return rank.sort((p, q) => p.r - q.r).map((p) => p.x)
  })
}

export function applyQuestionConfig(rows) {
  CONFIG = Array.isArray(rows) ? rows : []
  QUESTIONS = mergeQuestions(CONFIG).filter((q) => !q.off)
}

// Sheet columns a question needs beyond the built-in ones, and whether they hold numbers
export function extraColumns(q) {
  const num = q.type === 'numbers' || q.type === 'rating'
  return keysOf([q]).filter((k) => !ANSWER_KEYS.includes(k)).map((k) => ({ key: k, number: num && k !== q.key + 'Other' }))
}

export const isShown = (q, a) => !q.show || !!q.show(a)
export const partShown = (p, a) => !p.show || !!p.show(a)
// The answers a BA can pick for this outlet (some drop brands it doesn't sell)
export const choicesOf = (q, a) => (q.choices ? q.choices(a, q.options) : q.options)
// The number boxes shown for this outlet
export const fieldsOf = (q, a) => q.fields.filter((f) => !f.show || f.show(a))
export { ratingBrands, followOn }

// Whether a question has what it needs to move on
export function answered(q, a) {
  const has = (k) => a[k] != null && String(a[k]).trim() !== ''
  // An added question the admin left optional can be passed over
  if (q.required === false && (q.type === 'single' || q.type === 'multi') && !(Array.isArray(a[q.key]) ? a[q.key].length : has(q.key))) return true
  if (q.required === false && q.type === 'pair' && !q.parts.some((p) => has(p.key))) return true
  if (q.required === false && q.type === 'rating') return true
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
      if (q.required && fieldsOf(q, a).some((f) => !has(f.key))) return false
      return true
    case 'rating':
      return ratingKeys(q, ratingBrands(q, a)).every(has)
    case 'pair':
      return q.parts.every((p) => !partShown(p, a) || has(p.key))
    case 'text':
      return !q.required || has(q.key)
    default:
      return true
  }
}

// Clears answers of questions that are hidden now (after a changed answer),
// number boxes no longer shown, and picks no longer on offer
export function pruneHidden(a) {
  const out = { ...a }
  for (const q of QUESTIONS) {
    if (q.type === 'numbers') q.fields.forEach((f) => { if (f.show && !f.show(out)) delete out[f.key] })
    const keep = (item, k) => {
      if (!item.choices || out[k] == null) return
      const ok = item.choices(out, item.options)
      if (Array.isArray(out[k])) out[k] = out[k].filter((x) => ok.includes(x))
      else if (!ok.includes(out[k])) delete out[k]
    }
    keep(q, q.key)
    if (q.type === 'pair') q.parts.forEach((p) => keep(p, p.key))
    if (isShown(q, out)) continue
    for (const k of keysOf([q])) delete out[k]
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
      const keys = q.type === 'numbers' ? fieldsOf(q, a).map((f) => f.key) : ratingKeys(q, ratingBrands(q, a))
      keys.forEach((k) => { if (a[k] !== '' && a[k] != null) out[k] = Number(a[k]) })
      // A brand not sold here: 0 kegs (only when the outlet gave any count)
      if (q.type === 'numbers' && keys.some((k) => a[k] !== '' && a[k] != null)) q.fields.forEach((f) => { if (f.zeroWhenHidden && !keys.includes(f.key)) out[f.key] = 0 })
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
