import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react-native";
import { cn } from "../../lib/utils";

interface SafetyHeroProps {
  status: "safe" | "fall_detected" | "away";
  userName: string;
}

export function SafetyHero({ status, userName }: SafetyHeroProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: interpolate(pulse.value, [1, 1.2], [0.4, 0], Extrapolate.CLAMP),
    };
  });

  const isSafe = status === "safe";
  const isFall = status === "fall_detected";

  const colorClass = isSafe 
    ? "text-safe" 
    : isFall 
    ? "text-destructive" 
    : "text-primary";

  const bgClass = isSafe 
    ? "bg-safe/10 border-safe/20" 
    : isFall 
    ? "bg-destructive/10 border-destructive/20" 
    : "bg-primary/10 border-primary/20";

  const pulseColor = isSafe 
    ? "bg-safe" 
    : isFall 
    ? "bg-destructive" 
    : "bg-primary";

  return (
    <View className="items-center justify-center py-10">
      <View className="relative h-64 w-64 items-center justify-center">
        {/* Animated Pulse Rings */}
        <Animated.View 
          style={animatedRingStyle}
          className={cn("absolute h-full w-full rounded-full", pulseColor)}
        />
        <Animated.View 
          style={[animatedRingStyle, { width: '110%', height: '110%' }]}
          className={cn("absolute rounded-full", pulseColor)}
        />

        {/* Main Circle */}
        <View 
          className={cn(
            "h-52 w-52 items-center justify-center rounded-full border-4 bg-zinc-950 shadow-2xl shadow-black",
            isSafe ? "border-safe/50" : isFall ? "border-destructive/50" : "border-primary/50"
          )}
        >
          {isSafe ? (
            <ShieldCheck size={64} color="#10B981" />
          ) : isFall ? (
            <ShieldAlert size={64} color="#DC2626" strokeWidth={2.5} />
          ) : (
            <Shield size={64} color="#F59E0B" />
          )}
          
          <View className="mt-4 items-center">
            <Text className="font-serif text-3xl text-white">
              {isSafe ? "Safe" : isFall ? "Alert" : "Away"}
            </Text>
            <View className="mt-1 flex-row items-center space-x-1">
              <View className={cn("h-2 w-2 rounded-full", isSafe ? "bg-safe" : isFall ? "bg-destructive" : "bg-primary")} />
              <Text className="text-xs font-medium uppercase tracking-widest text-stone-500">
                {isSafe ? "Active" : isFall ? "Emergency" : "Monitoring"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-8 items-center px-6">
        <Text className="font-serif text-2xl text-white text-center">
          {userName} is <Text className={colorClass}>{isSafe ? "Protected" : isFall ? "in Danger" : "Away"}</Text>
        </Text>
        <Text className="mt-2 text-center font-sans text-stone-400 leading-6">
          {isSafe 
            ? "Real-time safety sensors are active and monitoring for anomalies." 
            : isFall 
            ? "Emergency protocols triggered. Please check the Crisis Dashboard." 
            : "The guardian system is active, but the resident is out of view."}
        </Text>
      </View>
    </View>
  );
}

