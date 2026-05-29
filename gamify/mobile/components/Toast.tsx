import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

type ToastType = "success" | "error" | "info";

interface Toast {
  message: string;
  type: ToastType;
  id: number;
}

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<NodeJS.Timeout>(undefined as any);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToast({ message, type, id });
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 2500);
  }, [opacity]);

  const colorsMap = { success: colors.success, error: colors.error, info: colors.primary };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View style={[s.toast, { opacity, backgroundColor: colorsMap[toast.type] }]}>
          <Text style={s.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const s = StyleSheet.create({
  toast: {
    position: "absolute", bottom: 100, left: 20, right: 20,
    padding: 14, borderRadius: 12, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  text: { fontSize: 14, fontWeight: "600", color: "#fff", textAlign: "center" },
});
