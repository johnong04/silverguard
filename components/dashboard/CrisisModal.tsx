import React from "react";
import { View, Text, Pressable } from "react-native";
import { Phone, Video, ShieldAlert, User, Siren } from "lucide-react-native";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface CrisisModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
}

export function CrisisModal({ visible, onClose, userName }: CrisisModalProps) {
  return (
    <Modal 
      visible={visible} 
      onClose={onClose} 
      title="Emergency Response"
      className="max-w-[400px]"
    >
      <View className="items-center">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert size={48} color="#DC2626" />
        </View>
        
        <Text className="text-center font-sans text-stone-400">
          Immediate action required for <Text className="font-bold text-white">{userName}</Text>.
        </Text>

        {/* Primary Action: Live Call */}
        <View className="mt-8 w-full">
          <Button 
            className="h-24 w-full flex-row space-x-4 rounded-3xl bg-destructive"
            onPress={() => console.log("Initiating Live Call...")}
          >
            <Video size={32} color="white" />
            <View className="items-start">
              <Text className="text-xl font-bold text-white">Live Emergency Call</Text>
              <Text className="text-sm text-white/80">Auto-answers on target device</Text>
            </View>
          </Button>
        </View>

        {/* Secondary Actions */}
        <View className="mt-6 w-full space-y-4">
          <Pressable 
            className="flex-row items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
          >
            <View className="flex-row items-center space-x-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User size={20} color="#F59E0B" />
              </View>
              <Text className="font-medium text-white">Call Secondary Guardian</Text>
            </View>
            <Phone size={20} color="#A8A29E" />
          </Pressable>

          <Pressable 
            className="flex-row items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
          >
            <View className="flex-row items-center space-x-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Siren size={20} color="#3B82F6" />
              </View>
              <Text className="font-medium text-white">Contact Emergency Services</Text>
            </View>
            <Phone size={20} color="#A8A29E" />
          </Pressable>
        </View>

        <Text className="mt-8 text-center text-xs font-medium uppercase tracking-widest text-stone-600">
          All emergency actions are logged
        </Text>
      </View>
    </Modal>
  );
}

