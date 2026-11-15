# Lugha Zetu — learn Kenya's languages

<img src="public/icons/icon.svg" width="96" alt="Lugha Zetu icon: a speech bubble woven from beadwork">

Lugha Zetu ("our languages" in Kiswahili), by **Pizza Technologies**, is a free, offline-first language-learning app for Kenyan languages:
**Kiswahili** (full course), plus beta courses in **Gĩkũyũ, Dholuo, Kalenjin, Maa and Sheng**, and an
incubator where native speakers can bring more languages (Oluluhya, Kikamba, Somali, Ekegusii, Mijikenda, Kimeru, Ng'aturkana, Kiembu).

It has the gamified mechanics people know from popular language apps — a learning path, streaks, XP, leagues,
quests — reworked around a few ideas: **learning is never rationed, it works on cheap phones with patchy data,
and the courses are built with the communities that speak these languages.** It has its own look (kikoi stripes,
a beaded-necklace learning path) and its own mascot, Twiga the giraffe. The icon is a speech bubble woven from rings of beadwork — language, made the Kenyan way
(`python3 scripts/make-logo.py && node scripts/render-icons.cjs` regenerates it everywhere).

## What's improved

| Typical app feature | Lugha Zetu's take |
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
- **12-unit Kiswahili course**: 46 lessons, ~470 words and phrases, 5 interactive stories, 18 proverbs, pronunciation guide.
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

## Android app (APK)

The `android/` folder is a [Capacitor](https://capacitorjs.com) project that packages the same web app as a native
Android app (Android 6.0+). Inside the app, audio uses the phone's own text-to-speech engine (Google TTS includes
Kiswahili), and the microphone permission enables speaking exercises and community recordings.

Requirements: JDK 21 and the Android SDK (platform 35, build-tools 35) with `ANDROID_HOME` set, or Android Studio.

```bash
npm run android:apk:debug   # → android/app/build/outputs/apk/debug/app-debug.apk (installable, debug-signed)
npm run android:apk         # → android/app/build/outputs/apk/release/app-release.apk
```

To sign release builds, create `android/keystore.properties` (gitignored — never commit it):

```properties
storeFile=/absolute/path/to/lugha-release.jks
storePassword=...
keyAlias=lugha
keyPassword=...
```

Generate a key with `keytool -genkeypair -keystore lugha-release.jks -alias lugha -keyalg RSA -keysize 2048 -validity 10000`.
**Keep the keystore safe**: Android only installs updates signed with the same key.

Online features (leagues, friends, teams, sync, community) need a hosted server. Build the app pointing at it with
`VITE_API_BASE=https://your-server.example npm run android:apk`. The server already allows the app's origin via CORS
(`CORS_ORIGINS` overrides the list). Without a server the app runs fully offline.

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

---

© Pizza Technologies. Lugha Zetu is built and maintained by Pizza Technologies.

## iPhone app (IPA)

The `ios/` folder is the Capacitor iOS project (Swift Package Manager, iOS 14+). iOS apps can only be compiled on
macOS, so the **"iOS build (IPA)" GitHub Actions workflow** builds it on a GitHub-hosted Mac:

1. Open the repo's **Actions** tab → **iOS build (IPA)** → **Run workflow** (it also runs on pushes that change the app).
2. Download the **LughaZetu-iOS** artifact from the finished run.

It always produces an **unsigned** `.ipa`. iPhones only install signed apps, so either:
- sideload the unsigned IPA with **Sideloadly** or **AltStore**, which sign it with your own Apple ID (free accounts: 7-day expiry), or
- add these repository secrets to get a **signed** `.ipa` for TestFlight, the App Store or ad-hoc devices
  (needs an Apple Developer account): `IOS_CERTIFICATE_P12_BASE64`, `IOS_CERTIFICATE_PASSWORD`,
  `IOS_PROVISION_PROFILE_BASE64`, `IOS_TEAM_ID`, optional `IOS_EXPORT_METHOD` (`app-store`, `ad-hoc`, `development`).

On a Mac you can also run `npm run build && npx cap sync ios && npx cap open ios` and build from Xcode.
