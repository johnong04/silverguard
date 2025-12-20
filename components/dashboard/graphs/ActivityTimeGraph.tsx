import React from "react";
import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;

export function ActivityTimeGraph() {
  const data = [
    { value: 20, label: "M", frontColor: "#F59E0B" },
    { value: 45, label: "T", frontColor: "#F59E0B" },
    { value: 30, label: "W", frontColor: "#F59E0B" },
    { value: 50, label: "T", frontColor: "#F59E0B", topLabelComponent: () => <View style={{ width: 40, marginLeft: -8 }}><Text style={{ color: 'white', fontSize: 9, textAlign: 'center', fontWeight: 'bold' }}>PEAK</Text></View> },
    { value: 25, label: "F", frontColor: "#F59E0B" },
    { value: 40, label: "S", frontColor: "#F59E0B" },
    { value: 35, label: "S", frontColor: "#F59E0B" },
  ];

  return (
    <View className="flex-1 justify-center">
      <View className="mb-4">
        <Text className="font-serif text-xl text-white">Weekly Activity</Text>
        <Text className="mt-1 font-sans text-stone-400 text-xs">
          Average: 35 mins / day
        </Text>
      </View>

      <View className="items-center">
        <BarChart
          data={data}
          barWidth={18}
          spacing={12}
          noOfSections={3}
          height={120}
          width={CARD_WIDTH - 80}
          barBorderRadius={6}
          frontColor="#F59E0B"
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          yAxisLabelSuffix="m"
          yAxisTextStyle={{ color: "#57534E", fontSize: 8 }}
          xAxisLabelTextStyle={{ color: "#57534E", fontSize: 8 }}
          initialSpacing={10}
          isAnimated
        />
      </View>
    </View>
  );
}

