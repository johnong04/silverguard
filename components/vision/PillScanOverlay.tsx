import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
} from "react-native-reanimated";
import { Pill, CheckCircle2 } from "lucide-react-native";

const NEON_GREEN = "#00FF94";
const NEON_GREEN_DIM = "rgba(0, 255, 148, 0.35)";
const AMBER = "#F59E0B";
const SCAN_AMBER = "rgba(245, 158, 11, 0.9)";

export type PillScanPhase = "scanning" | "verified" | "ingested";

interface PillScanOverlayProps {
  visible: boolean;
  x: number;
  y: number;
  onIngested: () => void;
  onComplete: () => void;
}

const BOX_W = 180;
const BOX_H = 230;

export function PillScanOverlay({
  visible,
  x,
  y,
  onIngested,
  onComplete,
}: PillScanOverlayProps) {
  const [phase, setPhase] = useState<PillScanPhase>("scanning");
  const [confidence, setConfidence] = useState(0);

  const scanY = useSharedValue(0);
  const bracketGlow = useSharedValue(0.4);

  useEffect(() => {
    if (!visible) return;

    setPhase("scanning");
    setConfidence(0);

    scanY.value = 0;
    scanY.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    bracketGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      ),
      -1,
      true
    );

    // Confidence ramp 0 -> 98.4 over ~1.1s
    const start = Date.now();
    const target = 98.4;
    const interval = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1100);
      setConfidence(target * (1 - Math.pow(1 - t, 2)));
      if (t >= 1) clearInterval(interval);
    }, 40);

    const verifiedTimer = setTimeout(() => {
      setPhase("verified");
    }, 1200);

    const ingestedTimer = setTimeout(() => {
      setPhase("ingested");
      onIngested();
    }, 2700);

    const fadeTimer = setTimeout(() => {
      onComplete();
    }, 4400);

    return () => {
      clearInterval(interval);
      clearTimeout(verifiedTimer);
      clearTimeout(ingestedTimer);
      clearTimeout(fadeTimer);
    };
  }, [visible]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: scanY.value * (BOX_H - 4),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: bracketGlow.value,
  }));

  if (!visible) return null;

  const left = Math.max(12, Math.min(x - BOX_W / 2, 9999));
  const top = Math.max(80, y - BOX_H / 2);

  const borderColor =
    phase === "scanning" ? AMBER : phase === "verified" ? NEON_GREEN : NEON_GREEN;
  const labelColor = phase === "scanning" ? AMBER : NEON_GREEN;

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(280)}
      style={[styles.root, { left, top }]}
    >
      {/* Bracket frame */}
      <View style={[styles.box, { borderColor: "transparent" }]}>
        {/* Corner brackets */}
        <Corner pos="tl" color={borderColor} />
        <Corner pos="tr" color={borderColor} />
        <Corner pos="bl" color={borderColor} />
        <Corner pos="br" color={borderColor} />

        {/* Glow border */}
        <Animated.View
          style={[
            styles.glowBorder,
            { borderColor },
            glowStyle,
          ]}
        />

        {/* Scan line (only during scanning) */}
        {phase === "scanning" && (
          <Animated.View
            style={[styles.scanLine, scanLineStyle]}
          />
        )}

        {/* Center crosshair */}
        <View style={styles.crosshair}>
          <View style={[styles.crossH, { backgroundColor: borderColor }]} />
          <View style={[styles.crossV, { backgroundColor: borderColor }]} />
        </View>

        {/* Top-left readout */}
        <View style={styles.readoutTop}>
          <Text style={[styles.readoutText, { color: labelColor }]}>
            {phase === "scanning"
              ? "ANALYZING..."
              : phase === "verified"
              ? "MATCH FOUND"
              : "INGESTED"}
          </Text>
          <Text style={[styles.readoutTextDim, { color: labelColor }]}>
            CONF  {confidence.toFixed(1)}%
          </Text>
        </View>

        {/* Top-right ID */}
        <View style={styles.readoutTopRight}>
          <Text style={[styles.readoutTextDim, { color: labelColor }]}>
            #ASA-325
          </Text>
        </View>

        {/* Bottom-left coords */}
        <View style={styles.readoutBottom}>
          <Text style={[styles.readoutTextDim, { color: labelColor }]}>
            X{Math.round(x)}  Y{Math.round(y)}
          </Text>
        </View>
      </View>

      {/* Label below bbox */}
      <View
        style={[
          styles.labelPill,
          {
            backgroundColor: phase === "scanning" ? "rgba(0,0,0,0.85)" : "rgba(0, 40, 24, 0.9)",
            borderColor: labelColor,
          },
        ]}
      >
        {phase === "scanning" ? (
          <>
            <Pill size={14} color={AMBER} />
            <Text style={[styles.labelMain, { color: AMBER }]}>
              SCANNING OBJECT
            </Text>
          </>
        ) : phase === "verified" ? (
          <View>
            <View style={styles.labelRow}>
              <Pill size={14} color={NEON_GREEN} />
              <Text style={[styles.labelMain, { color: NEON_GREEN }]}>
                ASPIRIN — Verified
              </Text>
            </View>
            <Text style={styles.labelSub}>09:00 AM dose · 100mg</Text>
          </View>
        ) : (
          <View>
            <View style={styles.labelRow}>
              <CheckCircle2 size={14} color={NEON_GREEN} />
              <Text style={[styles.labelMain, { color: NEON_GREEN }]}>
                INGESTED · LOGGED
              </Text>
            </View>
            <Text style={styles.labelSub}>Dose recorded · Auntie Rose</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function Corner({
  pos,
  color,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const size = 18;
  const thick = 2;
  const base: any = { position: "absolute", width: size, height: size };
  if (pos === "tl") {
    base.top = -1;
    base.left = -1;
    base.borderTopWidth = thick;
    base.borderLeftWidth = thick;
  } else if (pos === "tr") {
    base.top = -1;
    base.right = -1;
    base.borderTopWidth = thick;
    base.borderRightWidth = thick;
  } else if (pos === "bl") {
    base.bottom = -1;
    base.left = -1;
    base.borderBottomWidth = thick;
    base.borderLeftWidth = thick;
  } else {
    base.bottom = -1;
    base.right = -1;
    base.borderBottomWidth = thick;
    base.borderRightWidth = thick;
  }
  base.borderColor = color;
  return <View style={base} />;
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    width: BOX_W,
    zIndex: 35,
  },
  box: {
    width: BOX_W,
    height: BOX_H,
    position: "relative",
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 2,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: SCAN_AMBER,
    shadowColor: AMBER,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  crosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
  },
  crossH: {
    position: "absolute",
    top: 9,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  crossV: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.7,
  },
  readoutTop: {
    position: "absolute",
    top: 6,
    left: 8,
  },
  readoutTopRight: {
    position: "absolute",
    top: 6,
    right: 8,
  },
  readoutBottom: {
    position: "absolute",
    bottom: 6,
    left: 8,
  },
  readoutText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.2,
  },
  readoutTextDim: {
    fontFamily: "DMSans_400Regular",
    fontSize: 9,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  labelPill: {
    marginTop: 8,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: BOX_W,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelMain: {
    fontFamily: "DMSans_700Bold",
    fontSize: 12,
    letterSpacing: 1.1,
    marginLeft: 6,
  },
  labelSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "#A8A29E",
    marginTop: 2,
    letterSpacing: 0.6,
  },
});
