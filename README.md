# Habesha Draught Survey

Colours: white background, gold, black. Works from 320 px phones up to wide desktops.

Draught survey app for BAs, with a manager view and admin console in the same app. Built from the Outlet Survey app: same sign-in, GPS checks, 100 m outlet range, Sync, bell, manager view and admin console. Only the survey questions and the numbers worked out from them are different. React 19, Vite, Tailwind, React Router, Leaflet (manager map only).

## The survey

Built on the Draught Immersion Field Kit (Addis Ababa, high-end outlets), one question per screen. Tapping an answer moves on by itself; numbers, ratings, tick-all and note questions have a Next button. The rule from the kit runs through it: ask about tonight, not what people would do, and never say "Habesha" before the consumer does.

1. Outlet: type part of the name and tap the outlet. Area, territory and parent territory come from the National Outlet tab.
2. Outlet group: Lost Habesha outlet, St. George-dominant (never Habesha), or Habesha draught outlet. The owner questions change with the group. Surveys saved under the old name "Active Habesha outlet" count as Habesha draught outlet.
3. Outlet observation, 11 questions answered by watching (o_ columns), done in pairs over 2 rounds: draught consumers now, orders observed and how many named a brand, what the waiter does when nobody names a brand and who decides (consumer, waiter, owner or manager, barman), brands on tap, St. George or Habesha glasses on show, a quality check per brand on tap (temperature, freshness, pour, foam, glass, 1 to 5), anyone pushing a brand, who drinks (age, men or women), groups or alone and how busy it is, draught or bottled, busiest time, and anything that surprised them.
4. Outlet owner / manager (m_ columns), off-peak: who decided which brands are sold, weekly kegs by brand, single and jambo prices for St. George and Habesha, which brand sells fastest and is most profitable, problems with any brand, agreements, then by group:
   - Lost: what keeps St. George (consumer demand, margin, service quality, draught machine performance, trade marketing investments, exclusivity, sales team relationship), what the St. George distributor gives them, when Habesha stopped and the real reason (in their words), what it would take to win them back, what would stop them, Habesha kegs a week they could sell, trial. 14 questions.
   - St. George-dominant: the same without the two "lost" questions; the win-back question becomes "what would make you switch or add a tap?". 12 questions.
   - Habesha draught: what would make them sell more Habesha and the kegs they could sell. 8 questions.
5. Bar staff, 10 questions (9 outside lost outlets, s_ columns): what they bring when someone says only "jambo", what happens with the wrong beer, which beer makes their day easier, what they get for pushing a brand, their own favourite, glasses lost to foam, line cleaning, why Habesha was removed (lost only), what reason would make them bring a different beer, and the best thing they said.
6. Draught consumer, 11 questions (c_ columns): what beer they are drinking right now, what they said when they ordered (with their exact words), single or jambo, what they did when a waiter brought a different beer, who they would blame for a bad beer, what good draught looks like, who decides in the group, then only at the end whether they have drunk Habesha and why not, the best thing they said, and the invite to the paid consumer Q&A (name and phone required if they agree).
7. Your assessment, 1 question (a_likelihood): chance of conversion, High, Medium or Low.
8. Review, then Submit.

Each section starts with a short intro from the kit and can be skipped when nobody is available ("skipped" column).

The field kit guides are in the app in Amharic: the observation sheet on the Observation intro, and the customer conversation guide on the Bar staff (waiter) and Owner / manager intros. A Guide button (መመሪያ) on every question of those sections opens it again. The text is in `src/guides.js`.

## Questions tab (admin)

The admin can change the questionnaire from the app, without a code change:

- Add a question to any section: one answer, tick all, a number or a note in their words. Choose the outlet groups that get it, where it goes, and whether an answer is required.
- Reword a built-in question or its note. Its answers stay fixed, because the analysis counts them.
- Turn any question off, and back on. Answers already saved stay in the sheet.

Changes are kept in the Questions tab of the sheet and reach the phones on their next sync, usually within a minute; phones keep the last version for offline work. Each added question gets its own column (x_ and six characters) at the end of the Surveys tab, and shows in the admin Analysis tab with the others.

## Before you leave the field

The BA home screen shows today's field check against the kit's daily targets: 8 venues, 15 orders watched, 4 talks with bar staff, 2 with owners, 6 quotes. It counts from surveys sent on that phone today.

## Analysis

- Habesha keg opportunity: for each outlet (latest visit), gain = Habesha kegs a week they could sell, less what they sell now. Expected gain = gain x the BA's chance of conversion (High 70%, Medium 40%, Low 10%; no assessment counts as Medium). Each row shows what would stop the outlet. The manager view shows the totals.
- Hypotheses: the evidence for H1 to H5 from the kit (default not loyalty, the waiter is the real customer, choosing carries risk, no brand moment, quality judged by serve). It shows the numbers; the team confirms or kills each one in the debrief.
- Quotes: every exact quote (consumer, ordering words, bar staff, owner, observation) with outlet and BA, filterable, with a Copy for Excel button.
- Orders naming a brand: orders that named a brand out of all orders watched. It replaces "would order Habesha", which the kit drops as a hypothetical question.
- Q&A invites: everyone who agreed to the paid Q&A (name, phone, best time, outlet, BA) with a Copy for Excel button.

Questions, options and skip rules live in `src/questionnaire.js`. The column list is `ANSWER_KEYS` there and in `apps-script/Survey.gs`; change both together. An empty Surveys tab gets the new columns laid out by itself on the first save.

## Before the first deploy

The draught survey has its own Google Sheet and Apps Script project, separate from the outlet survey, so draught data never mixes with the crate survey.

1. Create a new Google Sheet (for example "Habesha Draught Survey"), then Extensions > Apps Script.
2. Replace `Code.gs` with `apps-script/Survey.gs` and save.
3. Run `surveySetup` once and approve the permissions. It creates the Users, Surveys, Presence, Track, Logins, Flags, Outlets and Notifications tabs, the signing secret, and an `admin` account. The admin password is in the Users tab.
4. Run `importOutletSurveyUsers` to copy every BA, manager and admin (with passwords and divisions) from the outlet survey sheet, and `importNationalOutlets` to copy the National Outlet tab. Both are also in the Draught Survey menu on the sheet. Run `importNationalOutlets` again whenever the national data changes.
5. Deploy > New deployment > Web app. Execute as Me, Who has access Anyone.
6. Paste the `/exec` URL into `src/config.js` (`API_URL`) and push. Vercel redeploys. Until the URL is in, sign-in shows "The server is not set up yet".
7. Sign in as `admin`, change the password, and use Outlets > Import to paste the draught outlet list from Excel: Outlet ID, Outlet name, Latitude, Longitude. BAs only see these outlets within 100 m.

After any change to the script, use Deploy > Manage deployments > Edit > New version so the URL stays the same.

## Vercel

Push this folder to a new GitHub repo (for example Habesha-Draught-Survey) and import it as a new Vercel project, Root Directory left empty. Framework preset Vite. Keep it separate from the outlet survey project. The site must be on HTTPS (Vercel is), or phones won't share location.

## What gets recorded

| Tab | One row per | Holds |
|---|---|---|
| Logins | sign-in | who, when, GPS position and accuracy, phone model |
| Presence | BA | last seen, online or offline, what they're doing, last GPS fix |
| Track | location report | position every 3 minutes while the app is open |
| Surveys | survey | answers plus the GPS position where it was submitted |
| Flags | event | developer tools detected, location switched off |

BAs can't sign in without a location fix. Managers and admins can, since they're often on a PC. A survey is refused if location permission is blocked.

## Admin console

Admins sign in on the same page as everyone else and land on the console. The console has five tabs:

- Users: add BAs, managers and admins, reset passwords, block accounts. An admin can't remove their own admin access.
- Outlets: the outlet master (ID and name). Add, edit, deactivate, or paste the whole list from Excel.
- Requests: outlets BAs asked to add. Approve (with the right ID) or decline with a reason. The BA is notified either way.
- Alerts: developer tools and location-off flags. Mark them resolved once handled.
- Messages: send a notice to all BAs, managers, everyone, or one person. It lands in their bell.

## Outlet name and ID

Once the Outlets tab has outlets, BAs can't type an outlet. They search by name or ID and tap the match, which fills both from the list. The server also rejects any survey whose outlet ID isn't an active outlet, and always saves the name from the list, so a survey can't carry a wrong name or ID. If an outlet isn't listed, the BA sends a request from the same screen. The list is kept on the phone, so search works without signal, and it refreshes when the admin changes it.

Before the list is loaded, BAs type name and ID as before.

## 100 m outlet range

On the outlet step a BA only sees outlets whose coordinates are within 100 m of the phone, closest first, with the distance on each. The list updates as the GPS fix changes, and the refresh button gets a new fix. Outlets with no coordinates can still be found by typing their name or ID, and the admin Outlets tab marks them "No location" so they can be filled in.

Every survey stores `distanceM`, the distance between the phone and the outlet when it was sent. Anything over 100 m is still saved but raises an "away from outlet" alert for managers and admins. Change the range with `OUTLET_RANGE_M` in both `src/config.js` and `Survey.gs`.

## Sync

The BA home screen has a Sync button. It uploads any surveys waiting on the phone, then pulls the latest outlet list and notifications, and shows the time of the last full sync. It also runs by itself whenever the home screen opens.

## Notification bell

Every signed-in screen has a bell. BAs get admin messages, outlet approvals and declines, and upload confirmations. Managers get alerts and messages. Admins also get new outlet requests. Read state is kept per person on each device.

## Manager view

Managers sign in on the same URL and land on `/manager`. Admins can open it too from the console. It refreshes every minute and shows who is online, what each BA is doing, where they are, today's route for a selected BA, flags, market share and the latest surveys. It works on phone and PC.

The manager view shows draught keg share (St. George, Habesha, Other) from the managers' weekly keg counts, outlet groups, the share of outlets that would accept a Habesha trial and of consumers who would order Habesha draught. All use the latest visit per outlet.

The admin Analysis tab has the same figures by area, territory, group or BA, and a result card for every question: answer shares, average numbers, and average 1 to 5 ratings for St. George against Habesha.

## Limits worth knowing

A web app can only read location while it is open on screen. When the BA closes it or locks the phone, tracking stops and the manager view shows them offline.

The app locks itself and logs a flag when developer tools or USB debugging are attached, and blocks the shortcuts that open them. It cannot see whether Android developer options are switched on, and it cannot detect a fake-GPS app directly. The manager view flags location jumps faster than 150 km/h, which is what fake GPS usually looks like. Full enforcement needs a native Android app or company-managed phones.

The Track tab grows by about 20 rows per BA per hour of app use. Archive it monthly once it passes 100,000 rows.

## Local

```
npm install
npm run dev
```

`npm run build -- --mode demo` builds a version with made-up data that never calls the server. Any username signs in as a BA; a username containing "manager" or "admin" opens those views.
