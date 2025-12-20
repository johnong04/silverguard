import * as React from "react";
import { Modal as RNModal, View, Pressable, Text } from "react-native";
import { X } from "lucide-react-native";
import { cn } from "../../lib/utils";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View 
          className={cn(
            "w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl",
            className
          )}
        >
          <View className="flex-row items-center justify-between border-b border-white/5 p-6">
            <Text className="text-xl font-serif text-white">{title}</Text>
            <Pressable 
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
            >
              <X size={20} color="white" />
            </Pressable>
          </View>
          <View className="p-6">{children}</View>
        </View>
      </View>
    </RNModal>
  );
}

