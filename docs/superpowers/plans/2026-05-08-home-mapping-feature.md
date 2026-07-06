# Home Mapping Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Map My Home" feature to the Dashboard. On tap, a modal walks through 5 stages: (1) play the user's recorded walkthrough video, (2) fake AI processing with cycling status text, (3) dramatic reveal of the 3D isometric floorplan, (4) cross-fade to the 2D top-down floorplan with tappable hotspots for Toilet / Main Door / Kitchen / Bedroom, (5) "behavioral baseline learning" toast and auto-close. Sells the spatial-AI + behavioral-anomaly pitch story for the investor demo video.

**Architecture:** Single new component (`HomeMappingModal.tsx`) with a 5-state machine. Floorplan images bundled into the app via `require()` from `assets/`. Walkthrough video hosted on Vercel (same deployment as MediaPipe page) and played inside a small WebView wrapper — avoids needing `expo-video` / `expo-av` which would require a 15-min EAS rebuild. State + selected-rooms held in component-local React state (no Convex schema changes per user decision).

**Tech Stack:** React Native + Expo, react-native-webview (existing), react-native-reanimated (existing), NativeWind (existing), bundled PNG assets.

**Verification approach:** Pure UI feature with no detection logic — verification is visual (eyeball each stage on the demo phone) plus a happy-path tap-through. Risk to existing functionality is near-zero because nothing in `VisionEngine.tsx`, `mediapipe-html.ts`, or Convex is touched.

**Time budget:** ~30 minutes total. The component is bigger than the skeleton restyle but is pure RN composition over existing libraries.

---

## File Structure

| File | Responsibility | Change scope |
|------|---------------|--------------|
| `assets/walkthrough.mp4` | User's home walkthrough recording (9 MB, 36 sec) | Already on disk |
| `assets/3d-floorplan.png` | Gemini-generated 3D isometric floorplan | Already on disk |
| `assets/2d-floorplan.png` | Gemini-generated 2D top-down floorplan | Already on disk |
| `public/walkthrough.mp4` | Same video, hosted on Vercel for WebView playback | Copy from `assets/` |
| `components/dashboard/HomeMappingModal.tsx` | New 5-stage modal component | Create |
| `App.tsx` | Add "Map My Home" button + modal state | Modify |
| `VisionEngine.tsx` / `mediapipe-html.ts` / Convex | **DO NOT TOUCH** | Off-limits |

**Why duplicate the video file:** assets/ is bundled into the APK (ships with the app), public/ is deployed to Vercel (served over HTTPS to the WebView). The bundled copy isn't actually used by playback in this approach but keeps it co-located for future migration to expo-video. If file-size matters for the APK we can later add `assets/walkthrough.mp4` to `.easignore`.

---

## Task 1: Stage assets and deploy video

**Files:**
- Copy: `assets/walkthrough.mp4` → `public/walkthrough.mp4`
- Deploy: Vercel production

- [ ] **Step 1: Copy video to public/ for Vercel hosting**

```powershell
Copy-Item assets/walkthrough.mp4 public/walkthrough.mp4
```

Verify with `ls public/` — should now show `walkthrough.mp4` and `mediapipe-pose.html`.

- [ ] **Step 2: Deploy to Vercel**

```powershell
vercel deploy --prod
```

Expected: build log ends with `✅ Production: https://umsic-blond.vercel.app`. ~30-60s.

- [ ] **Step 3: Smoke-test the video URL**

Open `https://umsic-blond.vercel.app/walkthrough.mp4` in a desktop browser. Should play. If 404, deploy didn't pick up the new file — re-run Step 2.

- [ ] **Step 4: Commit the staged copy**

```powershell
git add public/walkthrough.mp4
git commit -m "chore: deploy walkthrough.mp4 to Vercel for in-app WebView playback"
```

---

## Task 2: Create HomeMappingModal component (5-stage state machine)

**Files:**
- Create: `components/dashboard/HomeMappingModal.tsx`

This is the bulk of the work. The component is large but linear — each stage transitions into the next via setTimeout. Building it as one file with one commit because the stages share state and splitting them would force prop-drilling.

- [ ] **Step 1: Create the component file with full implementation**

Create `components/dashboard/HomeMappingModal.tsx` with exactly this content:

```tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  Dimensions,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { WebView } from "react-native-webview";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { X, MapPin, Check } from "lucide-react-native";

const VIDEO_URL = "https://umsic-blond.vercel.app/walkthrough.mp4";
const VIDEO_HTML = `
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}
video{width:100%;height:100%;object-fit:cover}</style></head>
<body><video autoplay muted playsinline src="${VIDEO_URL}"></video></body></html>
`;

type Stage = "recording" | "processing" | "reveal_3d" | "labeling_2d" | "done";

interface Hotspot {
  id: string;
  label: string;
  emoji: string;
  // Position as fraction of the 2D image (0-1)
  x: number;
  y: number;
}

// Hotspot positions tuned to the 2d-floorplan.png (Gemini-generated)
const HOTSPOTS: Hotspot[] = [
  { id: "kitchen", label: "Kitchen", emoji: "🍳", x: 0.27, y: 0.32 },
  { id: "toilet", label: "Toilet", emoji: "🚽", x: 0.43, y: 0.18 },
  { id: "bedroom", label: "Sleep Zone", emoji: "🛏️", x: 0.83, y: 0.34 },
  { id: "door", label: "Main Door", emoji: "🚪", x: 0.13, y: 0.78 },
];

const PROCESSING_STEPS = [
  "Reconstructing geometry...",
  "Identifying surfaces...",
  "Mapping rooms...",
  "Calibrating spatial graph...",
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function HomeMappingModal({ visible, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("recording");
  const [processingIdx, setProcessingIdx] = useState(0);
  const [tappedRooms, setTappedRooms] = useState<Set<string>>(new Set());

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      setStage("recording");
      setProcessingIdx(0);
      setTappedRooms(new Set());
    }
  }, [visible]);

  // Stage transitions
  useEffect(() => {
    if (!visible) return;
    let timer: NodeJS.Timeout;
    if (stage === "recording") {
      timer = setTimeout(() => setStage("processing"), 6000);
    } else if (stage === "processing") {
      timer = setTimeout(() => setStage("reveal_3d"), 4000);
    } else if (stage === "reveal_3d") {
      timer = setTimeout(() => setStage("labeling_2d"), 2500);
    }
    return () => clearTimeout(timer);
  }, [stage, visible]);

  // Cycle processing status text
  useEffect(() => {
    if (stage !== "processing") return;
    const id = setInterval(() => {
      setProcessingIdx((i) => (i + 1) % PROCESSING_STEPS.length);
    }, 900);
    return () => clearInterval(id);
  }, [stage]);

  // Auto-advance to done when all 4 hotspots tapped
  useEffect(() => {
    if (stage === "labeling_2d" && tappedRooms.size === HOTSPOTS.length) {
      const t = setTimeout(() => setStage("done"), 600);
      return () => clearTimeout(t);
    }
  }, [tappedRooms, stage]);

  // Auto-close after done toast
  useEffect(() => {
    if (stage !== "done") return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [stage, onClose]);

  const handleHotspotTap = (id: string) => {
    setTappedRooms((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Stage 1 — Recording */}
        {stage === "recording" && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={StyleSheet.absoluteFill}
          >
            <WebView
              source={{ html: VIDEO_HTML }}
              style={styles.webview}
              originWhitelist={["*"]}
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              scrollEnabled={false}
              bounces={false}
            />
            <RecordingOverlay />
          </Animated.View>
        )}

        {/* Stage 2 — Processing */}
        {stage === "processing" && (
          <ProcessingStage label={PROCESSING_STEPS[processingIdx]} />
        )}

        {/* Stage 3 — Reveal 3D */}
        {stage === "reveal_3d" && <Reveal3D />}

        {/* Stage 4 — Labeling 2D */}
        {stage === "labeling_2d" && (
          <Labeling2D
            tapped={tappedRooms}
            onTap={handleHotspotTap}
          />
        )}

        {/* Stage 5 — Done */}
        {stage === "done" && (
          <DoneToast count={tappedRooms.size} />
        )}

        {/* Persistent close button */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={16}>
          <X size={20} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Recording overlay — REC dot + timer + sweeping scan line  */
/* ────────────────────────────────────────────────────────── */
function RecordingOverlay() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const dot = useSharedValue(1);
  useEffect(() => {
    dot.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value }));

  const ss = String(seconds % 60).padStart(2, "0");
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.recPill}>
          <Animated.View style={[styles.recDot, dotStyle]} />
          <Text style={styles.recText}>RECORDING WALKTHROUGH</Text>
        </View>
        <Text style={styles.timer}>{mm}:{ss}</Text>
      </View>
      {/* Bottom hint */}
      <View style={styles.bottomHint}>
        <Text style={styles.bottomHintText}>
          Walk slowly through each room · Spatial AI is mapping
        </Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────── */
/*  Processing stage — cycling status text */
/* ─────────────────────────────────────── */
function ProcessingStage({ label }: { label: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.7,
    transform: [{ scale: 0.8 + pulse.value * 0.5 }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.processingRoot}
    >
      <View style={styles.processingCenter}>
        <Animated.View style={[styles.pulseRing, ringStyle]} />
        <View style={styles.pulseCore} />
      </View>
      <Text style={styles.processingHeading}>SPATIAL RECONSTRUCTION</Text>
      <Text style={styles.processingLabel}>{label}</Text>
      <View style={styles.progressBar}>
        <View style={styles.progressFill} />
      </View>
    </Animated.View>
  );
}

/* ──────────────────────────── */
/*  Stage 3 — 3D reveal moment  */
/* ──────────────────────────── */
function Reveal3D() {
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(300)}
      style={styles.revealRoot}
    >
      <Image
        source={require("../../assets/3d-floorplan.png")}
        style={styles.floorplanImage}
        resizeMode="contain"
      />
      <View style={styles.revealCheck}>
        <Check size={18} color="#10B981" />
        <Text style={styles.revealCheckText}>Home mapped</Text>
      </View>
      <Text style={styles.revealCaption}>
        4 rooms · 1 entrance · 1 bathroom detected
      </Text>
    </Animated.View>
  );
}

/* ──────────────────────────────────────────── */
/*  Stage 4 — 2D floorplan with tap hotspots    */
/* ──────────────────────────────────────────── */
function Labeling2D({
  tapped,
  onTap,
}: {
  tapped: Set<string>;
  onTap: (id: string) => void;
}) {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const screen = Dimensions.get("window");

  // Compute rendered image dimensions (fit-contain inside screen)
  const layout = (() => {
    if (!imgSize) return { w: screen.width, h: screen.height, ox: 0, oy: 0 };
    const ratio = imgSize.w / imgSize.h;
    const fitW = screen.width;
    const fitH = fitW / ratio;
    const ox = 0;
    const oy = (screen.height - fitH) / 2;
    return { w: fitW, h: fitH, ox, oy };
  })();

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(200)}
      style={styles.labelRoot}
    >
      <Image
        source={require("../../assets/2d-floorplan.png")}
        style={styles.floorplanImage}
        resizeMode="contain"
        onLoad={(e) =>
          setImgSize({
            w: e.nativeEvent.source.width,
            h: e.nativeEvent.source.height,
          })
        }
      />

      {/* Hotspots */}
      {HOTSPOTS.map((h) => {
        const cx = layout.ox + h.x * layout.w;
        const cy = layout.oy + h.y * layout.h;
        const isTapped = tapped.has(h.id);
        return (
          <Pressable
            key={h.id}
            onPress={() => onTap(h.id)}
            style={[
              styles.hotspot,
              { left: cx - 28, top: cy - 28 },
              isTapped && styles.hotspotTapped,
            ]}
          >
            {isTapped ? (
              <View style={styles.hotspotInner}>
                <MapPin size={16} color="#fff" />
                <Text style={styles.hotspotLabel}>
                  {h.emoji} {h.label}
                </Text>
              </View>
            ) : (
              <View style={styles.hotspotPulse} />
            )}
          </Pressable>
        );
      })}

      {/* Top instruction bar */}
      <View style={styles.labelTopBar}>
        <Text style={styles.labelHeading}>IDENTIFY KEY ROOMS</Text>
        <Text style={styles.labelSub}>
          Tap each pulsing dot · {tapped.size}/{HOTSPOTS.length} tagged
        </Text>
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────── */
/*  Stage 5 — Done confirmation */
/* ─────────────────────────── */
function DoneToast({ count }: { count: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.doneRoot}
    >
      <View style={styles.doneCard}>
        <View style={styles.doneIconWrap}>
          <Check size={36} color="#fff" />
        </View>
        <Text style={styles.doneTitle}>Home Mapped</Text>
        <Text style={styles.doneBody}>
          {count} rooms tagged · Behavioral baseline learning
        </Text>
        <Text style={styles.doneFootnote}>
          Anomaly detection active in 7 days
        </Text>
      </View>
    </Animated.View>
  );
}

/* ────────────────────── */
/*       STYLES           */
/* ────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  // Recording overlay
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    marginRight: 8,
  },
  recText: {
    color: "#fff",
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: "DMSans_700Bold",
  },
  timer: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "ui-monospace",
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bottomHint: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  bottomHintText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  // Processing
  processingRoot: {
    flex: 1,
    backgroundColor: "#09090B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  processingCenter: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  pulseCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
  },
  processingHeading: {
    color: "#F59E0B",
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: "DMSans_700Bold",
    marginBottom: 12,
  },
  processingLabel: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    textAlign: "center",
    marginBottom: 32,
  },
  progressBar: {
    width: 200,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F59E0B",
    opacity: 0.6,
  },
  // Reveal 3D
  revealRoot: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  floorplanImage: {
    width: "100%",
    height: "100%",
  },
  revealCheck: {
    position: "absolute",
    top: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  revealCheckText: {
    color: "#10B981",
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  revealCaption: {
    position: "absolute",
    bottom: 80,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  // Label 2D
  labelRoot: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  hotspot: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotPulse: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F59E0B",
    borderWidth: 3,
    borderColor: "rgba(245,158,11,0.4)",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  hotspotTapped: {
    width: "auto",
    height: "auto",
  },
  hotspotInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  hotspotLabel: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    marginLeft: 4,
  },
  labelTopBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 60,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  labelHeading: {
    color: "#F59E0B",
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: "DMSans_700Bold",
  },
  labelSub: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    marginTop: 2,
  },
  // Done
  doneRoot: {
    flex: 1,
    backgroundColor: "#09090B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  doneCard: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  doneIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 8,
  },
  doneBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    textAlign: "center",
    marginBottom: 12,
  },
  doneFootnote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: "DMSans_700Bold",
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Open the file in your IDE — verify no red squiggles. Common issues to check:
- All imports resolve (`X`, `MapPin`, `Check` from `lucide-react-native` — already in package.json)
- `Modal` and `Image` are imported from `react-native`
- `WebView` from `react-native-webview` (already installed)

- [ ] **Step 3: Commit**

```powershell
git add components/dashboard/HomeMappingModal.tsx
git commit -m "feat(dashboard): add HomeMappingModal with 5-stage spatial-AI walkthrough"
```

---

## Task 3: Wire button + modal into Dashboard

**Files:**
- Modify: `App.tsx` (Dashboard component, AppContent component)

- [ ] **Step 1: Add the import to `App.tsx`**

Find the existing imports at the top of `App.tsx` (around line 56):

```tsx
// Vision Engine
import { VisionEngine } from "./components/vision/VisionEngine";
```

Add immediately after:

```tsx
// Home Mapping
import { HomeMappingModal } from "./components/dashboard/HomeMappingModal";
```

- [ ] **Step 2: Add state in `AppContent`**

Find the `AppContent` function (around line 265). At the top of the function body where the existing `useState` hooks are:

```tsx
function AppContent() {
  const [showVisionEngine, setShowVisionEngine] = React.useState(false);
  const [chatVisible, setChatVisible] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [hasFiredInitial, setHasFiredInitial] = React.useState(false);
```

Add a new state line right after:

```tsx
  const [homeMappingVisible, setHomeMappingVisible] = React.useState(false);
```

- [ ] **Step 3: Pass an `onOpenHomeMapping` prop to Dashboard**

In `AppContent`'s JSX, find:

```tsx
        <Dashboard
          onOpenVision={() => setShowVisionEngine(true)}
          onOpenChat={() => setChatVisible(true)}
        />
```

Replace with:

```tsx
        <Dashboard
          onOpenVision={() => setShowVisionEngine(true)}
          onOpenChat={() => setChatVisible(true)}
          onOpenHomeMapping={() => setHomeMappingVisible(true)}
        />
```

- [ ] **Step 4: Render the modal at app root**

Just before the closing `</View>` of `AppContent`, after the existing `<ChatDrawer ... />`:

```tsx
      <HomeMappingModal
        visible={homeMappingVisible}
        onClose={() => setHomeMappingVisible(false)}
      />
```

- [ ] **Step 5: Update DashboardProps interface**

Find the existing interface (around line 66):

```tsx
interface DashboardProps {
  onOpenVision: () => void;
  onOpenChat: () => void;
}
```

Replace with:

```tsx
interface DashboardProps {
  onOpenVision: () => void;
  onOpenChat: () => void;
  onOpenHomeMapping: () => void;
}
```

- [ ] **Step 6: Destructure the new prop in Dashboard**

Find:

```tsx
function Dashboard({ onOpenVision, onOpenChat }: DashboardProps) {
```

Replace with:

```tsx
function Dashboard({ onOpenVision, onOpenChat, onOpenHomeMapping }: DashboardProps) {
```

- [ ] **Step 7: Add the "Map My Home" button below the existing Vision Engine button**

Find the existing `<Button>` for "Open Vision Engine" (around line 235-250):

```tsx
          {/* Vision Engine Button - Opens Fall Detection */}
          <Button
            className="mt-4 h-16 w-full rounded-3xl bg-safe/10 border border-safe/30 flex-row items-center justify-center"
            onPress={onOpenVision}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-safe/20">
              <Eye size={22} color="#10B981" />
            </View>
            <View>
              <Text className="font-sans font-bold text-safe">
                Open Vision Engine
              </Text>
              <Text className="font-sans text-xs text-stone-500">
                Fall Detection & Monitoring
              </Text>
            </View>
          </Button>
```

Add this immediately after, before the closing `</View>` of the medications section:

```tsx
          {/* Home Mapping Button - Opens spatial AI walkthrough */}
          <Button
            className="mt-3 h-16 w-full rounded-3xl bg-primary/10 border border-primary/30 flex-row items-center justify-center"
            onPress={onOpenHomeMapping}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <MapPin size={22} color="#F59E0B" />
            </View>
            <View>
              <Text className="font-sans font-bold text-primary">
                Map My Home
              </Text>
              <Text className="font-sans text-xs text-stone-500">
                Spatial AI · Behavioral Baseline
              </Text>
            </View>
          </Button>
```

- [ ] **Step 8: Add `MapPin` to the lucide imports in `App.tsx`**

Find the lucide import block (around line 22-32):

```tsx
import {
  ShieldAlert,
  Sparkles,
  Activity,
  Eye,
  Video,
  User,
  Siren,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
```

Add `MapPin` to the list:

```tsx
import {
  ShieldAlert,
  Sparkles,
  Activity,
  Eye,
  Video,
  User,
  Siren,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react-native";
```

- [ ] **Step 9: Commit**

```powershell
git add App.tsx
git commit -m "feat(dashboard): wire Map My Home button + modal into root"
```

---

## Task 4: End-to-end verification

**Files:** none (test only)

- [ ] **Step 1: Reload app on demo phone**

In Metro terminal, press `r` to reload. Or shake-gesture on the phone → Reload.

- [ ] **Step 2: Verify dashboard renders the new button**

Expected: below "Open Vision Engine" there's a new amber-tinted button "Map My Home / Spatial AI · Behavioral Baseline" with a MapPin icon.

- [ ] **Step 3: Tap the button and walk through all 5 stages**

Expected sequence:
1. **Recording (6s)** — your walkthrough video plays fullscreen, top-left shows a pulsing red dot + "RECORDING WALKTHROUGH" pill, top-right shows `00:00` → `00:06` timer, bottom shows hint text
2. **Processing (4s)** — black screen, amber pulse ring, "SPATIAL RECONSTRUCTION" heading, status text cycles through 4 messages
3. **3D reveal (2.5s)** — 3D isometric floorplan fades in, top shows "✓ Home mapped" pill, bottom shows "4 rooms · 1 entrance · 1 bathroom detected"
4. **Labeling 2D** — cross-fades to 2D floorplan, 4 amber pulsing dots over Kitchen / Toilet / Sleep Zone / Main Door positions, top shows "IDENTIFY KEY ROOMS · Tap each pulsing dot · 0/4 tagged"
5. Tap each dot → it transforms into a green pill with emoji + label
6. After all 4 tapped → 0.6s delay → **Done** card appears with check icon, "Home Mapped", "4 rooms tagged", auto-closes after 2.2s

- [ ] **Step 4: Sanity-check hotspot positions**

If a hotspot dot lands on the wrong room (e.g., the toilet pin sits on the kitchen), edit the `HOTSPOTS` array in `HomeMappingModal.tsx` — adjust `x` and `y` (both are 0-1 fractions of the rendered image). Common adjustments:
- Image is wider than tall → x positions accurate, y may need tuning
- The 2D image has whitespace at top/bottom → letterboxing handled automatically by `layout` calc

- [ ] **Step 5: Verify nothing else broke**

Quick smoke tests:
- Tap "Open Vision Engine" — pose detection still works, fall simulation button still triggers Convex flip
- Tap the AI Sparkles FAB — chat drawer still opens, ILMU still responds
- Resolve a fall — dashboard returns to Safe

- [ ] **Step 6: Final commit if any hotspot tweaks were made**

```powershell
git add components/dashboard/HomeMappingModal.tsx
git commit -m "tweak(home-mapping): adjust hotspot positions to match 2D floorplan"
```

(Skip this step if no tweaks were needed.)

---

## Rollback Plan

```powershell
git revert HEAD~3..HEAD --no-edit   # undoes Tasks 1-3
```

The Vercel-hosted video stays up but is harmless — nothing references it after revert. Existing fall detection is untouched throughout.

---

## Self-Review Checklist

- [x] **Spec coverage:** Map My Home button ✓, 5-stage modal ✓, real video plays ✓, 3D reveal ✓, 2D tap-to-label ✓, 4 hotspots (Kitchen/Toilet/Bedroom/Door) ✓, local state only ✓, behavioral-baseline copy ✓
- [x] **No placeholders** — full component code, all state transitions concrete, hotspot coords specified
- [x] **Type consistency** — `Stage`, `Hotspot`, `Props` all defined; `tappedRooms` is `Set<string>`; matches `onTap(id: string)`
- [x] **No touched-zone violations** — VisionEngine, mediapipe-html, Convex all untouched
- [x] **Verification doesn't depend on a real fall**
- [x] **Rollback path is clean**
