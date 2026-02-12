/**
 * ==========================================
 * 1. 枚举定义 (Enums)
 * ==========================================
 *
 */

export type UserRole = "admin" | "technician" | "front_desk" | "partner";

export type OrderStatus =
  | "pending_check" // 待检测
  | "pending_quote" // 待报价
  | "approved" // 客户已同意
  | "repairing" // 维修中
  | "waiting_parts" // 等待配件
  | "completed" // 维修完成
  | "delivered" // 已取件
  | "cancelled"; // 已取消

export type PaymentMethod = "cash" | "card" | "transfer" | "wechat" | "alipay";

export type PartQuality =
  | "compatibile"
  | "originale"
  | "rigenerato"
  | "service_pack_original"
  | "incell"
  | "hard_oled"
  | "soft_oled";

export type PoStatus = "draft" | "ordered" | "received" | "cancelled";

export type StockEntryType = "purchase" | "return" | "adjust" | "repair";

export type TransactionType = "income" | "expense";

export type WarrantyStatus = "active" | "expired" | "voided" | "claimed";

export type CategoryType = "component" | "item";

export interface StatusTag {
  label: string;
  color: string;
}

/**
 * ==========================================
 * 2. 核心实体定义 (Tables)
 * ==========================================
 */
// 2.1 员工与权限 (profiles)
export interface IProfile {
  id: string; // uuid
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

// 2.2 客户档案 (customers)
export interface ICustomer {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at: string;
}

// 2.3 供应商 (suppliers)
export interface ISupplier {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  created_at: string;
}

// 2.4 分类 (categories)
export interface ICategory {
  id: number; // serial
  name: string;
  type: CategoryType;
  created_at: string;
}

// 2.5 故障类型 (faults)
export interface IFault {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

// 2.6 品牌 (brands)
export interface IBrand {
  id: number;
  name: string;
}

// 2.7 机型 (models)
export interface IDeviceModel {
  id: number;
  brand_id: number;
  name: string;
  code?: string | null;
  is_tablet: boolean;
  release_year?: number | null;
  created_at: string;
  // 关联字段 (用于 select=*,brands(*))
  brands?: IBrand;
}

// 2.8 维修配件 (inventory_components)
export interface IInventoryComponent {
  id: string;
  sku?: string | null;
  name: string;
  category_id?: number | null;
  supplier_id?: string | null;
  quality: PartQuality;
  stock_quantity: number;
  cost_price: number; // numeric
  suggested_repair_price?: number | null;
  partner_repair_price?: number | null;
  created_at: string;
  // 关联字段
  categories?: ICategory;
  suppliers?: ISupplier;
}

// 2.9 配件兼容性 (component_compatibility)
export interface IComponentCompatibility {
  id: number;
  component_id: string;
  model_id: number;
  // 关联字段
  models?: IDeviceModel;
  inventory_components?: IInventoryComponent;
}

// 2.10 零售商品 (inventory_items)
export interface IInventoryItem {
  id: string;
  sku?: string | null;
  name: string;
  category_id?: number | null;
  stock_quantity: number;
  cost_price: number;
  retail_price: number;
  created_at: string;
  // 关联字段
  categories?: ICategory;
}

// 2.11 进货单 (purchase_orders)
export interface IPurchaseOrder {
  id: string;
  readable_id: number;
  supplier_id?: string | null;
  status: PoStatus;
  total_estimated_cost?: number | null;
  created_by?: string | null;
  expected_arrival_date?: string | null;
  created_at: string;
  // 关联字段
  suppliers?: ISupplier;
  profiles?: IProfile;
  items?: IPurchaseOrderItem[]; // 用于 Form.List
}

export interface IPurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  component_id?: string | null;
  item_id?: string | null;
  product_name?: string | null;
  quantity: number;
  unit_cost?: number | null;
  // 关联字段
  inventory_components?: IInventoryComponent;
  inventory_items?: IInventoryItem;
}

// 2.12 入库记录 (stock_entries)
export interface IStockEntry {
  id: string;
  reference_number?: string | null;
  type: StockEntryType;
  created_by?: string | null;
  created_at: string;
  // 关联字段
  profiles?: IProfile;
}

export interface IStockEntryItem {
  id: string;
  entry_id: string;
  component_id?: string | null;
  item_id?: string | null;
  quantity: number;
  cost_price?: number | null;
}

// 2.13 维修订单 (repair_orders)
export interface IRepairOrder {
  id: string;
  readable_id: number;
  customer_id?: string | null;
  model_id?: number | null;
  imei_sn?: string | null;
  problem_description?: string | null;
  status: OrderStatus;
  labor_cost: number;
  parts_cost: number;
  total_price: number;
  deposit: number;
  warranty_duration_days: number;
  technician_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  // 关联字段 (Refine 中经常需要级联显示)
  customers?: ICustomer;
  models?: IDeviceModel;
  profiles?: IProfile; // 技师
}

export interface IRepairOrderPart {
  id: string;
  repair_order_id: string;
  component_id?: string | null;
  quantity: number;
  unit_price?: number | null;
  // 关联字段
  inventory_components?: IInventoryComponent;
}

// 2.14 零售订单 (sales_orders)
export interface ISalesOrder {
  id: string;
  readable_id: number;
  customer_id?: string | null;
  seller_id?: string | null;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  // 关联字段
  customers?: ICustomer;
  profiles?: IProfile; // 销售员
}

export interface ISalesOrderItem {
  id: string;
  sales_order_id: string;
  item_id?: string | null;
  quantity: number;
  unit_price?: number | null;
  // 关联字段
  inventory_items?: IInventoryItem;
}

// 2.15 财务流水 (transactions)
export interface ITransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category?: string | null;
  payment_method?: PaymentMethod | null;
  description?: string | null;
  repair_order_id?: string | null;
  sales_order_id?: string | null;
  created_by?: string | null;
  created_at: string;
  // 关联字段
  profiles?: IProfile;
  repair_orders?: IRepairOrder;
  sales_orders?: ISalesOrder;
}

// 2.16 保修单 (warranties)
export interface IWarranty {
  id: string;
  readable_id: number;
  repair_order_id: string;
  customer_id: string;
  start_date: string; // date string (YYYY-MM-DD)
  duration_days: number;
  end_date: string; // date string
  coverage_details?: string | null;
  status: WarrantyStatus;
  claim_count: number;
  last_claim_date?: string | null;
  created_at: string;
  // 关联字段
  repair_orders?: IRepairOrder;
  customers?: ICustomer;
}

// Partner 库存查询视图
export interface IPartnerInventoryView {
  component_id: string;
  component_name: string;
  quality: PartQuality;
  in_stock: boolean;
  price: number;
  brand_name: string;
  model_name: string;
}
