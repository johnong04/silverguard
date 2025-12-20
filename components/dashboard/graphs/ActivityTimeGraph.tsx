import React from "react";
import { View, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export function ActivityTimeGraph() {
  const data = [
    { value: 20, label: "M", frontColor: "#F59E0B" },
    { value: 45, label: "T", frontColor: "#F59E0B" },
    { value: 30, label: "W", frontColor: "#F59E0B" },
    { value: 50, label: "T", frontColor: "#F59E0B", topLabelComponent: () => <Text style={{ color: 'white', fontSize: 10 }}>Peak</Text> },
    { value: 25, label: "F", frontColor: "#F59E0B" },
    { value: 40, label: "S", frontColor: "#F59E0B" },
    { value: 35, label: "S", frontColor: "#F59E0B" },
  ];

  return (
    <View>
      <View className="mb-4">
        <Text className="font-serif text-xl text-white">Weekly Activity</Text>
        <Text className="mt-1 font-sans text-stone-400">
          Average: 35 mins / day
        </Text>
      </View>

      <BarChart
        data={data}
        barWidth={22}
        noOfSections={3}
        barBorderRadius={6}
        frontColor="#F59E0B"
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        yAxisLabelSuffix="m"
        yAxisTextStyle={{ color: "#57534E", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#57534E", fontSize: 10 }}
        isAnimated
      />
    </View>
  );
}

