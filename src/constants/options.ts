import { CheckboxOptionType, SelectProps } from "antd";
import { CategoryType, UserRole } from "../interface";
import { CATEGORY_TYPE_MAP, USER_ROLE_MAP } from "./maps";

export const PROFILE_OPTIONS: SelectProps["options"] = Object.entries(
  USER_ROLE_MAP,
).map(([value, label]) => ({
  label,
  value: value as UserRole,
}));

export const CATEGORY_OPTIONS: CheckboxOptionType[] = Object.entries(
  CATEGORY_TYPE_MAP,
).map(([value, label]) => ({
  label,
  value: value as CategoryType,
}));

export const QUALITY_OPTIONS = [
  {
    label: "quality.labels.general",
    options: [
      { label: "quality.options.compatible", value: "compatibile" },
      { label: "quality.options.original", value: "originale" },
      { label: "quality.options.regenerate", value: "rigenerato" },
      {
        label: "quality.options.service_original",
        value: "service_pack_original",
      },
    ],
  },
  {
    label: "quality.labels.apple_screen",
    options: [
      { label: "quality.options.incell", value: "incell" },
      { label: "quality.options.hard", value: "hard_oled" },
      { label: "quality.options.soft", value: "soft_oled" },
    ],
  },
];

export const PAYMENT_OPTIONS = [
  {
    label: "payment.cash",
    value: "cash",
  },
  {
    label: "payment.card",
    value: "card",
  },
  {
    label: "payment.alipay",
    value: "alipay",
  },
  {
    label: "payment.wechat",
    value: "wechat",
  },
  {
    label: "payment.transfer",
    value: "transfer",
  },
];

export const STOCK_ENTRY_OPTIONS = [
  { label: "stock_entries.options.adjust", value: "adjust" },
  { label: "stock_entries.options.return", value: "return" },
];

export const PURCHASE_STATUS_OPTIONS = [
  {
    label: "purchase_orders.status.draft",
    value: "draft",
  },
  {
    label: "purchase_orders.status.ordered",
    value: "ordered",
  },
  {
    label: "purchase_orders.status.received",
    value: "received",
  },
  {
    label: "purchase_orders.status.cancelled",
    value: "cancelled",
  },
];
