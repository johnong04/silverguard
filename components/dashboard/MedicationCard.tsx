import React from "react";
import { View, Text, Pressable } from "react-native";
import { Pill, CheckCircle2, Circle, Clock } from "lucide-react-native";
import { cn } from "../../lib/utils";

interface MedicationCardProps {
  name: string;
  time: string;
  taken: boolean;
  overdue?: boolean;
  onToggle?: () => void;
}

export function MedicationCard({ name, time, taken, overdue, onToggle }: MedicationCardProps) {
  const statusColor = taken 
    ? "bg-safe" 
    : overdue 
    ? "bg-destructive" 
    : "bg-primary";

  const statusText = taken 
    ? "Taken" 
    : overdue 
    ? "Overdue" 
    : "Pending";

  return (
    <Pressable 
      onPress={onToggle}
      className={cn(
        "mb-4 flex-row items-center rounded-3xl border border-white/5 bg-zinc-900/40 p-5 shadow-sm active:scale-[0.98]",
        taken && "opacity-60"
      )}
    >
      <View 
        className={cn(
          "h-14 w-14 items-center justify-center rounded-2xl",
          taken ? "bg-safe/10" : overdue ? "bg-destructive/10" : "bg-primary/10"
        )}
      >
        <Pill 
          size={28} 
          color={taken ? "#10B981" : overdue ? "#DC2626" : "#F59E0B"} 
        />
      </View>

      <View className="ml-5 flex-1">
        <Text 
          className={cn(
            "font-serif text-xl text-white",
            taken && "line-through text-stone-500"
          )}
        >
          {name}
        </Text>
        <View className="mt-1 flex-row items-center">
          <Clock size={14} color="#A8A29E" />
          <Text className="ml-1 font-sans text-stone-400">
            {time}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <View className={cn("rounded-full px-3 py-1", statusColor + "/20")}>
          <Text className={cn("text-[10px] font-bold uppercase tracking-wider", statusColor.replace('bg-', 'text-'))}>
            {statusText}
          </Text>
        </View>
        <View className="mt-3">
          {taken ? (
            <CheckCircle2 size={24} color="#10B981" />
          ) : (
            <Circle size={24} color={overdue ? "#DC2626" : "#3F3F46"} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

