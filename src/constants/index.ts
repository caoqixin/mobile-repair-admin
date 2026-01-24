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
