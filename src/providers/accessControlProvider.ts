import {
  AccessControlProvider,
  CanParams,
  CanReturnType,
} from "@refinedev/core";
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";
import { useAuthStore } from "../stores/authStore";
// ===  定义类型 ===
// Refine 的标准操作 + 自定义操作
type Action =
  | "list"
  | "show"
  | "create"
  | "edit"
  | "delete"
  | "clone"
  | "manage";
// 你的资源名称 (可以是字符串)
type Subject = string | "all";

// 定义 CASL Ability 类型
type AppAbility = MongoAbility<[Action, Subject]>;

// 1. 定义 Staff (技师/前台) 的通用权限集
const STAFF_PERMISSIONS: Record<string, Action[]> = {
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

// === 创建权限工厂函数 ===
const defineAbilitiesFor = (role: string): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case "admin":
      // Admin 拥有所有权限 ('manage' 代表所有操作, 'all' 代表所有资源)
      can("manage", "all");
      break;

    case "technician":
    case "front_desk":
      // 遍历配置对象，动态注册规则
      Object.entries(STAFF_PERMISSIONS).forEach(([resource, actions]) => {
        // CASL 的 can 接受数组作为第一个参数: can(['create', 'read'], 'Post')
        can(actions, resource);
      });
      break;

    case "partner":
      // 合作伙伴只能看 quote
      can("list", "quote");
      break;

    default:
      // 未知角色没有任何权限
      break;
  }

  return build();
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }: CanParams): Promise<CanReturnType> => {
    // 1. 获取角色
    const role = useAuthStore.getState().user?.role;

    if (!role) {
      return {
        can: false,
        reason: "Unauthorized: No role found",
      };
    }

    if (!resource || resource === "my") {
      return { can: true };
    }

    // 2. 针对当前角色生成 Ability 实例
    // 注意：如果是大型应用，可以将 ability 实例存在 Store 或 Context 中以避免重复创建
    // 但对于 AccessControlProvider 这种异步调用，即时创建也是性能可接受的
    const ability = defineAbilitiesFor(role);

    // 3. 校验权限
    // Refine 传入的 action 比如 "list", "create" 会直接被 CASL 匹配
    // resource 比如 "repair_orders" 也会被匹配
    const canAccess = ability.can(action as Action, resource || "");

    return {
      can: canAccess,
      reason: canAccess
        ? undefined
        : `Role [${role}] is not allowed to perform [${action}] on [${resource}]`,
    };
  },
};
