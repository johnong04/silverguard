# SilverGuard spec.md

**Version:** 1.4 (Dec 2025)
**Tech Stack:** Expo SDK 54 (EAS Development Builds Required, Android Build), Convex v1.31.2, NativeWind v4.1.23 (Stable), MediaPipe Web (@mediapipe/tasks-vision v0.10.21 via CDN), Vercel AI SDK v5.0.115, ElevenLabs v1.59.0, Gifted Charts v0.1.45, Expo Linear Gradient v14.0.2.

## 1. High-Level Goals

- Build a "Silver Tsunami" safety solution using e-waste smartphones (BYOD).
- Provide 100% privacy-preserving fall detection (skeletal metadata only).
- Cultural "Manglish" voice companion using YTL ILMU (Knowledge) & ElevenLabs (Voice).

## 2. Module 1: Guardian Vision Engine (Safety)

- **Features:** Real-time Fall Detection, Anomaly Detection, Physio Tracking.
- **Implementation:** WebView + MediaPipe Pose Landmarker (WebGPU via @mediapipe/tasks-vision CDN). Logic triggers `FallDetected` in Convex if head Y-coord drops below hip Y-coord.

## 3. Module 2: Manglish Companion (Voice)

- **Features:** Active Welfare Checks ("Auntie, okay tak?"), Contextual Q&A, Med Coach.
- **Agent Logic:** Vercel AI SDK Tool Calling. Agent queries Convex via `checkMedHistory()` and `checkSafetyStatus()`.

## 4. Module 3: Family Bridge (Dashboard)

- **Features:** Real-time Meds tracker (Traffic Light), Activity logs, Safety status, Health Insights Chat (powered by YTL ILMU for cultural context).
- **Implementation:** Reactive UI via Convex subscriptions; NativeWind v4 + Native-CN.

## 5. Database Schema (Convex)

- **users:** { id, guardian_id, status }
- **events:** { timestamp, type: "fall" | "meds", metadata }
- **medications:** { name, schedule, taken: boolean }

## 6. Current Phase

- [x] Initialize project with Expo SDK 54 and EAS Development Builds.
- [x] Set up NativeWind v4 and Native-CN foundation.
- [x] Initialize Convex backend and seed demo data.
- [ ] Set up .mdc rules for Native-CN and Vercel AI SDK.

## 7. UI Architecture (Luxury Aesthetic)

- **Design System:** Native-CN (shadcn-mobile) + NativeWind v4.
- **Page 1: The Guardian Dashboard**
  - Centerpiece: "Safety Status" card with real-time reactive pulses.
  - Quick Actions: "Trigger Welfare Check".
  - AI Chat: Collapsible Bottom Sheet / Drawer for Health Insights (YTL ILMU).
  - Habits: Traffic-light style checklist for Meds.
- **Page 2: The Vision Engine (Hidden/Background)**
  - Full-screen WebView running MediaPipe.
  - Persistent "Privacy Active" indicator.
