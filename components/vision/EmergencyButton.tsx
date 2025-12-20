import React from "react";
import { View, Text, Pressable, Vibration } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import { Siren } from "lucide-react-native";

interface EmergencyButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function EmergencyButton({
  onPress,
  disabled = false,
}: EmergencyButtonProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    glow.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glow.value = withTiming(0, { duration: 300 });
  };

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback pattern: SOS
    Vibration.vibrate([0, 100, 100, 100, 100, 100, 200, 300, 200, 300, 200, 300]);

    // Pulse animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1.05, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );

    onPress();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.1 }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(400)}
      className="absolute bottom-8 left-6 right-6 z-50"
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View style={buttonStyle} className="relative">
          {/* Glow effect behind button */}
          <Animated.View
            style={glowStyle}
            className="absolute inset-0 rounded-3xl bg-destructive"
          />

          {/* Main button */}
          <View
            className={`
              flex-row items-center justify-center 
              h-16 rounded-3xl 
              bg-destructive border-2 border-destructive/50
              shadow-2xl shadow-destructive/40
              ${disabled ? "opacity-50" : ""}
            `}
          >
            {/* Icon container */}
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3">
              <Siren size={22} color="white" />
            </View>

            {/* Text */}
            <View>
              <Text className="font-serif text-lg text-white">
                Hantar Kecemasan
              </Text>
              <Text className="font-sans text-xs text-white/70 uppercase tracking-wider">
                Send Emergency Alert
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

