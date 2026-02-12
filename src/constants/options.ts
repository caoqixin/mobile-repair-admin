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
    label: "通用 (Generale)",
    options: [
      { label: "组装 (Compatibile)", value: "compatibile" },
      { label: "原装 (Originale)", value: "originale" },
      { label: "后压原装 (Rigenerato)", value: "rigenerato" },
      {
        label: "售后原装 (Service Pack Originale)",
        value: "service_pack_original",
      },
    ],
  },
  {
    label: "苹果屏幕 (Riservata schermo iphone)",
    options: [
      { label: "LCD 屏幕 (schermo lcd)", value: "incell" },
      { label: "硬性 OLED 屏幕 (schermo hard oled)", value: "hard_oled" },
      { label: "柔性 OLED 屏幕 (schermo morbido oled)", value: "soft_oled" },
    ],
  },
];
