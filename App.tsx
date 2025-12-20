import "./global.css";
import * as React from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  ShieldAlert,
  Sparkles,
  Activity,
  Eye,
  Video,
  User,
  Siren,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import {
  ConvexProvider,
  ConvexReactClient,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "./convex/_generated/api";

// UI Components
import { Button } from "./components/ui/button";
import { FAB } from "./components/ui/fab";

// Feature Components
import { SafetyHero } from "./components/dashboard/SafetyHero";
import { MedicationCard } from "./components/dashboard/MedicationCard";
import { ChatDrawer } from "./components/dashboard/ChatDrawer";

// Graph Components
import { HealthGraphContainer } from "./components/dashboard/graphs/HealthGraphContainer";
import { PillAdherenceGraph } from "./components/dashboard/graphs/PillAdherenceGraph";
import { ActivityTimeGraph } from "./components/dashboard/graphs/ActivityTimeGraph";

// Vision Engine
import { VisionEngine } from "./components/vision/VisionEngine";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Initialize Convex Client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

interface DashboardProps {
  onOpenVision: () => void;
}

function Dashboard({ onOpenVision }: DashboardProps) {
  const [emergencyMenuOpen, setEmergencyMenuOpen] = React.useState(false);
  const [chatVisible, setChatVisible] = React.useState(false);

  const guardianId = "demo-guardian-id"; // Hardcoded for demo
  const user = useQuery(api.users.getByGuardian, { guardianId });
  const meds = useQuery(
    api.meds.getByUser,
    user ? { userId: user._id } : "skip"
  );

  const triggerWelfare = useMutation(api.events.triggerWelfareCheck);
  const toggleTaken = useMutation(api.meds.toggleTaken);
  const seedDatabase = useMutation(api.init.seed);

  // Auto-seed for the very first run
  React.useEffect(() => {
    seedDatabase();
  }, []);

  if (user === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="flex-row justify-between items-center px-6 pt-8 pb-4 relative z-50">
          <View>
            <Text className="font-serif text-3xl text-white tracking-tight">
              SilverGuard
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="h-2 w-2 rounded-full bg-primary mr-2" />
              <Text className="font-sans text-xs uppercase tracking-[0.2em] text-stone-500 font-bold">
                Elderly Monitoring
              </Text>
            </View>
          </View>
          <View className="relative">
            <Button
              variant="destructive"
              className="rounded-full px-5 h-10 border border-destructive/50"
              onPress={() => setEmergencyMenuOpen(!emergencyMenuOpen)}
            >
              <ShieldAlert size={18} color="white" className="mr-2" />
              <Text className="font-sans font-bold text-xs uppercase text-white mr-1">
                Emergency
              </Text>
              {emergencyMenuOpen ? (
                <ChevronUp size={14} color="white" />
              ) : (
                <ChevronDown size={14} color="white" />
              )}
            </Button>

            {/* Emergency Dropdown Menu */}
            {emergencyMenuOpen && (
              <View className="absolute top-12 right-0 w-64 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-[100]">
                <Pressable
                  className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                  onPress={() => {
                    console.log("Live Call");
                    setEmergencyMenuOpen(false);
                  }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 mr-3">
                    <Video size={18} color="#DC2626" />
                  </View>
                  <Text className="text-white font-sans font-medium">
                    Live Emergency Call
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                  onPress={() => {
                    console.log("Guardian Call");
                    setEmergencyMenuOpen(false);
                  }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mr-3">
                    <User size={18} color="#F59E0B" />
                  </View>
                  <Text className="text-white font-sans font-medium">
                    Call Secondary Guardian
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                  onPress={() => {
                    console.log("Services Call");
                    setEmergencyMenuOpen(false);
                  }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mr-3">
                    <Siren size={18} color="#3B82F6" />
                  </View>
                  <Text className="text-white font-sans font-medium">
                    Emergency Services
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Safety Hero Section */}
        <SafetyHero
          status={(user?.status as any) || "safe"}
          userName={user?.name || "Auntie Rose"}
        />

        {/* Divider */}
        <View className="px-6 my-6">
          <View className="h-[1px] w-full bg-white/5" />
        </View>

        {/* Medications & Physio Section */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="font-serif text-2xl text-white">
                Medication & Habits
              </Text>
              <Text className="font-sans text-stone-500 mt-1">
                Today's specialized care
              </Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Activity size={20} color="#F59E0B" />
            </Pressable>
          </View>

          {meds?.map((med, index) => (
            <MedicationCard
              key={med._id}
              name={med.name}
              time={med.time}
              taken={med.taken}
              overdue={index === 2} // Just for demo "traffic light" variety
              onToggle={() =>
                toggleTaken({ medId: med._id, taken: !med.taken })
              }
            />
          ))}

          {/* Health Insights Graphs Section */}
          <HealthGraphContainer>
            <PillAdherenceGraph meds={meds as any} />
            <ActivityTimeGraph />
          </HealthGraphContainer>

          {/* Vision Engine Button - Opens Fall Detection */}
          <Button
            className="mt-4 h-16 w-full rounded-3xl bg-safe/10 border border-safe/30 flex-row items-center justify-center"
            onPress={onOpenVision}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-safe/20">
              <Eye size={22} color="#10B981" />
            </View>
            <View>
              <Text className="font-sans font-bold text-safe">
                Open Vision Engine
              </Text>
              <Text className="font-sans text-xs text-stone-500">
                Fall Detection & Monitoring
              </Text>
            </View>
          </Button>
        </View>
      </ScrollView>

      {/* AI Insights FAB */}
      <FAB
        onPress={() => setChatVisible(true)}
        className="bottom-10 right-8 h-20 w-20 bg-primary shadow-2xl shadow-primary/40"
      >
        <Sparkles size={32} color="#09090B" />
      </FAB>

      {/* Modals & Drawers */}
      <ChatDrawer visible={chatVisible} onClose={() => setChatVisible(false)} />
    </SafeAreaView>
  );
}

function AppContent() {
  const [showVisionEngine, setShowVisionEngine] = React.useState(false);

  const guardianId = "demo-guardian-id";
  const user = useQuery(api.users.getByGuardian, { guardianId });

  if (showVisionEngine && user) {
    return (
      <VisionEngine
        onClose={() => setShowVisionEngine(false)}
        userId={user._id}
      />
    );
  }

  return <Dashboard onOpenVision={() => setShowVisionEngine(true)} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ConvexProvider client={convex}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ConvexProvider>
  );
}
