import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.OS === "web"
  ? ""
  : "http://localhost:3456/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const checkHealth = () => api.get("/health");
export const uploadActivity = (formData: FormData) =>
  api.post("/activity/verify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
export const chatWithAgent = (message: string, context = {}) =>
  api.post("/chat", { message, context });
export const getUserMemory = (userId = "default") =>
  api.get(`/memory/${userId}`);
export const calculateReward = (activityId: string, duration: number, streak: number) =>
  api.post("/rewards/calculate", { activityId, duration, streak });
export const getRecommendations = (context = {}) =>
  api.post("/recommendations", { context });
