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
import { Siren, CheckCircle2 } from "lucide-react-native";

interface EmergencyButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isOkayMode?: boolean;
}

export function EmergencyButton({
  onPress,
  disabled = false,
  isOkayMode = false,
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

    // Haptic feedback pattern: SOS for emergency, double pulse for okay
    if (isOkayMode) {
      Vibration.vibrate([0, 100, 50, 100]);
    } else {
      Vibration.vibrate([0, 100, 100, 100, 100, 100, 200, 300, 200, 300, 200, 300]);
    }

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

  const bgColor = isOkayMode ? "bg-safe" : "bg-destructive";
  const borderColor = isOkayMode ? "border-safe/50" : "border-destructive/50";
  const shadowColor = isOkayMode ? "shadow-safe/40" : "shadow-destructive/40";

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
            className={`absolute inset-0 rounded-3xl ${bgColor}`}
          />

          {/* Main button */}
          <View
            className={`
              flex-row items-center justify-center 
              h-20 rounded-3xl 
              ${bgColor} border-2 ${borderColor}
              shadow-2xl ${shadowColor}
              ${disabled ? "opacity-50" : ""}
            `}
          >
            {/* Icon container */}
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20 mr-3">
              {isOkayMode ? (
                <CheckCircle2 size={26} color="white" />
              ) : (
                <Siren size={26} color="white" />
              )}
            </View>

            {/* Text */}
            <View>
              <Text className="font-serif text-xl text-white">
                {isOkayMode ? "Auntie Okay Dah" : "Hantar Kecemasan"}
              </Text>
              <Text className="font-sans text-xs text-white/70 uppercase tracking-wider">
                {isOkayMode ? "Clear Alert (I am Okay)" : "Send Emergency Alert"}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

