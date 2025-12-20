import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
import { Volume2 } from "lucide-react-native";

interface TranscriptionOverlayProps {
  text?: string;
  isVisible?: boolean;
  isSpeaking?: boolean;
}

export function TranscriptionOverlay({
  text = "",
  isVisible = false,
  isSpeaking = false,
}: TranscriptionOverlayProps) {
  const opacity = useSharedValue(0);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (isVisible && text) {
      setDisplayText(text);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withDelay(2000, withTiming(0, { duration: 500 }));
    }
  }, [isVisible, text]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!displayText && !isVisible) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(200)}
      exiting={FadeOut.duration(300)}
      style={containerStyle}
      className="absolute bottom-32 left-4 right-4 z-40"
    >
      {/* Twitch/Instagram Live style caption box */}
      <View className="bg-black/70 rounded-2xl px-5 py-4 border border-white/10">
        {/* Speaker indicator */}
        {isSpeaking && (
          <View className="flex-row items-center mb-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/20 mr-2">
              <Volume2 size={14} color="#F59E0B" />
            </View>
            <Text className="font-sans text-xs font-bold uppercase tracking-wider text-primary">
              SilverGuard Speaking
            </Text>
            <View className="flex-row ml-2">
              {/* Animated dots */}
              <SpeakingDots />
            </View>
          </View>
        )}

        {/* Transcription text */}
        <Text className="font-sans text-base text-white leading-6">
          {displayText}
        </Text>
      </View>
    </Animated.View>
  );
}

// Animated speaking dots component
function SpeakingDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withTiming(1, { duration: 300 }, () => {
          value.value = withTiming(0.3, { duration: 300 });
        })
      );
    };

    const interval = setInterval(() => {
      animateDot(dot1, 0);
      animateDot(dot2, 150);
      animateDot(dot3, 300);
    }, 900);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View className="flex-row items-center space-x-1">
      <Animated.View
        style={dot1Style}
        className="h-1.5 w-1.5 rounded-full bg-primary"
      />
      <Animated.View
        style={dot2Style}
        className="h-1.5 w-1.5 rounded-full bg-primary ml-1"
      />
      <Animated.View
        style={dot3Style}
        className="h-1.5 w-1.5 rounded-full bg-primary ml-1"
      />
    </View>
  );
}

