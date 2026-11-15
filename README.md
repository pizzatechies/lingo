# 🦒 Lugha — learn Kenya's languages

Lugha ("language" in Kiswahili) is a free, offline-first language-learning app for Kenyan languages:
**Kiswahili** (full course), plus beta courses in **Gĩkũyũ, Dholuo, Kalenjin, Maa and Sheng**, and an
incubator where native speakers can bring more languages (Oluluhya, Kikamba, Somali, Ekegusii, Mijikenda, Kimeru, Ng'aturkana, Kiembu).

It has the gamified mechanics people know from popular language apps — a learning path, streaks, XP, leagues,
quests — reworked around a few ideas: **learning is never rationed, it works on cheap phones with patchy data,
and the courses are built with the communities that speak these languages.** It has its own look (kikoi stripes,
a beaded-necklace learning path) and its own mascot, Twiga the giraffe.

## What's improved

| Typical app feature | Lugha's take |
| --- | --- |
| **Hearts / energy** that lock you out after mistakes | No hearts by default. Mistakes come back at the end of the lesson to retry. Optional *Hardcore mode* for those who want hearts — refilled by practising, never by paying. |
| **Paywalled extras** (unlimited practice, mistakes review, "explain my answer", legendary levels) | Everything is free: smart review, mistakes, listening, speaking, speed round, roleplay, gold challenges, explanations. Beads (earned only by learning) buy cosmetics and rest days. |
| **Streak freezes** sold for gems | Earn a rest day every 7 streak days, **schedule weekly days off** (e.g. Sunday or Friday) that never break your streak, and **repair** a lost streak within 3 days by doing extra practice. |
| **Opaque spaced repetition** | A half-life memory model; every word shows its strength bars and when it's due. |
| **Hints** show a word's translation | Tap any word for its meaning — and Swahili verbs are **automatically broken into parts**: *ninakula* → ni (I) + na (present) + kula (eat). The feedback panel has an **Explain** button with a word-by-word breakdown. |
| **Strict answer checking** | Forgiving: accepts alternatives, contractions, British/US spelling, articles, small typos (flagged) and missing diacritics like ĩ/ũ (flagged), with on-screen buttons for special characters. |
| **Leagues that reward grinding** | Same-day replays of a lesson earn half XP. Leagues can be hidden entirely. **Harambee teams** (family, class, chama) share one weekly goal — cooperative, not just competitive. |
| **Volunteer contributor programme** (discontinued elsewhere) | Built in: ⚑ Report on every exercise, community voting that auto-approves accepted answers, native-speaker **audio recordings** that replace synthetic voices, moderators, and a **language incubator**. |
| **Needs a constant connection** | Installable PWA; the whole app is precached by a service worker. ~75 KB gzipped shell, courses lazy-load (the Kiswahili course is ~19 KB). Export/import progress as a file. |
| **Push-notification reminders** | Add a daily reminder to your phone's calendar (.ics) — no tracking, no push server. |
| **Learn only from English** | Beta courses can be learned **from Kiswahili** — natural for most Kenyans. |
| **Placement test** | Short adaptive placement test, plus **"Jump here"** on any unit and a checkpoint at the end of each unit. |
| **Generic content** | Kenyan context everywhere: matatus, M-Pesa, Swahili time (saa moja = 7 a.m.), methali (proverbs) of the day, culture guidebooks, folktale-style stories. |

### Learning features
- **12-unit Kiswahili course**: 50 lessons, 400+ words and phrases, 5 interactive stories, 18 proverbs, pronunciation guide.
- **Exercise types**: new-word cards, multiple choice, picture choice, match pairs, word-bank translation (both directions), typing, fill-in-the-blank, listening (tap or type what you hear, normal & slow), speaking (speech recognition for Kiswahili, record-and-compare for every language), dialogue roleplay.
- **Adaptive difficulty**: harder exercise types appear as your rolling accuracy rises.
- **Practice hub**: smart review, fix my mistakes, listening, speaking, 60-second speed round, conversations; a word list with memory strength.
- **Explore**: stories, searchable dictionary with bookmarks, proverbs, sounds & letters, culture notes.
- **Motivation**: daily goal ring, streak calendar, 3 daily quests, monthly challenge, 18 achievements, shop with outfits for Twiga.
- **Accessibility**: keyboard play (Enter to check, 1–9 to choose), screen-reader labels, dark mode, larger text, reduced motion.

> **About the beta courses.** Kiswahili content is complete. The Gĩkũyũ, Dholuo, Kalenjin, Maa and Sheng courses
> are starter courses that **must be reviewed by native speakers before a public launch** — dialects vary and some
> forms may be wrong. The app labels them as beta and every exercise has a ⚑ Report button feeding the review queue.

## Running it

Requires **Node.js 22.13+** (the server uses the built-in `node:sqlite`).

```bash
npm install
npm run dev          # web app on :5173 (proxying /api) + API on :8787
```

Production:

```bash
npm run build
npm start            # serves the app and API on $PORT (default 8787)
```

The web app also works with **no server at all** (e.g. any static host): lessons, practice, stories and streaks run
locally; leagues, friends, teams, sync and community review appear when the API is reachable.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP port |
| `DATA_DIR` | `./data` | SQLite database and uploaded recordings — mount a persistent volume here |
| `MODERATORS` | — | Comma-separated usernames allowed to approve/reject community suggestions |
| `APPROVAL_VOTES` | `3` | Net 👍 votes that auto-approve an accepted answer or recording |
| `VITE_API_BASE` | same origin | Build-time API URL if the app is hosted separately |

Docker: `docker build -t lugha . && docker run -p 8787:8787 -v lugha-data:/data lugha`

## Tests

```bash
npm test             # unit + content + API tests (vitest)
npm run test:e2e     # browser smoke test against a running server (Playwright)
```

The content test generates every lesson of every course, in both base languages, with and without audio, and
proves each exercise is solvable — so new content can't ship broken exercises.

## Adding content

Courses live in `src/content/courses/*.ts`, written with compact helpers:

```ts
lesson('Hello', [
  w('jambo', 'hello', '👋'),                                  // word: text, English, emoji
  s('Habari yako?', 'How are you?', { enAlts: ['What is your news?'] }), // sentence + accepted alternatives
], [
  chat('Shikamoo.', 'My respects.', 'Marahaba.', 'I accept your respects.', ['Poa!'], 'Elders reply "Marahaba".'),
])
```

Exercises are generated automatically from words, sentences and chats. Add `sw:` glosses to let a course be learned from Kiswahili.

## Project layout

```
src/content/      course data + builder        src/lib/       learning engine (answers, SRS, streaks, exercises, hints)
src/pages/        screens                      src/state/     persisted app store (zustand)
server/           Express + node:sqlite API    tests/         unit, content, API and e2e tests
```
