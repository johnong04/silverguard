import * as React from "react";
import { Modal as RNModal, View, Pressable, Text, Dimensions, PanResponder } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { cn } from "../../lib/utils";

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ visible, onClose, title, children, className }: DrawerProps) {
  // Simple gesture handling for "pull down to close"
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        }
      },
    })
  ).current;

  return (
    <RNModal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View 
          className={cn(
            "h-[90%] w-full rounded-t-[40px] border-t border-white/10 bg-zinc-950 shadow-2xl",
            className
          )}
        >
          {/* Handle */}
          <View 
            {...panResponder.panHandlers}
            className="h-12 w-full items-center justify-center"
          >
            <View className="h-1.5 w-12 rounded-full bg-white/20" />
          </View>
          
          <View className="flex-row items-center justify-between px-8 py-2">
            <Text className="text-2xl font-serif text-white">{title}</Text>
            <Pressable 
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
            >
              <ChevronDown size={24} color="white" />
            </Pressable>
          </View>
          
          <View className="flex-1 p-8 pt-4">{children}</View>
        </View>
      </View>
    </RNModal>
  );
}

