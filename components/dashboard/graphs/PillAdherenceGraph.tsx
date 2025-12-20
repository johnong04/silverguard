import React from "react";
import { View, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Pill } from "lucide-react-native";

interface PillAdherenceGraphProps {
  meds?: { taken: boolean }[];
}

export function PillAdherenceGraph({ meds = [] }: PillAdherenceGraphProps) {
  const total = meds.length;
  const takenCount = meds.filter((m) => m.taken).length;
  const percentage = total > 0 ? (takenCount / total) * 100 : 0;

  // Pie chart expects array of {value, color}
  const data = [
    { value: takenCount || 0.001, color: "#10B981", focused: true }, // Jade Green for taken
    { value: (total - takenCount) || 0.001, color: "#1C1917" }, // Stone-900ish for pending
  ];

  return (
    <View className="flex-row items-center justify-between flex-1">
      <View className="flex-1 pr-4 justify-center">
        <Text className="font-serif text-xl text-white">Daily Adherence</Text>
        <Text className="mt-1 font-sans text-stone-400 text-sm">
          {takenCount} of {total} medications taken today.
        </Text>
        <View className="mt-4 flex-row items-center space-x-2">
          <View className="h-2 w-2 rounded-full bg-safe" />
          <Text className="font-sans text-[10px] uppercase tracking-widest text-stone-500">
            Current Streak: 5 Days
          </Text>
        </View>
      </View>

      <View className="items-center justify-center">
        <PieChart
          donut
          radius={45}
          innerRadius={34}
          data={data}
          centerLabelComponent={() => (
            <View className="items-center justify-center">
              <Text className="text-lg font-bold text-white">{Math.round(percentage)}%</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

