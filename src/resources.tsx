import {
  DashboardOutlined,
  DollarOutlined,
  ImportOutlined,
  InboxOutlined,
  PhoneOutlined,
  ProductOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ToolOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ResourceProps } from "@refinedev/core";

export const resources: ResourceProps[] = [
  {
    name: "dashboard",
    list: "/",
    meta: {
      icon: <DashboardOutlined />,
      translateKey: "resources.dashboard",
    },
  },
  // 报价系统
  {
    name: "quote",
    list: "/quote",
    meta: { translateKey: "resources.quote", icon: <SearchOutlined /> },
  },
  {
    // 维修核心业务
    name: "repair_orders",
    list: "/repairs",
    create: "/repairs/create",
    edit: "/repairs/edit/:id",
    show: "/repairs/show/:id",
    meta: {
      translateKey: "resources.repairOrders",
      icon: <ToolOutlined />,
      color: "#1890ff",
    },
  },
  {
    name: "warranties",
    list: "/warranties",
    show: "/warranties/show/:id",
    meta: {
      translateKey: "resources.warranties", // Garanzie
      icon: <SafetyCertificateOutlined />,
    },
  },
  {
    // 零售业务 (配件、翻新机直接销售
    name: "sales_orders",
    list: "/sales",
    create: "/sales/create",
    show: "/sales/show/:id",
    meta: {
      translateKey: "resources.salesOrders",
      icon: <ShoppingOutlined />,
    },
  },
  {
    // 客户管理
    name: "customers",
    list: "/customers",
    create: "/customers/create",
    edit: "/customers/edit/:id",
    show: "/customers/show/:id",
    meta: {
      translateKey: "resources.customers",
      icon: <UserOutlined />,
    },
  },
  // 库存管理
  {
    name: "inventory",
    meta: {
      translateKey: "resources.inventory",
      icon: <InboxOutlined />,
    },
  },
  {
    // 库存管理 - 配件
    name: "inventory_components",
    list: "/inventory_components",
    create: "/inventory_components/create",
    edit: "/inventory_components/edit/:id",
    show: "/inventory_components/show/:id",
    meta: {
      translateKey: "resources.inventoryComponents",
      icon: <InboxOutlined />,
      parent: "inventory", // 在菜单中折叠
    },
  },
  {
    // 库存管理 - 商品
    name: "inventory_items",
    list: "/inventory_items",
    create: "/inventory_items/create",
    edit: "/inventory_items/edit/:id",
    show: "/inventory_items/show/:id",
    meta: {
      translateKey: "resources.inventoryItems",
      icon: <InboxOutlined />,
      parent: "inventory",
    },
  },
  {
    name: "purchase_orders",
    list: "/supply-chain/orders",
    create: "/supply-chain/orders/create",
    show: "/supply-chain/orders/show/:id",
    edit: "/supply-chain/orders/edit/:id",
    meta: {
      translateKey: "进货单 (PO",
      icon: <ShoppingCartOutlined />,
      parent: "inventory",
    },
  },
  {
    name: "stock_entries",
    list: "/supply-chain/entries",
    create: "/supply-chain/entries/create",
    show: "/supply-chain/entries/show/:id",
    meta: {
      translateKey: "入库记录",
      icon: <ImportOutlined />,
      parent: "inventory",
      canDelete: false, // 入库单严禁删除，保证账目可追溯
    },
  },
  {
    // 供应商管理
    name: "suppliers",
    list: "/suppliers",
    create: "/suppliers/create",
    edit: "/suppliers/edit/:id",
    meta: {
      translateKey: "resources.suppliers",
      icon: <UsergroupAddOutlined />,
    },
  },
  {
    // 财务流水
    name: "transactions",
    list: "/finance/transactions",
    create: "/finance/transactions/create", // 用于手动录入支出
    meta: {
      translateKey: "resources.transactions",
      icon: <DollarOutlined />,
    },
  },
  // 系统设置
  {
    name: "settings",
    meta: {
      translateKey: "resources.settings",
      icon: <SettingOutlined />,
    },
  },
  {
    // 手机型号基础数据
    name: "device_models",
    list: "/settings/models",
    create: "/settings/models/create",
    edit: "/settings/models/edit/:id",
    show: "/settings/models/show/:id",
    meta: {
      translateKey: "resources.deviceModels",
      parent: "settings",
      icon: <PhoneOutlined />,
    },
  },
  {
    // 分类
    name: "categories",
    list: "/settings/categories",
    create: "/settings/categories/create",
    edit: "/settings/categories/edit/:id",
    meta: {
      translateKey: "resources.categories",
      parent: "settings",
      icon: <ProductOutlined />,
    },
  },
  {
    // 手机维修故障
    name: "faults",
    list: "/settings/faults",
    create: "/settings/faults/create",
    edit: "/settings/faults/edit/:id",
    meta: {
      translateKey: "resources.faults",
      parent: "settings",
      icon: <ToolOutlined />,
    },
  },
  {
    // 用户与权限 [cite: 133]
    name: "profiles",
    list: "/settings/staff",
    create: "/settings/staff/create",
    edit: "/settings/staff/edit/:id",
    meta: {
      translateKey: "resources.profiles",
      parent: "settings",
      icon: <UserOutlined />,
    },
  },
];
