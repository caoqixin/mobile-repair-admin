import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProfile } from "../interface";

// 定义 Store 的类型
interface AuthState {
  user: IProfile | null; // 你可以替换为具体的 User 类型
  setAuth: (user: IProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      // 登录成功时调用
      setAuth: (user) => set({ user }),

      // 登出时调用
      clearAuth: () => set({ user: null }),
    }),
    {
      name: "auth-storage", // localStorage 中的 key 名称
    },
  ),
);
