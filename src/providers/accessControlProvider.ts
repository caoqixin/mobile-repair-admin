import {
  AccessControlProvider,
  CanParams,
  CanReturnType,
} from "@refinedev/core";
import { useAuthStore } from "../stores/authStore";
// 定义允许的操作类型
type ActionType = "list" | "show" | "create" | "edit" | "delete" | "clone";

// 1. 定义 Staff (技师/前台) 的通用权限集
const STAFF_PERMISSIONS: Record<string, ActionType[]> = {
  // === 业务操作 (SQL: FOR ALL) ===
  repair_orders: ["list", "show", "create", "edit", "delete"],
  customers: ["list", "show", "create", "edit"],
  inventory_components: ["list", "show", "create", "edit"],
  inventory_items: ["list", "show", "create", "edit"],
  purchase_orders: ["list", "show", "create", "edit"],
  stock_entries: ["list", "show", "create"],
  sales_orders: ["list", "show", "create"],
  warranties: ["list", "show", "create", "edit"],

  // === 基础数据 (SQL: FOR SELECT) ===
  // 只能看，不能改
  device_models: ["list", "show"],
  categories: ["list", "show"],
  faults: ["list", "show"],

  inventory: ["list"],
  settings: ["list"],

  quote: ["list"],
};

// 2. 定义角色规则矩阵
const RBAC_RULES: Record<string, any> = {
  // Admin 拥有上帝权限
  admin: "ALL",

  // 技师和前台共享 Staff 权限集
  technician: STAFF_PERMISSIONS,
  front_desk: STAFF_PERMISSIONS,

  // 合作伙伴 (只能访问 Quote 页面)
  partner: {
    quote: ["list"],
  },
};

export const accessControlProvider: AccessControlProvider = {
  // 这是一个同步检查，非常快
  can: async ({ resource, action }: CanParams): Promise<CanReturnType> => {
    // 1. 从 Zustand Store 获取当前角色
    const role = useAuthStore.getState().user?.role;

    // 如果未登录或无角色，拒绝访问
    if (!role) {
      return { can: false, reason: "Unauthorized: No role found" };
    }

    // 2. Admin 直接放行
    if (role === "admin" || RBAC_RULES[role] === "ALL") {
      return { can: true };
    }

    // 3. 获取当前角色的权限配置
    const permissions = RBAC_RULES[role];
    if (!permissions) {
      return { can: false, reason: `Role [${role}] has no definition` };
    }

    // 4. 获取具体资源的权限
    const resourcePermissions = permissions[resource || ""];

    // 如果该角色完全没配置这个资源 (例如 partner 访问 customers)
    if (!resourcePermissions) {
      return {
        can: false,
        reason: `Role [${role}] cannot access resource [${resource}]`,
      };
    }

    // 5. 检查具体动作 (list, create, edit...)
    if (
      Array.isArray(resourcePermissions) &&
      action &&
      resourcePermissions.includes(action as ActionType)
    ) {
      return { can: true };
    }

    // 默认拒绝
    return {
      can: false,
      reason: `Role [${role}] is not allowed to perform [${action}] on [${resource}]`,
    };
  },
};
