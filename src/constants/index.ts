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
  {
    label: "repair_status.pending_check",
    value: "pending_check",
    color: "orange",
  },
  {
    label: "repair_status.pending_quote",
    value: "pending_quote",
    color: "gold",
  },
  { label: "repair_status.approved", value: "approved", color: "lime" }, // 客户同意维修
  { label: "repair_status.repairing", value: "repairing", color: "blue" },
  {
    label: "repair_status.waiting_parts",
    value: "waiting_parts",
    color: "purple",
  },
];
export const REPAIR_STATUS_OPTIONS = [
  {
    label: "repair_status.pending_check",
    value: "pending_check",
    color: "orange",
  },
  {
    label: "repair_status.pending_quote",
    value: "pending_quote",
    color: "gold",
  },
  { label: "repair_status.approved", value: "approved", color: "lime" }, // 客户同意维修
  { label: "repair_status.repairing", value: "repairing", color: "blue" },
  {
    label: "repair_status.waiting_parts",
    value: "waiting_parts",
    color: "purple",
  },
  { label: "repair_status.completed", value: "completed", color: "green" },
  { label: "repair_status.delivered", value: "delivered", color: "blue" },
  { label: "repair_status.cancelled", value: "cancelled", color: "red" },
];
