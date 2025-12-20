import React, { useState } from "react";
import { View, ScrollView, Dimensions, Text } from "react-native";
import { cn } from "../../../lib/utils";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48; // Account for px-6 padding on main screen

interface HealthGraphContainerProps {
  children: React.ReactNode[];
}

export function HealthGraphContainer({ children }: HealthGraphContainerProps) {
  const [activeIndex, setActiveLayer] = useState(0);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (CARD_WIDTH + 16));
    setActiveLayer(index);
  };

  return (
    <View className="my-8">
      <View className="mb-4 px-6 flex-row items-center justify-between">
        <Text className="font-serif text-2xl text-white">Health Insights</Text>
        <View className="flex-row space-x-1.5">
          {children.map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                activeIndex === i ? "w-6 bg-primary" : "w-1.5 bg-white/10"
              )}
            />
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {children.map((child, index) => (
          <View
            key={index}
            style={{ width: CARD_WIDTH }}
            className="mr-4 overflow-hidden rounded-[32px] border border-white/5 bg-zinc-900/40 p-6"
          >
            {child}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

