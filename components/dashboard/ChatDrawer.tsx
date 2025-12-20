import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  UIManager,
  Keyboard,
  ScrollView,
} from "react-native";
import { Send, Sparkles, Mic, Loader2 } from "lucide-react-native";
import { Drawer } from "../ui/drawer";
import { cn } from "../../lib/utils";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface ChatDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const AI_MSG_1 =
  "Hello Guardian! I've analyzed Auntie Rose's health status for this week. She's been very consistent with her medications and completed 5 out of 7 scheduled physio walks. Her overall mobility is improving!";

const AI_MSG_2 =
  "\"Auntie, okay tak? Dah makan ubat ke?\"\n\nI just checked in with her. She's doing great and confirmed she hasn't missed a single dose of her Aspirin this week. Everything is steady lah!";

export function ChatDrawer({ visible, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasFiredInitial, setHasFiredInitial] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Robust scroll to bottom
  const scrollToBottom = useCallback(() => {
    const scroll = () => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    };
    scroll();
    setTimeout(scroll, 50);
    setTimeout(scroll, 150);
  }, []);

  // Initial Message Trigger
  useEffect(() => {
    if (visible && !hasFiredInitial) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const initialMsg: Message = {
          id: "initial",
          text: AI_MSG_1,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setIsThinking(false);
        setMessages([initialMsg]);
        setHasFiredInitial(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, hasFiredInitial]);

  // Keyboard listener
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollToBottom();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToBottom]);

  // Scroll when messages change or thinking state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: AI_MSG_2,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setIsThinking(false);
      setMessages((prev) => [...prev, aiResponse]);
    }, 2000);
  };

  return (
    <Drawer
      visible={visible}
      onClose={onClose}
      title="Health Insights"
      className="bg-zinc-950"
    >
      <View className="flex-1" style={{ marginBottom: keyboardHeight }}>
        {/* Assistant Header Info */}
        <View className="mb-4 flex-row items-center rounded-2xl bg-primary/5 p-4 border border-primary/10">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Sparkles size={20} color="#F59E0B" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-sans font-bold text-white">
              YTL ILMU Assistant
            </Text>
            <Text className="text-xs text-stone-400 italic">
              Cultural & Health Context Active
            </Text>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-1"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={cn(
                "max-w-[85%] px-5 py-4 shadow-sm mb-4",
                message.sender === "user"
                  ? "self-end bg-primary rounded-2xl rounded-tr-none"
                  : "self-start bg-zinc-900 rounded-2xl rounded-tl-none border border-white/10"
              )}
            >
              <Text
                className={cn(
                  "font-sans leading-5 text-[15px]",
                  message.sender === "user"
                    ? "text-zinc-950 font-medium"
                    : "text-stone-200"
                )}
              >
                {message.text}
              </Text>
              <Text
                className={cn(
                  "mt-1.5 text-[10px] font-medium opacity-50",
                  message.sender === "user" ? "text-zinc-950" : "text-stone-500"
                )}
              >
                {message.timestamp}
              </Text>
            </View>
          ))}

          {isThinking && (
            <View className="self-start max-w-[85%] rounded-2xl rounded-tl-none bg-zinc-900 px-5 py-4 border border-white/10 flex-row items-center space-x-3 mb-4">
              <Loader2 size={16} color="#F59E0B" className="animate-spin" />
              <Text className="text-stone-400 font-sans text-sm italic">
                Auntie check in progress...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="pt-2 pb-1 px-1 bg-zinc-950">
          <View className="flex-row items-center space-x-3 rounded-full border border-white/10 bg-zinc-900 px-2 py-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Mic size={18} color="#A8A29E" />
            </View>
            <TextInput
              placeholder="Ask about Auntie Rose's health..."
              placeholderTextColor="#57534E"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              className="flex-1 font-sans text-white px-2 h-10"
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isThinking}
              className={cn(
                "h-10 w-10 items-center justify-center rounded-full transition-all",
                inputText.trim()
                  ? "bg-primary scale-100"
                  : "bg-zinc-800 scale-90"
              )}
            >
              <Send
                size={18}
                color={inputText.trim() ? "#09090B" : "#57534E"}
              />
            </Pressable>
          </View>
          <Text className="mt-2 text-center text-[10px] uppercase tracking-widest text-stone-600">
            Powered by YTL ILMU & SilverGuard Intelligence
          </Text>
        </View>
      </View>
    </Drawer>
  );
}
