# 🧠 Project Memory: SilverGuard

## 📅 Last Updated: Dec 20, 2025

## 🎯 Executive Summary

- **Current Goal:** Build a "High-Wow" demo for the UM Startup Investor Challenge.
- **Strategy:** Prioritize the "Happy Path" loop: **Vision Detection** → **Immediate Voice Response** → **Real-time Dashboard Update**.

## 🕒 Session Log: Dec 20, 2025

- [x] **Tech Stack Finalized:** Expo SDK 54, Convex v1.31.2, MediaPipe v0.10.21, Vercel AI SDK v5.0.115, ElevenLabs v1.59.0.
- [x] **Documentation Indexed:** Added Expo, Convex, MediaPipe, Vercel AI, and ElevenLabs docs to Cursor.
- [x] **Dashboard V2 (Luxury Rebuild):** Rebuilt the Guardian Dashboard with "Warm Ember" aesthetic, animated Safety Hero, traffic-light medication cards, Crisis UI, and AI Chat Drawer.
- [x] **Dashboard V3 (Refinement & Analytics):**
  - Implemented **Health Insights Carousel** with Pill Adherence (Live Convex) and Activity Bar Charts.
  - Polished **Chat Drawer** with conversational mock logic, thinking indicators, and refined bubble design.
  - Optimized **Emergency Header** with integrated dropdown menu (Live Call, Guardian, Services).
  - Fixed critical **Android Keyboard/Scroll** bugs using manual height management.
- [ ] **Next Task:** Install CV dependencies (WebView, Camera) and trigger a fresh EAS Development Build before starting the Vision Engine coding.

## ✅ Implementation Checklist (The "Happy Path")

### Phase 1: The Foundation (Hours 0-6)

- [x] Initialize Expo project with EAS Development Builds.
- [x] Scaffold Luxury Dashboard UI using Native-CN and NativeWind v4.1.23.
- [x] Rebuild Dashboard V2 with "Warm Ember" luxury aesthetic and custom typography (DM Serif/Sans).
- [x] Integrate **Gifted Charts** for health analytics (Pills/Activity).
- [x] Initialize Convex backend (`npx convex dev`) and connect live subscriptions.

### Phase 2: The "Eyes" (Hours 6-12)

- [ ] Install native dependencies: `expo-camera`, `react-native-webview`.
- [ ] Trigger fresh EAS build to support new native modules.
- [ ] Implement MediaPipe WebView for on-device Pose Estimation.
- [ ] **Decision:** Use WebGPU version in WebView for maximum velocity/privacy.
- [ ] Connect CV "Fall" trigger to a Convex mutation.

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
