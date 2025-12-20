# 🧠 Project Memory: SilverGuard

## 📅 Last Updated: Dec 20, 2025

## 🎯 Executive Summary

- **Current Goal:** Build a "High-Wow" demo for the UM Startup Investor Challenge.
- **Strategy:** Prioritize the "Happy Path" loop: **Vision Detection** → **Immediate Voice Response** → **Real-time Dashboard Update**.

## 🕒 Session Log: Dec 20, 2025

- [x] **Tech Stack Finalized:** Expo SDK 54, Convex v1.31.2, MediaPipe Web (@mediapipe/tasks-vision v0.10.21 via CDN), Vercel AI SDK v5.0.115, ElevenLabs v1.59.0.
- [x] **Documentation Indexed:** Added Expo, Convex, MediaPipe, Vercel AI, and ElevenLabs docs to Cursor.
- [x] **Dashboard V2 (Luxury Rebuild):** Rebuilt the Guardian Dashboard with "Warm Ember" aesthetic, animated Safety Hero, traffic-light medication cards, Crisis UI, and AI Chat Drawer.
- [x] **Dashboard V3 (Refinement & Analytics):**
  - Implemented **Health Insights Carousel** with Pill Adherence (Live Convex) and Activity Bar Charts.
  - Polished **Chat Drawer** with conversational mock logic, thinking indicators, and refined bubble design.
  - Optimized **Emergency Header** with integrated dropdown menu (Live Call, Guardian, Services).
  - Fixed critical **Android Keyboard/Scroll** bugs using manual height management.
- [x] **Vision Engine Setup:** Installed `expo-camera` and `react-native-webview` (SDK 54 compatible), configured app.json with camera permissions and plugin. Ready for EAS rebuild.
- [x] **Vision Engine V1 (Page 2):** Implemented full-screen fall detection page with:
  - MediaPipe Pose Landmarker via WebView (CDN @mediapipe/tasks-vision v0.10.21)
  - Jade-green skeleton overlay on camera feed
  - Fall detection algorithm (nose-below-ankles + rapid centroid drop)
  - StatusHeader with "Guard Mode Active: Privacy Locked" indicator
  - TranscriptionOverlay with Twitch-style captions
  - EmergencyButton "Hantar Kecemasan" with haptic feedback
  - WebView-to-React-Native bridge via postMessage
  - Convex logFall mutation integration

## ✅ Implementation Checklist (The "Happy Path")

### Phase 1: The Foundation (Hours 0-6)

- [x] Initialize Expo project with EAS Development Builds.
- [x] Scaffold Luxury Dashboard UI using Native-CN and NativeWind v4.1.23.
- [x] Rebuild Dashboard V2 with "Warm Ember" luxury aesthetic and custom typography (DM Serif/Sans).
- [x] Integrate **Gifted Charts** for health analytics (Pills/Activity).
- [x] Initialize Convex backend (`npx convex dev`) and connect live subscriptions.

### Phase 2: The "Eyes" (Hours 6-12)

- [x] Install native dependencies: `expo-camera`, `react-native-webview` (installed via `npx expo install`).
- [x] Fixed "Gradient package not found" error: Installed `expo-linear-gradient` (required by `react-native-gifted-charts`).
- [ ] Trigger fresh EAS build to support new native modules.
- [x] Implement MediaPipe WebView for on-device Pose Estimation.
- [x] **Decision:** Use WebGPU version in WebView for maximum velocity/privacy.
- [x] Connect CV "Fall" trigger to a Convex mutation.

### Phase 3: The "Magic Voice" (Hours 12-18)

- [ ] Integrate ElevenLabs API via a Convex Action.
- [ ] **Demo Shortcut:** Initially use a strict System Prompt in ElevenLabs for welfare checks to ensure sub-second latency.
- [ ] Verify the "Auntie Check" voice blasts immediately upon a fall trigger.

### Phase 4: The "Brain" & Persistence (Hours 18-30)

- [ ] Integrate Vercel AI SDK to add "Memory" to the companion.
- [ ] **High Priority:** Integrate YTL ILMU Chat Drawer on Dashboard.
- [ ] Add `onFinish` callback to save chat history to Convex.
- [ ] Implement Tool Calling: Allow the Agent to check the Convex events table.

## 🏗️ Architectural Decisions & Lessons

- [!] **EAS Workflow:** Batch native package installations BEFORE triggering builds to save time (10-15 mins per build).
- [!] **Keyboard Management:** Reverted `KeyboardAvoidingView` and `KeyboardAwareScrollView` in favor of **Manual Keyboard Height Listeners** for the Chat Drawer. Libraries failed inside fixed-height Modals on Android; manual `paddingBottom`/`marginBottom` proved 100% reliable.
- [!] **Layout Stability:** Anchored Input Area OUTSIDE the message `ScrollView` to prevent growing chat history from pushing the input field off-screen during autoscrolls.
- [!] **UX Micro-interactions:** Use staggered `scrollToEnd` (immediate + 100ms delay) to ensure scrolls occur AFTER layout transitions finish.
- [!] **Android WebView Camera Limitation:** `navigator.mediaDevices.getUserMedia` is undefined for local HTML in Android WebView because it's not treated as a secure (HTTPS) context. **Solution:** Hosted the MediaPipe HTML on Vercel at `https://umsic-blond.vercel.app/mediapipe-pose.html`. The app now uses this URL for Android Vision Engine.
