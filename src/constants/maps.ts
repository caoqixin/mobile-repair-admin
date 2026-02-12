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
  admin: "管理员",
  technician: "技术员",
  front_desk: "前台",
  partner: "合作伙伴",
};

export const CATEGORY_TYPE_MAP: Record<CategoryType, string> = {
  component: "维修配件",
  item: "前台配件",
};

export const REPAIR_STATUS_MAP: Record<OrderStatus, StatusTag> = {
  pending_check: { color: "orange", label: "待检测" },
  pending_quote: { color: "gold", label: "待报价" },
  approved: { color: "lime", label: "已批准" },
  repairing: { color: "blue", label: "维修中" },
  waiting_parts: { color: "purple", label: "待配件" },
  completed: { color: "green", label: "已完成" },
  delivered: { color: "skyblue", label: "已取机" },
  cancelled: { color: "red", label: "已取消" },
};

export const QUALITY_MAP: Record<PartQuality, string> = {
  compatibile: "组装 (Compatibile)",
  originale: "原装 (Originale)",
  rigenerato: "后压原装 (Rigenerato)",
  service_pack_original: "售后原装 (Service Pack Originale)",
  incell: "LCD 屏幕 (schermo lcd)",
  hard_oled: "硬性 OLED 屏幕 (schermo hard oled)",
  soft_oled: "柔性 OLED 屏幕 (schermo morbido oled)",
};

export const STOCK_ENTRIES_TYPE: Record<
  StockEntryType,
  { color: string; label: string }
> = {
  purchase: { color: "blue", label: "采购入库" },
  return: { color: "orange", label: "退货入库" },
  adjust: { color: "green", label: "盘盈入库" },
  repair: { color: "skyblue", label: "维修订单" },
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
