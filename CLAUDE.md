# SilverGuard

Elderly-care demo for the UM Startup Investor Challenge. Repurposes e-waste Android phones into privacy-preserving fall-detection sensors. Three modules: **Vision Engine** (camera + MediaPipe), **Manglish Companion** (ElevenLabs voice + YTL ILMU chat), **Family Bridge** (Guardian dashboard).

See [spec.md](spec.md) for product spec and [memory.md](memory.md) for session log / phase status.

## Quick Start

Two terminals, both required:

```powershell
# Terminal 1 — Convex backend (must be running for any data)
npx convex dev

# Terminal 2 — Metro bundler
npx expo start --dev-client
```

If phone is on cellular or a different WiFi than the laptop, use `npx expo start --tunnel` instead.

Open the **SilverGuard** app on the phone (the EAS dev-client build), not Expo Go — scan the QR from inside it.

## ⚠️ Cannot use Expo Go

Native deps (`expo-camera`, `react-native-webview`) require a dev build. EAS rebuild takes 10–15 min:

```powershell
eas build --profile development --platform android
```

Batch ALL native package installs before triggering a rebuild.

## Architecture

```
App.tsx                          Root: Convex provider, font loading, Dashboard ↔ VisionEngine swap
components/
  dashboard/                     Module 3: Family Bridge
    SafetyHero.tsx               Big status circle (safe / fall_detected)
    MedicationCard.tsx           Traffic-light meds row
    ChatDrawer.tsx               YTL ILMU chat bottom sheet
    CrisisModal.tsx              (Built but verify wiring)
    graphs/                      Pill adherence + activity charts (gifted-charts)
  vision/                        Module 1: Vision Engine
    VisionEngine.tsx             WebView host + RN overlay UI + Convex mutations
    mediapipe-html.ts            HTML string + hosted Vercel URL for Android
    StatusHeader / TranscriptionOverlay / EmergencyButton
  ui/                            Native-CN primitives (button, drawer, modal, fab, card)
convex/
  schema.ts                      users / events / medications
  events.ts                      logFall, logResolution, triggerWelfareCheck
  actions.ts                     YTL ILMU chat (OpenAI-compatible, model: pre-maluri-chat)
  meds.ts / users.ts / init.ts   queries + auto-seed Auntie Rose
```

Demo loop: Dashboard → Open Vision Engine → fall detected (or Emergency button simulates) → Convex flips status → SafetyHero turns red → "Auntie Okay Dah" resolves → status back to safe → ChatDrawer references the resolved fall via temporal context.

## Critical Gotchas

- **Android WebView + getUserMedia is broken for local HTML.** MediaPipe page is hosted at `https://umsic-blond.vercel.app/mediapipe-pose.html` and used on Android only ([components/vision/mediapipe-html.ts](components/vision/mediapipe-html.ts)). iOS uses inline HTML. Re-deploy the Vercel page if you change the WebView HTML.
- **Reanimated on Android crashes if Tailwind `animate-*` classes are passed to non-Animated components.** Use `Animated.View` + `useAnimatedStyle` directly. Don't use `animate-strobe` etc. via NativeWind.
- **ChatDrawer keyboard handling is manual.** `KeyboardAvoidingView` and `react-native-keyboard-aware-scroll-view` both fail inside fixed-height Modals on Android — use the existing `keyboardHeight` listener pattern. Input field is anchored OUTSIDE the message ScrollView on purpose.
- **`guardianId = "demo-guardian-id"`** is hardcoded in [App.tsx](App.tsx) and [components/dashboard/ChatDrawer.tsx](components/dashboard/ChatDrawer.tsx). Single-user demo; not production.
- **ElevenLabs agent ID is hardcoded** in [components/vision/mediapipe-html.ts:155](components/vision/mediapipe-html.ts#L155). Voice runs inside the WebView via ConvAI SDK, not via a Convex action (spec lists Convex-Action route as Phase 3, but the WebView shortcut is what actually ships).
- **YTL ILMU env vars** (`YTL_ILMU_API_KEY`, `YTL_ILMU_BASE_URL`) live in Convex env, not `.env.local`. Set with `npx convex env set`.

## Demo-Critical Files — Do Not Touch Without Reason

These work and are fragile:

- [components/vision/VisionEngine.tsx](components/vision/VisionEngine.tsx) — fall trigger logic, strobe, voice bridge
- [components/vision/mediapipe-html.ts](components/vision/mediapipe-html.ts) — pose detection algorithm, ElevenLabs init
- [convex/schema.ts](convex/schema.ts) — schema migrations require redeploying Convex

Style-only changes to the vision overlay components (`StatusHeader`, `TranscriptionOverlay`, `EmergencyButton`) are safe.

## Environment

- `.env.local` — `EXPO_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`
- Convex env (set via `npx convex env set`) — `YTL_ILMU_API_KEY`, `YTL_ILMU_BASE_URL`
- Database auto-seeds Auntie Rose + 2 meds on first Dashboard mount via `api.init.seed`

## Styling

NativeWind v4.1.23 + custom palette (Warm Ember). Fonts: DM Serif Display (headings), DM Sans (body). Color tokens (`bg-background`, `text-primary`, `bg-destructive`, `text-safe`) defined in [tailwind.config.js](tailwind.config.js) and [global.css](global.css).
