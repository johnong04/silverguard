import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Text,
  ActivityIndicator,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useMutation } from "convex/react";
import { Camera } from "expo-camera";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { MEDIAPIPE_HTML, MEDIAPIPE_HOSTED_URL } from "./mediapipe-html";
import { StatusHeader } from "./StatusHeader";
import { TranscriptionOverlay } from "./TranscriptionOverlay";
import { EmergencyButton } from "./EmergencyButton";

// Use hosted URL on Android (WebView doesn't support getUserMedia for local HTML)
const USE_HOSTED_MEDIAPIPE = Platform.OS === "android";

interface VisionEngineProps {
  onClose: () => void;
  userId: Id<"users">;
}

interface WebViewMessage {
  type: "READY" | "FALL_DETECTED" | "ERROR";
  reason?: string;
  timestamp?: number;
  confidence?: number;
  message?: string;
}

export function VisionEngine({ onClose, userId }: VisionEngineProps) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Convex mutation for logging falls
  const logFall = useMutation(api.events.logFall);

  // Request camera permission before loading WebView
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(status === "granted");
        if (status !== "granted") {
          setPermissionError(
            "Camera permission is required for fall detection."
          );
        }
      } catch (err) {
        setPermissionError("Failed to request camera permission.");
        setCameraPermission(false);
      }
    })();
  }, []);

  const handleWebViewMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const data: WebViewMessage = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "READY":
            setIsReady(true);
            break;

          case "FALL_DETECTED":
            if (!fallDetected) {
              setFallDetected(true);

              // Log fall to Convex
              await logFall({
                userId,
                metadata: {
                  source: "vision_engine",
                  reason: data.reason,
                  confidence: data.confidence,
                  timestamp: data.timestamp,
                },
              });

              // Show transcription (simulating voice response)
              setTranscription(
                "Auntie, okay tak? I detected a fall. Help is on the way!"
              );
              setIsSpeaking(true);

              // Reset after cooldown
              setTimeout(() => {
                setFallDetected(false);
                setIsSpeaking(false);
                setTranscription("");
              }, 5000);
            }
            break;

          case "ERROR":
            console.error("VisionEngine error:", data.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebView message:", err);
      }
    },
    [fallDetected, logFall, userId]
  );

  const handleEmergencyPress = useCallback(async () => {
    // Log manual emergency trigger
    await logFall({
      userId,
      metadata: {
        source: "manual_emergency",
        timestamp: Date.now(),
      },
    });

    // Show emergency response
    setTranscription(
      "Kecemasan dihantar! Emergency services have been notified."
    );
    setIsSpeaking(true);

    setTimeout(() => {
      setIsSpeaking(false);
      setTranscription("");
    }, 5000);
  }, [logFall, userId]);

  // Show loading state while checking permissions
  if (cameraPermission === null) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Requesting camera access...</Text>
        </View>
        <StatusHeader onBack={onClose} isActive={false} />
      </Animated.View>
    );
  }

  // Show error state if permission denied
  if (!cameraPermission || permissionError) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorText}>
            {permissionError ||
              "Please grant camera permission to use fall detection."}
          </Text>
        </View>
        <StatusHeader onBack={onClose} isActive={false} />
        <EmergencyButton onPress={handleEmergencyPress} disabled={false} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      {/* Base Layer: WebView with MediaPipe */}
      <WebView
        ref={webViewRef}
        source={
          USE_HOSTED_MEDIAPIPE && MEDIAPIPE_HOSTED_URL
            ? { uri: MEDIAPIPE_HOSTED_URL }
            : { html: MEDIAPIPE_HTML }
        }
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        onMessage={handleWebViewMessage}
        // Android-specific permissions and settings
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        androidLayerType="hardware"
        allowsProtectedMedia={true}
        // iOS-specific
        allowsBackForwardNavigationGestures={false}
        mediaCapturePermissionGrantType="grant"
        // Performance
        cacheEnabled={true}
        incognito={false}
        // Debugging
        webviewDebuggingEnabled={__DEV__}
        // Error handling
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView HTTP error:", nativeEvent.statusCode);
        }}
      />

      {/* Top Layer: React Native Overlay UI */}
      <StatusHeader onBack={onClose} isActive={isReady} />

      {/* Transcription Overlay (Twitch-style captions) */}
      <TranscriptionOverlay
        text={transcription}
        isVisible={!!transcription}
        isSpeaking={isSpeaking}
      />

      {/* Fall Alert Indicator */}
      {fallDetected && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.fallAlert}
        >
          <View className="absolute inset-0 bg-destructive/20 border-4 border-destructive animate-strobe" />
        </Animated.View>
      )}

      {/* Emergency Button */}
      <EmergencyButton onPress={handleEmergencyPress} disabled={fallDetected} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fallAlert: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    pointerEvents: "none",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    color: "#A8A29E",
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
  },
  errorTitle: {
    color: "#DC2626",
    fontSize: 24,
    fontFamily: "DMSerifDisplay_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  errorText: {
    color: "#A8A29E",
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
});
