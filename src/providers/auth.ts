import { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "./supabase-client";
import { useAuthStore } from "../stores/authStore";
import { IProfile } from "../interface";

const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    // sign in with oauth
    try {
      // sign in with email and password
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data?.user) {
        // 检查 MFA 状态 (AAL级别)
        const { data: aal } =
          await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
        // 如果 nextLevel 是 aal2 (启用了MFA)，但当前只是 aal1 (刚通过密码)，则拦截跳转
        if (aal?.nextLevel === "aal2" && aal?.currentLevel === "aal1") {
          return {
            success: true,
            redirectTo: "/mfa-verify", // 重定向到输入验证码页面
          };
        }

        // 登录成功，查询 profiles 表获取角色
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single<IProfile>();

        // 保存到全局 Zustand
        if (profile) {
          useAuthStore.getState().setAuth(profile);
        }

        const role = profile?.role;
        let redirectTo;

        // 2. 预判跳转路径
        if (role === "front_desk") redirectTo = "/sales/create";
        else if (role === "technician") redirectTo = "/repairs";
        else if (role === "partner") redirectTo = "/quote";
        else if (role === "admin") redirectTo = "/";

        return {
          success: true,
          redirectTo: redirectTo,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Login failed",
        name: "Invalid email or password",
      },
    };
  },
  register: async ({ email, password, full_name, role, redirectPath }) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
          redirectTo: redirectPath,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Register failed",
        name: "Invalid email or password",
      },
    };
  },
  forgotPassword: async ({ email }) => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        },
      );

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Forgot password failed",
        name: "Invalid email",
      },
    };
  },
  updatePassword: async ({ password }) => {
    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
          redirectTo: "/",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }
    return {
      success: false,
      error: {
        message: "Update password failed",
        name: "Invalid password",
      },
    };
  },
  logout: async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return {
        success: false,
        error,
      };
    }

    // 登出时清空 Zustand
    useAuthStore.getState().clearAuth();
    return {
      success: true,
      redirectTo: "/",
    };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
  check: async () => {
    try {
      const { data } = await supabaseClient.auth.getSession();
      const { session } = data;

      // 🛑 情况 A: Cookie 被删或失效
      if (!session) {
        // 强制清理 Zustand，确保 UI 状态一致
        useAuthStore.getState().clearAuth();
        return {
          authenticated: false,
          error: {
            message: "Check failed",
            name: "Session not found",
          },
          logout: true,
          redirectTo: "/login",
        };
      }

      // 🔥 再次验证会话的 MFA 级别，防止用户手动绕过路由
      const { data: aal } =
        await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal?.currentLevel === "aal1") {
        return {
          authenticated: false,
          logout: false, // 不要登出！只拦截。因为他们正在等待输入验证码。
          redirectTo: "/mfa-verify",
        };
      }

      // ✅ 情况 B: Cookie 存在 (Session 有效)
      // 检查 Zustand 是否为空 (例如用户刷新了页面)

      const user = useAuthStore.getState().user;

      if (!user) {
        // Zustand 为空，我们需要重新拉取用户信息来"水合"(Hydrate) Store
        const { data: profile, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single<IProfile>();

        if (error || !profile) {
          // 如果 Session 有效但查不到 Profile (罕见数据错误)，也视为认证失败
          return {
            authenticated: false,
            redirectTo: "/login",
            logout: true,
          };
        }

        // 恢复 Zustand 状态
        useAuthStore.getState().setAuth(profile);
      }
    } catch (error: any) {
      useAuthStore.getState().clearAuth();
      return {
        authenticated: false,
        error: error || {
          message: "Check failed",
          name: "Not authenticated",
        },
        logout: true,
        redirectTo: "/login",
      };
    }

    return {
      authenticated: true,
    };
  },
  getPermissions: async () => {
    const user = useAuthStore.getState().user;
    if (user) return user;

    return null;
  },
  getIdentity: async () => {
    // 可以直接从 store 取，非常快
    const user = useAuthStore.getState().user;
    if (user) return user;

    const { data } = await supabaseClient.auth.getUser();

    if (data?.user) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single<IProfile>();

      // 保存到全局 Zustand
      useAuthStore.getState().setAuth(profile!);

      return profile;
    }

    return null;
  },
};

export default authProvider;
