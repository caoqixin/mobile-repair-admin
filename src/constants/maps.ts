import {
  CategoryType,
  OrderStatus,
  PartQuality,
  PaymentMethod,
  StatusTag,
  StockEntryType,
  UserRole,
} from "../interface";

export const USER_ROLE_MAP: Record<UserRole, string> = {
  admin: "user_role.admin",
  technician: "user_role.technician",
  front_desk: "user_role.front_desk",
  partner: "user_role.partner",
};

export const CATEGORY_TYPE_MAP: Record<CategoryType, string> = {
  component: "category.component",
  item: "category.item",
};

export const REPAIR_STATUS_MAP: Record<OrderStatus, StatusTag> = {
  pending_check: { color: "orange", label: "repair_status.pending_check" },
  pending_quote: { color: "gold", label: "repair_status.pending_quote" },
  approved: { color: "lime", label: "repair_status.approved" },
  repairing: { color: "blue", label: "repair_status.repairing" },
  waiting_parts: { color: "purple", label: "repair_status.waiting_parts" },
  completed: { color: "green", label: "repair_status.completed" },
  delivered: { color: "skyblue", label: "repair_status.delivered" },
  cancelled: { color: "red", label: "repair_status.cancelled" },
};

export const STOCK_ENTRIES_TYPE: Record<
  StockEntryType,
  { color: string; label: string }
> = {
  purchase: { color: "blue", label: "stock_entries.options.purchase" },
  return: { color: "orange", label: "stock_entries.options.return" },
  adjust: { color: "green", label: "stock_entries.options.adjust" },
  repair: { color: "skyblue", label: "stock_entries.options.repair" },
};

export const PAYMENT_MAP: Record<
  PaymentMethod,
  { color: string; icon: string }
> = {
  cash: { color: "green", icon: "💶" },
  card: { color: "blue", icon: "💳" },
  transfer: { color: "purple", icon: "🏦" },
  alipay: { color: "purple", icon: "Alipay" },
  wechat: { color: "purple", icon: "WePay" },
};

export const ROLE_BASE_HOME_MAP: Record<
  UserRole,
  { resources: string; link: string }
> = {
  admin: { resources: "dashboard", link: "/" },
  front_desk: { resources: "sales_orders", link: "/sales" },
  technician: { resources: "repair_orders", link: "/repairs" },
  partner: { resources: "quote", link: "/quote" },
};

export const PART_QUALITY_MAP: Record<PartQuality, string> = {
  compatibile: "green",
  originale: "blue",
  service_pack_original: "orange",
  incell: "red",
  hard_oled: "green",
  soft_oled: "orange",
  rigenerato: "skyblue",
};
