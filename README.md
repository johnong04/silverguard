# SilverGuard 🛡️

**Turning e-waste into a guardian angel for the elderly.**

SilverGuard repurposes retired Android phones into privacy-preserving, on-device
fall-detection and medication-adherence sensors — then wires them to a family
dashboard and a Manglish-speaking AI companion. No new hardware. No cloud video.
No dignity lost.

Built for the **UM Startup Investor Challenge**.

---

## The Problem

Malaysia is aging fast. By 2030, 15% of the population will be over 60. Falls are
the leading cause of injury death for that group — and most happen at home, alone,
where no one sees them for hours. Meanwhile, 1.5 billion phones are retired every
year, most ending up as toxic e-waste.

SilverGuard closes both loops: **the old phone in the drawer becomes the sensor
that keeps grandma safe.**

## How It Works

A retired phone is mounted in the room. Its camera feeds an on-device pose model —
**frames never leave the device**. When it detects a fall, it triggers a voice
check-in ("Auntie, you okay ah?"), and if there's no response, alerts the family
and logs the event. The family sees everything on a calm, glanceable dashboard.

```
 ┌───────────────┐     fall detected      ┌────────────────┐
 │ Vision Engine │ ─────────────────────▶ │ Convex backend │
 │  (old phone)  │ ◀──── status ───────── │  (realtime db) │
 └───────────────┘                        └───────┬────────┘
        │                                         │
   voice check-in                            live status
   (ElevenLabs)                                   │
                                          ┌────────▼───────┐
                                          │ Family Bridge  │
                                          │  (dashboard)   │
                                          └────────────────┘
```

## Three Modules

### 1. Vision Engine — the sensor
On-device MediaPipe pose tracking with a TouchDesigner-style skeleton overlay.
Detects falls via centroid-drop + torso-horizontal heuristics. Tap-to-scan pill
recognition confirms medication was actually taken, not just tapped. Privacy is
architectural: **video is processed and discarded frame-by-frame; nothing is
recorded or uploaded.**

### 2. Manglish Companion — the voice
A warm, code-switching AI companion (ElevenLabs voice + YTL ILMU chat) that speaks
the way Malaysian aunties and uncles actually speak. It runs the post-fall check-in,
answers questions, and keeps lonely evenings a little less lonely.

### 3. Family Bridge — the dashboard
A glanceable Guardian view: one big safety status circle, a traffic-light
medication row, adherence + activity charts, and a chat drawer that remembers
context ("Mum had a fall this morning but resolved it herself"). Built to be
understood in one glance by a stressed adult child at work.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| App | React Native + Expo (EAS dev-client) |
| Vision | MediaPipe Pose in a WebView |
| Realtime backend | Convex |
| Voice | ElevenLabs ConvAI |
| Chat | YTL ILMU (Malaysian LLM, OpenAI-compatible) |
| Styling | NativeWind v4 + custom "Warm Ember" palette |

## Getting Started

Two terminals, both required:

```powershell
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Metro bundler
npx expo start --dev-client
```

Open the **SilverGuard** dev-client build on the phone (not Expo Go — native
camera/WebView deps need a real build) and scan the QR. If the phone is on
cellular or a different network, use `npx expo start --tunnel`.

The database auto-seeds a demo elder (Auntie Rose) and her medications on first
launch. See [spec.md](spec.md) for the full product spec and [memory.md](memory.md)
for the build log.

## Roadmap

What ships today is the demo loop. What's coming makes it a product:

- **🏠 Home Mapping** — record a 30-second walkthrough; SilverGuard builds a 3D
  floorplan and learns a *behavioral baseline* per room, so it can flag anomalies
  ("Auntie hasn't left the bedroom in 14 hours") — not just falls.
- **💊 Smart Pill Vision** — recognize the actual pill on camera and match it to the
  prescription, catching wrong-dose and wrong-time errors, not just missed ones.
- **📉 Behavioral Anomaly Alerts** — gait slowing, longer bathroom visits, disrupted
  sleep patterns surfaced as early-warning signals before a crisis.
- **👨‍👩‍👧 Multi-Elder / Multi-Guardian** — care circles, so a whole family (and a
  care home) can watch over several elders from one account.
- **⌚ Wearable Fusion** — optional smartwatch heart-rate + fall-impact data to cut
  false positives.
- **🌏 Full BM + dialect support** — beyond Manglish into formal BM, Cantonese, and
  Tamil for Malaysia's real linguistic mix.

## Team

Built by John Ong and team for the UM Startup Investor Challenge, 2026.

---

*SilverGuard — because the phone in your drawer could save a life.*
