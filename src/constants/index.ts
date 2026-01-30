import { CategoryType, UserRole } from "../interface";

export const USER_ROLE_MAP: Record<UserRole, string> = {
  admin: "管理员",
  technician: "技术员",
  front_desk: "前台",
  partner: "合作伙伴",
};

export const CATEGORY_TYPE_MAP: Record<CategoryType, string> = {
  component: "维修配件",
  item: "前台配件",
};

export const QUALITY = [
  "compatibile",
  "originale",
  "service_pack_original",
  "incell",
  "hard_oled",
  "soft_oled",
] as const;

// 维修状态映射配置

export const CREATE_REPAIR_STATUS_OPTIONS = [
  { label: "待检测 (Pending Check)", value: "pending_check", color: "orange" },
  { label: "待报价 (Pending Quote)", value: "pending_quote", color: "gold" },
  { label: "已批准 (Approved)", value: "approved", color: "lime" }, // 客户同意维修
  { label: "维修中 (Repairing)", value: "repairing", color: "blue" },
  {
    label: "等待配件 (Waiting Parts)",
    value: "waiting_parts",
    color: "purple",
  },
];
export const REPAIR_STATUS_OPTIONS = [
  {
    label: "待检测 (Pending Check)",
    value: "pending_check",
    color: "orange",
  },
  { label: "待报价 (Pending Quote)", value: "pending_quote", color: "gold" },
  { label: "已批准 (Approved)", value: "approved", color: "lime" }, // 客户同意维修
  { label: "维修中 (Repairing)", value: "repairing", color: "blue" },
  {
    label: "等待配件 (Waiting Parts)",
    value: "waiting_parts",
    color: "purple",
  },
  { label: "已完成 (Completed)", value: "completed", color: "green" },
  { label: "已取消 (Cancelled)", value: "cancelled", color: "red" },
];
