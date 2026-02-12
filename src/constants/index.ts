export * from "./maps";
export * from "./color";
export * from "./options";

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
  { label: "已取件 (Ritirato)", value: "delivered", color: "blue" },
  { label: "已取消 (Cancelled)", value: "cancelled", color: "red" },
];
