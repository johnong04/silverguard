# Skeleton Restyle + Fall Detection Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current jade-green amateurish skeleton overlay with a TouchDesigner-style technical readout aesthetic (red dot landmarks, thin neon-green connectors, faint grid backdrop, corner coordinate readout) and add a torso-orientation check to the fall detector for fewer false negatives — all without breaking the working pose detection or fall-trigger pipeline.

**Architecture:** Single feature, two-file change. The MediaPipe HTML lives in two synced copies: `components/vision/mediapipe-html.ts` (iOS, inline) and `public/mediapipe-pose.html` (Android, served from Vercel at `https://umsic-blond.vercel.app/mediapipe-pose.html`). Both must be edited and the Vercel page redeployed for Android changes to land. Visual changes are pure canvas styling; fall-detection change adds one extra heuristic without removing existing ones, so the working logic is preserved as a fallback.

**Tech Stack:** HTML5 Canvas 2D API, MediaPipe Pose Landmarker v0.10.21 (33-point landmark output), Vercel CLI for redeploy.

**Verification approach:** Strict TDD doesn't fit (canvas inside a WebView inside a hosted page is not unit-testable in this repo). Instead each task has an explicit **manual verification step** using the existing in-app **Emergency button (simulation trigger)** which fires the same `triggerFallResponse()` path as a real fall. Visual changes are eyeball-verified against the reference screenshot.

**Time budget:** ~45 minutes total. Tasks 1-3 can land iteratively (commit after each); Task 4 is the redeploy gate before testing on Android.

---

## File Structure

| File | Responsibility | Change scope |
|------|---------------|--------------|
| `components/vision/mediapipe-html.ts` | iOS source-of-truth HTML string | Update `drawSkeleton()`, `checkFall()`, add grid + readout |
| `public/mediapipe-pose.html` | Android Vercel-hosted copy | Same diff as above, applied verbatim |
| `components/vision/VisionEngine.tsx` | RN host (camera permission, WebView, overlay) | **DO NOT TOUCH** — proven working |
| `convex/events.ts` | `logFall` / `logResolution` mutations | **DO NOT TOUCH** |

**Critical constraint:** The two HTML copies MUST stay byte-identical inside the `<script type="module">` block. Any drift between them = Android and iOS behave differently.

---

## Task 1: New visual aesthetic — red dots, neon-green lines, grid backdrop

**Files:**
- Modify: `components/vision/mediapipe-html.ts:147-150` (color constants), `:330-368` (drawSkeleton function)

- [ ] **Step 1: Replace the color palette constants**

Find `components/vision/mediapipe-html.ts:147-150`:

```javascript
    // Colors matching the Warm Ember theme
    const JADE_GREEN = '#10B981';
    const JADE_GREEN_LIGHT = 'rgba(16, 185, 129, 0.6)';
    const AMBER = '#F59E0B';
```

Replace with:

```javascript
    // Skeleton aesthetic — TouchDesigner-style technical readout
    const NODE_RED = '#FF2A4A';            // primary landmark dot
    const NODE_RED_GLOW = 'rgba(255, 42, 74, 0.45)';
    const LINE_GREEN = '#00FF94';          // neon connector line
    const LINE_GREEN_GLOW = 'rgba(0, 255, 148, 0.35)';
    const GRID_LINE = 'rgba(0, 255, 148, 0.06)'; // faint backdrop grid
    const READOUT_TEXT = '#00FF94';
    const AMBER = '#F59E0B';               // kept for status/error compatibility
```

- [ ] **Step 2: Replace `drawSkeleton(landmarks)` entirely**

Find `components/vision/mediapipe-html.ts:330-368`. Replace the whole function with:

```javascript
    function drawGrid() {
      const w = canvas.width;
      const h = canvas.height;
      const step = 40;
      ctx.save();
      ctx.strokeStyle = GRID_LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawSkeleton(landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      if (!landmarks || landmarks.length === 0) return;

      // Pass 1 — connectors with green glow
      ctx.save();
      ctx.shadowColor = LINE_GREEN_GLOW;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = LINE_GREEN;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Pass 2 — red landmark dots with halo
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if (!lm || lm.visibility <= 0.5) continue;
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;

        // Outer halo
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, 2 * Math.PI);
        ctx.fillStyle = NODE_RED_GLOW;
        ctx.fill();

        // Solid red core
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = NODE_RED;
        ctx.fill();
      }
    }
```

- [ ] **Step 3: Mirror the same change into `public/mediapipe-pose.html`**

Open `public/mediapipe-pose.html`, find the matching `JADE_GREEN` constants block and `drawSkeleton` function (same line range, ~30 lines earlier due to no template wrapping), and apply Steps 1+2 identically. The two files must stay in sync.

- [ ] **Step 4: Manual visual verification (defer until after Task 4 deploy)**

Cannot verify on-device until the Vercel page redeploys. iOS could verify locally now, but the demo phone is Android per screenshots — proceed to next task and defer all visual checks to Task 5.

- [ ] **Step 5: Commit**

```powershell
git add components/vision/mediapipe-html.ts public/mediapipe-pose.html
git commit -m "feat(vision): restyle skeleton overlay to red-dot/neon-green TouchDesigner aesthetic"
```

---

## Task 2: Corner coordinate readout (technical readout aesthetic)

Adds a small "TRACKING · 33 POINTS · 0.42, 0.71" readout in the top-left corner that updates each frame, plus a "FALL CONFIDENCE" bar that pulses when the fall heuristic is close to triggering. Sells the "real spatial AI" pitch in static screenshots.

**Files:**
- Modify: `components/vision/mediapipe-html.ts` (drawSkeleton + new drawReadout function), `public/mediapipe-pose.html` (mirror)

- [ ] **Step 1: Add `drawReadout()` helper above `drawSkeleton`**

Insert immediately after the `drawGrid()` function in `components/vision/mediapipe-html.ts`:

```javascript
    function drawReadout(landmarks, centroidY) {
      ctx.save();
      // Counter-mirror so text is readable (canvas is scaleX(-1) at parent level)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.font = '11px ui-monospace, "SF Mono", "Roboto Mono", monospace';
      ctx.fillStyle = READOUT_TEXT;
      ctx.textBaseline = 'top';

      const visibleCount = landmarks.filter(l => l && l.visibility > 0.5).length;
      const lines = [
        'TRACKING ACTIVE',
        'POINTS  ' + visibleCount + '/33',
        'CENTROID Y  ' + (centroidY != null ? centroidY.toFixed(3) : '----'),
        'COOLDOWN  ' + (fallCooldown ? 'LOCKED' : 'OPEN'),
      ];
      let yy = 16;
      for (const line of lines) {
        ctx.fillText(line, 16, yy);
        yy += 14;
      }
      ctx.restore();
    }
```

- [ ] **Step 2: Wire `drawReadout` into the render loop**

In the same file find `detectPose()` around line 383-388. Replace the lines:

```javascript
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          drawSkeleton(landmarks);
          checkFall(landmarks);
```

with:

```javascript
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          drawSkeleton(landmarks);
          const centroidY = checkFall(landmarks);
          drawReadout(landmarks, centroidY);
```

- [ ] **Step 3: Update `checkFall` to return the centroid Y so the readout can display it**

Find `checkFall(landmarks)` function. At the very end before `}`, replace:

```javascript
      previousCentroid = { ...centroid };
      previousTime = now;
    }
```

with:

```javascript
      previousCentroid = { ...centroid };
      previousTime = now;
      return centroid.y;
    }
```

Also add `return null;` at every existing early-`return` inside `checkFall` (the four spots that currently say bare `return;` or `return;` after `triggerFall`). Concretely:

```javascript
      if (fallCooldown) return null;
      ...
      if (!shoulders || !hips || !nose || !ankles) return null;
      ...
      if (!centroid) return null;
      ...
      if (nose.y > ankles.y + 0.1 && nose.visibility > 0.7 && ankles.visibility > 0.5) {
        triggerFall('nose_below_ankles');
        return null;
      }
      ...
        if (deltaY > 0.30 && deltaTime < 400 && deltaTime > 50) {
          triggerFall('rapid_drop');
          return null;
        }
```

- [ ] **Step 4: Mirror identical changes into `public/mediapipe-pose.html`**

Apply Steps 1-3 verbatim in the public HTML file.

- [ ] **Step 5: Commit**

```powershell
git add components/vision/mediapipe-html.ts public/mediapipe-pose.html
git commit -m "feat(vision): add corner readout panel showing tracking state + centroid Y"
```

---

## Task 3: Add torso-orientation fall heuristic

The existing detector requires `nose.y > ankles.y + 0.1` (head fully below ankles — only fires when person is supine and fully in frame) OR a 30% centroid drop in <400ms (only fires for hard falls). Real-world falls where someone collapses sideways against furniture or where ankles aren't visible currently miss. We add a third heuristic: when the torso vector (shoulders → hips) is more horizontal than vertical AND has been so for >700ms, flag a fall. This catches sustained "lying down" or "slumped" states.

**Files:**
- Modify: `components/vision/mediapipe-html.ts` (state vars + `checkFall`), `public/mediapipe-pose.html` (mirror)

- [ ] **Step 1: Add new state variables**

Find `components/vision/mediapipe-html.ts:157-161`:

```javascript
    // Fall detection state
    let previousCentroid = null;
    let previousTime = null;
    let fallCooldown = false;
    const FALL_COOLDOWN_MS = 5000;
```

Replace with:

```javascript
    // Fall detection state
    let previousCentroid = null;
    let previousTime = null;
    let fallCooldown = false;
    const FALL_COOLDOWN_MS = 5000;

    // Torso-horizontal sustained state
    let horizontalSince = null;       // timestamp when torso first went horizontal
    const HORIZONTAL_SUSTAIN_MS = 700; // must stay horizontal this long to fire
    const HORIZONTAL_RATIO = 1.2;      // |dx| > 1.2 * |dy|  ->  torso more horizontal than vertical
```

- [ ] **Step 2: Add the orientation check inside `checkFall`**

Find inside `checkFall`, immediately before the line that currently reads:

```javascript
      if (previousCentroid && previousTime) {
```

Insert this block:

```javascript
      // Heuristic 3: torso orientation — fires if torso has been horizontal >700ms
      const dxTorso = Math.abs(shoulders.x - hips.x);
      const dyTorso = Math.abs(shoulders.y - hips.y);
      const torsoHorizontal =
        shoulders.visibility > 0.6 &&
        hips.visibility > 0.6 &&
        dxTorso > HORIZONTAL_RATIO * dyTorso;

      if (torsoHorizontal) {
        if (horizontalSince === null) horizontalSince = now;
        if (now - horizontalSince > HORIZONTAL_SUSTAIN_MS) {
          triggerFall('torso_horizontal');
          horizontalSince = null;
          return null;
        }
      } else {
        horizontalSince = null;
      }

```

- [ ] **Step 3: Mirror into `public/mediapipe-pose.html`**

Apply Steps 1-2 verbatim.

- [ ] **Step 4: Manual logic sanity check (5-line read-through)**

Read through `checkFall` top-to-bottom in the .ts file. Verify:
- All four bare `return;` statements were converted to `return null;` in Task 2 Step 3
- The new orientation block is placed BEFORE the existing centroid-velocity block
- `horizontalSince` is reset to `null` whenever the torso is upright (the `else` branch)
- A fired `triggerFall('torso_horizontal')` resets `horizontalSince` so it doesn't re-fire mid-cooldown

If any of these are off, fix in place.

- [ ] **Step 5: Commit**

```powershell
git add components/vision/mediapipe-html.ts public/mediapipe-pose.html
git commit -m "feat(vision): add torso-horizontal heuristic to fall detection"
```

---

## Task 4: Deploy hosted HTML to Vercel

Android reads from `https://umsic-blond.vercel.app/mediapipe-pose.html`. iOS reads from the inline `MEDIAPIPE_HTML` string. Without redeploy, Android sees no changes.

**Files:** none (deployment only)

- [ ] **Step 1: Confirm Vercel CLI is linked to the project**

```powershell
vercel whoami
```

Expected: prints the username. If it errors with "not authenticated," run `vercel login` first.

- [ ] **Step 2: Deploy to production**

```powershell
vercel deploy --prod
```

Expected: prints a build log ending with `https://umsic-blond.vercel.app` and "Production: …". Takes ~30–60s.

- [ ] **Step 3: Smoke-test the deployed page in a desktop browser**

Open `https://umsic-blond.vercel.app/mediapipe-pose.html` in Chrome. Grant camera permission. Expected:
- Black background with faint green grid
- Red dots on your joints, thin green lines between them
- Top-left corner shows `TRACKING ACTIVE / POINTS 33/33 / CENTROID Y 0.5xx / COOLDOWN OPEN`

If the page errors or renders the old jade-green skeleton, the deploy didn't pick up the new file — check `public/mediapipe-pose.html` was saved and re-run `vercel deploy --prod`.

- [ ] **Step 4: No commit needed** (deploy is a side effect)

---

## Task 5: End-to-end verification on the demo phone

**Files:** none (verification only)

- [ ] **Step 1: Force-reload the WebView**

In the running SilverGuard app on your Android phone, back out to Dashboard, then tap "Open Vision Engine" again. WebView caches aggressively; if you still see the old jade skeleton, fully kill the app from recents and re-launch.

- [ ] **Step 2: Confirm the new aesthetic renders**

Expected on screen:
- Faint green grid behind the camera feed
- Red dots at every visible joint
- Thin neon-green connectors with subtle glow
- Top-left readout updating in real time

If the grid is too dim or too bright, edit `GRID_LINE`'s alpha (currently `0.06`) — lower for subtler, higher for more pronounced. Re-deploy.

- [ ] **Step 3: Verify pose detection still works**

Stand in frame, raise an arm, walk side-to-side. Skeleton should track smoothly. If skeleton fails to render or freezes, the canvas changes broke something — `git diff` against `main` and revert the Pass-1/Pass-2 split if needed.

- [ ] **Step 4: Verify fall detection still fires**

Tap the red **Hantar Kecemasan** button. Expected:
- Strobe red overlay
- ElevenLabs voice starts speaking
- Dashboard (visible if you split-screen) flips to `fall_detected`
- Button text changes to `Auntie Okay Dah` mode

This path goes through `triggerFallResponse('manual_simulation')` in `VisionEngine.tsx` — bypasses the canvas detection entirely, so it's the authoritative test that the response pipeline still works.

- [ ] **Step 5: Verify the new torso heuristic** (optional, only if time)

Lie down on a couch in front of the camera with shoulders + hips visible. Within ~1 second of being horizontal, fall should trigger with reason `torso_horizontal`. If it doesn't, check the readout — `POINTS X/33` should be ≥10 and centroid Y should be > 0.5. If not, MediaPipe lost the body; reposition.

- [ ] **Step 6: Resolve and reset for clean recording**

Tap **Auntie Okay Dah** to clear the fall state. Confirm dashboard goes back to Safe.

---

## Rollback Plan

If anything breaks during the demo and there's no time to debug:

```powershell
git revert HEAD~3..HEAD --no-edit   # undoes Tasks 1-3 commits
vercel deploy --prod                 # restores old jade skeleton
```

The simulation trigger (Emergency button) will continue to work regardless — it doesn't depend on canvas rendering.

---

## Self-Review Checklist

- [x] Spec coverage: skeleton restyle ✓, technical readout aesthetic ✓, improved fall detection ✓, fall detection still works ✓
- [x] No placeholders — all code blocks contain literal code, all paths are absolute
- [x] Type consistency — `checkFall` now returns `number | null`; all four early returns + new orientation block return `null`; readout handles `null` centroidY
- [x] Two-file sync explicitly called out in every task
- [x] Verification doesn't depend on a real fall (uses simulation button)
- [x] Rollback path documented
