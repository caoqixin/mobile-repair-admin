import {
  PART_QUALITY_MAP,
  REPAIR_STATUS_MAP,
  STOCK_ENTRIES_TYPE,
} from "../constants";
import { OrderStatus, PartQuality, StockEntryType } from "../interface";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "default"; // 草稿
    case "ordered":
      return "processing"; // 已下单
    case "received":
      return "success"; // 已入库
    case "cancelled":
      return "error"; // 已取消
    default:
      return "default";
  }
};

export const getRepairStatusTag = (status: OrderStatus) => {
  return REPAIR_STATUS_MAP[status];
};

// 入库类型颜色映射
export const getTypeTag = (type: StockEntryType) => {
  return STOCK_ENTRIES_TYPE[type] || { color: "default", label: type };
};

export const getQualityColor = (quality: PartQuality) => {
  return PART_QUALITY_MAP[quality];
};

/**
 * 原生实现的深度比较函数 (类似 _.isEqual)
 * 支持：基础类型, 对象(忽略Key顺序), 数组, Date, RegExp, NaN
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  // 1. 全等检查 (处理基础类型 string, number, boolean, undefined, null)
  if (obj1 === obj2) return true;

  // 2. 处理 NaN (JS中 NaN !== NaN，但在数据比较中通常认为相等)
  if (Number.isNaN(obj1) && Number.isNaN(obj2)) return true;

  // 3. 如果其中一个是基础类型(且不相等) 或 null，直接返回 false
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }

  // 4. 处理特殊对象：Date
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // 5. 处理特殊对象：RegExp
  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.toString() === obj2.toString();
  }

  // 6. 处理数组 (Array)
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    // 递归比较数组的每一项
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  // 7. 处理普通对象 (Object) - 这是解决你问题的核心
  // 如果一方是数组一方是对象，返回 false
  if (Array.isArray(obj1) || Array.isArray(obj2)) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 属性数量不同，肯定不相等
  if (keys1.length !== keys2.length) return false;

  // 遍历 obj1 的所有 key
  for (const key of keys1) {
    // 检查 obj2 是否有这个 key
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;

    // 递归比较值
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}
