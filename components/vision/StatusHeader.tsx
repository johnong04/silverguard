import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { Lock, ArrowLeft, Eye } from "lucide-react-native";

interface StatusHeaderProps {
  onBack: () => void;
  isActive?: boolean;
}

export function StatusHeader({ onBack, isActive = true }: StatusHeaderProps) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    // Pulsing dot animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Glow animation
    glow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glow.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(100)}
      className="absolute top-0 left-0 right-0 z-50"
    >
      {/* Frosted glass header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-black/50">
        {/* Back button */}
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <ArrowLeft size={20} color="#FAFAF9" />
        </Pressable>

        {/* Status indicator */}
        <View className="flex-row items-center bg-black/40 rounded-full px-4 py-2 border border-white/10">
          {/* Pulsing dot with glow */}
          <View className="relative mr-3">
            <Animated.View
              style={[
                pulseStyle,
                {
                  position: "absolute",
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#10B981",
                },
              ]}
            />
            <View className="h-3 w-3 rounded-full bg-safe" />
          </View>

          <Text className="font-sans text-xs font-bold uppercase tracking-widest text-safe mr-2">
            Guard Mode
          </Text>

          <View className="h-4 w-[1px] bg-white/20 mx-2" />

          <Lock size={12} color="#A8A29E" />
          <Text className="font-sans text-xs text-stone-400 ml-1">
            Privacy Locked
          </Text>
        </View>

        {/* Vision indicator */}
        <View className="h-10 w-10 items-center justify-center rounded-full bg-safe/10 border border-safe/30">
          <Eye size={18} color="#10B981" />
        </View>
      </View>
    </Animated.View>
  );
}

