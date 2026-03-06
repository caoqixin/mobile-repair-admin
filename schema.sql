-- ==============================================================================
-- 📱 Mobile Repair ERP 数据库架构定义
-- 版本: 1.0.0
-- 描述: 包含所有核心业务表、视图、自动化触发器及权限设置
-- ==============================================================================

-- ==============================================================================
-- 1. 基础环境设置 (Extensions & Enums)
-- ==============================================================================

-- 启用 UUID 生成扩展 (用于主键)
create extension if not exists "uuid-ossp";
-- 启用 pg_cron 定时任务扩展 (用于每日检查保修过期等)
create extension if not exists "pg_cron";

-- 定义枚举类型 (Enums)
-- 用户角色
do $$ begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('admin', 'technician', 'front_desk', 'partner');
    end if;
end $$;

-- 维修订单状态
do $$ begin
    if not exists (select 1 from pg_type where typname = 'order_status') then
        create type public.order_status as enum (
            'pending_check',   -- 待检测
            'pending_quote',   -- 待报价
            'approved',        -- 已批准/待维修
            'repairing',       -- 正在维修
            'waiting_parts',   -- 等待配件
            'completed',       -- 已完成
            'delivered',       -- 已取机
            'cancelled'        -- 已取消
        );
    end if;
end $$;

-- 支付方式
do $$ begin
    if not exists (select 1 from pg_type where typname = 'payment_method') then
        create type public.payment_method as enum ('cash', 'card', 'transfer', 'wechat', 'alipay'); 
    end if;
end $$;

-- 配件质量等级
do $$ begin
    if not exists (select 1 from pg_type where typname = 'part_quality') then
        create type public.part_quality as enum ('compatibile', 'originale', 'rigenerato', 'service_pack_original', 'incell', 'hard_oled', 'soft_oled');
    end if;
end $$;

-- 采购订单状态
do $$ begin
    if not exists (select 1 from pg_type where typname = 'po_status') then
        create type public.po_status as enum ('draft', 'ordered', 'received', 'cancelled');
    end if;
end $$;

-- 库存变动类型
do $$ begin
    if not exists (select 1 from pg_type where typname = 'stock_entry_type') then
        create type public.stock_entry_type as enum (
            'purchase', -- 进货入库
            'repair',   -- 维修消耗
            'return',   -- 退货
            'adjust'    -- 盘点调整
        );
    end if;
end $$;

-- 交易/流水类型
do $$ begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type public.transaction_type as enum ('income', 'expense');
    end if;
end $$;

-- 保修状态
do $$ begin
    if not exists (select 1 from pg_type where typname = 'warranty_status') then
        create type public.warranty_status as enum ('active', 'expired', 'voided', 'claimed');
    end if;
end $$;

-- ==============================================================================
-- 2. 核心实体表 (Profiles, Customers, Suppliers)
-- ==============================================================================

-- 2.1 用户档案表 (关联 Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key, -- 与 auth.users 同步
  full_name text,
  email text,
  role public.user_role default 'front_desk',
  created_at timestamp with time zone default now()
);
comment on table public.profiles is '系统用户/员工档案';

-- 2.2 客户表
create table if not exists public.customers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text unique,
  email text,
  notes text,
  created_at timestamp with time zone default now()
);
comment on table public.customers is '终端客户信息';

-- 2.3 供应商表
create table if not exists public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  website text,
  description text,
  created_at timestamp with time zone default now()
);
comment on table public.suppliers is '配件或商品供应商';

-- ==============================================================================
-- 3. 产品与库存管理 (Models, Inventory)
-- ==============================================================================

-- 3.1 品牌表
create table if not exists public.brands (
  id serial primary key,
  name text unique not null -- Apple, Samsung, Xiaomi
);

-- 3.2 设备型号表
create table if not exists public.models (
  id serial primary key,
  brand_id integer references public.brands(id),
  name text not null, -- iPhone 13 Pro
  code text, 
  is_tablet boolean default false,
  release_year integer,
  created_at timestamp with time zone default now()
);
comment on table public.models is '手机/平板具体型号';

-- 3.3 故障类型库 (用于快速开单)
create table if not exists public.faults (
  id serial primary key,
  name text not null, -- 屏幕破碎, 电池老化
  description text
);

-- 3.4 基础分类
create table if not exists public.categories (
  id serial primary key,
  name text not null, 
  type text check (type in ('component', 'item')),
  created_at timestamp with time zone default now()
);

-- 3.5 库存商品 - 维修配件 (Inventory Components)
-- 专用于维修过程中消耗的配件，如屏幕、电池
create table if not exists public.inventory_components (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- iPhone 13 屏幕 (Originale)
  sku text unique,
  category_id integer references public.categories(id), -- 分类
  quality public.part_quality default 'compatibile',
  
  cost_price numeric(10, 2) default 0, -- 进货成本
  suggested_repair_price numeric(10, 2) default 0, -- 建议维修对外报价
  partner_repair_price numeric(10, 2),  -- 合作伙伴价格
  
  stock_quantity integer default 0, -- 当前库存
  
  supplier_id uuid references public.suppliers(id),
  created_at timestamp with time zone default now()
);

-- 3.6 配件-机型兼容表
create table if not exists public.component_compatibility (
  id serial primary key,
  component_id uuid references public.inventory_components(id) on delete cascade,
  model_id integer references public.models(id) on delete cascade,
  unique(component_id, model_id)
);

-- 3.7 库存商品 - 零售商品 (Inventory Items)
-- 专用于前台直接销售的商品，如手机壳、充电线
create table if not exists public.inventory_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text unique,
  category_id integer references public.categories(id), -- 配件分类
  
  cost_price numeric(10, 2) default 0,
  retail_price numeric(10, 2) default 0, -- 零售价
  
  stock_quantity integer default 0,
  
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 4. 业务交易表 (Repairs, Sales, Stock Entries)
-- ==============================================================================

-- 4.1 维修订单主表
create table if not exists public.repair_orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id text, -- 人类可读单号 (如 RO-2023-0001)
  
  customer_id uuid references public.customers(id) not null,
  model_id integer references public.models(id) not null,
  technician_id uuid references public.profiles(id), -- 负责技师
  warranty_id uuid references public.warranties(id), -- 返修
  
  imei_sn text, -- 设备串号
  problem_description text, -- 故障描述 (可能包含多个 fault name)
  additional_notes text,
  status public.order_status default 'pending_check',
  
  -- 财务字段
  total_price numeric(10, 2) default 0.00, -- 订单总价 (包含人工 + 配件利润)
  deposit numeric(10, 2) default 0.00, -- 已付定金
  warranty_duration_days integer default 90, -- 质保天数
  payment_method public.payment_method default 'cash',
  
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);
comment on table public.repair_orders is '核心维修工单表';

-- 4.2 维修订单 - 配件明细
create table if not exists public.repair_order_parts (
  id uuid default uuid_generate_v4() primary key,
  repair_order_id uuid references public.repair_orders(id) on delete cascade,
  component_id uuid references public.inventory_components(id),
  
  quantity integer default 1,
  unit_price numeric(10, 2) -- 销售给客户的单价 (可能为0如果是包干价)
);

-- 4.3 零售销售订单
create table if not exists public.sales_orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id text,
  
  total_amount numeric(10, 2) default 0,
  payment_method public.payment_method default 'cash',
  
  seller_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 4.4 零售订单 - 商品明细
create table if not exists public.sales_order_items (
  id uuid default uuid_generate_v4() primary key,
  sales_order_id uuid references public.sales_orders(id) on delete cascade,
  item_id uuid references public.inventory_items(id),
  
  quantity integer default 1,
  unit_price numeric(10, 2) -- 实收单价
);

-- 4.5 库存变动流水 (Stock Entries)
-- 所有的库存增减都必须通过此表记录
create table if not exists public.stock_entries (
  id uuid default uuid_generate_v4() primary key,
  reference_number text, -- 关联单号 (如 RO-xxx, PO-xxx)
  type public.stock_entry_type not null,
  
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 4.6 库存变动明细 (Stock Entry Items)
create table if not exists public.stock_entry_items (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.stock_entries(id) on delete cascade,
  
  -- 既可以是维修配件，也可以是零售商品 (两列选填其一)
  component_id uuid references public.inventory_components(id),
  item_id uuid references public.inventory_items(id),
  
  quantity integer not null, -- 正数入库，负数出库
  cost_price numeric(10, 2) default 0 -- 变动时的成本价(用于核算)
);

-- 4.8 进货单
create table if not exists public.purchase_orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id text,
  supplier_id uuid references public.suppliers(id),
  status public.po_status default 'draft',
  total_estimated_cost numeric(10, 2),
  created_by uuid references public.profiles(id),
  expected_arrival_date date,
  created_at timestamp with time zone default now()
);
-- 4.9 进货单详情
create table if not exists public.purchase_order_items (
  id uuid default uuid_generate_v4() primary key,
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade,
  component_id uuid references public.inventory_components(id), 
  item_id uuid references public.inventory_items(id), 
  product_name text, 
  quantity integer default 1,
  unit_cost numeric(10, 2)
);

-- 4.10 保修单表 (Warranties)
create table if not exists public.warranties (
  id uuid default uuid_generate_v4() primary key,
  readable_id text, 
  repair_order_id uuid references public.repair_orders(id) unique, -- 一个维修单对应一个保修
  customer_id uuid references public.customers(id),
  
  start_date date default CURRENT_DATE,
  duration_days integer default 90,
  end_date date generated always as (start_date + duration_days) stored,

  coverage_details text, 
  status public.warranty_status default 'active', -- active, expired, voided

  claim_count integer default 0, 
  last_claim_date date,
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 5. 财务流水表
-- ==============================================================================

-- 5.1 财务流水表 (Transactions)
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  
  type public.transaction_type not null, -- 收入 or 支出

  category text, -- 分类 (如: 'Rent', 'Utilities', 'Salary', 'Misc Sales')
  amount numeric(10, 2) not null,
  description text,
  payment_method public.payment_method,

  repair_order_id uuid references public.repair_orders(id), -- 关联维修单
  sales_order_id uuid references public.sales_orders(id), -- 关联零售单
  
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 6. 仪表盘视图 (Dashboard SQL Views)
-- ==============================================================================

-- 6.1 年度统计视图
CREATE OR REPLACE VIEW public.dashboard_yearly_stats with (security_invoker = on) AS
SELECT
    CAST(EXTRACT(YEAR FROM created_at) AS INTEGER) AS year,
    COUNT(*) FILTER (WHERE status != 'cancelled') AS repair_count,
    COALESCE(SUM(total_price) FILTER (WHERE status != 'cancelled'), 0) AS total_revenue
FROM public.repair_orders
GROUP BY 1
ORDER BY 1 DESC;

-- 6.2 月度统计视图
CREATE OR REPLACE VIEW public.dashboard_monthly_stats with (security_invoker = on) AS
SELECT
    TO_CHAR(created_at, 'YYYY-MM') AS month_str,
    CAST(EXTRACT(YEAR FROM created_at) AS INTEGER) AS year,
    CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) AS month,
    COUNT(*) FILTER (WHERE status != 'cancelled') AS repair_count,
    COALESCE(SUM(total_price) FILTER (WHERE status != 'cancelled'), 0) AS total_revenue
FROM public.repair_orders
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- 6.3 库存资产汇总视图
CREATE OR REPLACE VIEW public.dashboard_inventory_summary with (security_invoker = on) AS
-- 维修配件
SELECT
    'components' AS category,
    COUNT(*) AS sku_count, 
    COALESCE(SUM(stock_quantity), 0) AS total_quantity, 
    COALESCE(SUM(cost_price * stock_quantity), 0) AS total_value
FROM public.inventory_components
UNION ALL
-- 前台商品
SELECT
    'items' AS category,
    COUNT(*) AS sku_count,
    COALESCE(SUM(stock_quantity), 0) AS total_quantity,
    COALESCE(SUM(cost_price * stock_quantity), 0) AS total_value
FROM public.inventory_items;

-- 6.4 订单状态分布视图
CREATE OR REPLACE VIEW public.dashboard_status_stats with (security_invoker = on) AS
SELECT status, COUNT(*) AS count
FROM public.repair_orders
GROUP BY status;

-- 6.5 热门机型视图
CREATE OR REPLACE VIEW public.dashboard_top_models with (security_invoker = on) AS
SELECT
    m.name AS model_name,
    COUNT(*) AS repair_count
FROM public.repair_orders ro
JOIN public.models m ON ro.model_id = m.id
GROUP BY m.name
ORDER BY repair_count DESC;

-- 6.7. 核心统计视图 (本月/本年 收支总额)
CREATE OR REPLACE VIEW public.dashboard_financial_summary with (security_invoker = on)
AS
SELECT
    -- 本月收入
    COALESCE(SUM(CASE WHEN type = 'income' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as month_income,
    -- 本月支出
    COALESCE(SUM(CASE WHEN type = 'expense' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as month_expense,
    -- 本年收入
    COALESCE(SUM(CASE WHEN type = 'income' AND date_trunc('year', created_at) = date_trunc('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as year_income,
    -- 本年支出
    COALESCE(SUM(CASE WHEN type = 'expense' AND date_trunc('year', created_at) = date_trunc('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as year_expense
FROM transactions;

-- 6.8 分类占比视图 (按类型和分类聚合)
CREATE OR REPLACE VIEW public.dashboard_category_stats with (security_invoker = on) 
AS
SELECT 
    type,
    category,
    SUM(amount) as total_amount
FROM transactions
GROUP BY type, category
ORDER BY total_amount DESC;


-- 6.8 统计维修故障
CREATE OR REPLACE VIEW public.dashboard_fault_stats 
with (security_invoker = on) AS
WITH unnested_faults AS (
 -- 拆分逗号
  SELECT 
    ro.id AS order_id,
    trim(unnest(string_to_array(ro.problem_description, ','))) AS fault_name,
    m.name AS model_name
  FROM public.repair_orders ro
  JOIN public.models m ON ro.model_id = m.id
  WHERE ro.problem_description IS NOT NULL AND ro.problem_description != ''
),
fault_models_count AS (
  -- 统计 [故障] + [机型] 的组合次数
  SELECT 
    fault_name, 
    model_name, 
    COUNT(order_id)::integer AS model_repair_count
  FROM unnested_faults
  WHERE fault_name != ''
  GROUP BY fault_name, model_name
)
-- 汇总为最终格式，将机型明细打包成 JSON 数组返回给前端
SELECT 
  fmc.fault_name,
  SUM(fmc.model_repair_count)::integer AS repair_count,
  json_agg(json_build_object('model_name', fmc.model_name, 'count', fmc.model_repair_count)) AS models_breakdown
FROM fault_models_count fmc
GROUP BY fmc.fault_name
ORDER BY repair_count DESC;



-- ==============================================================================
-- 7. Partner 视图表
-- ==============================================================================

create or replace view public.partner_inventory_view with (security_invoker = on) as 
select 
  c.id as component_id,
  c.name as component_name,
  c.quality,
  (c.stock_quantity > 0) as in_stock, 
  c.partner_repair_price as price, 
  b.name as brand_name,
  m.name as model_name
from public.inventory_components c
left join public.component_compatibility cc on c.id = cc.component_id
left join public.models m on cc.model_id = m.id
left join public.brands b on m.brand_id = b.id
where c.partner_repair_price is not null;

-- ==============================================================================
-- 8. 核心自动化函数与触发器 (Functions & Triggers)
-- ==============================================================================

-- 8.1 生成可读单号 (Readable ID Generator)
-- 效果: 自动生成 RO-20230001, SO-20230001 等格式
-- A. 核心生成函数 (支持每年重置，格式: PREFIX-YYYY-0001)
CREATE OR REPLACE FUNCTION public.generate_tech_id(prefix text, digits integer DEFAULT 4)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- 以拥有者权限运行，确保能操作序列
AS $$
DECLARE
    year_str text;
    seq_name text;
    next_val integer;
    new_id text;
BEGIN
    -- 获取当前年份
    year_str := to_char(now(), 'YYYY');
    -- 序列命名规则: seq_RO_2026
    seq_name := 'seq_' || prefix || '_' || year_str;

    BEGIN
        -- 尝试获取下一个值
        EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
    EXCEPTION WHEN undefined_table THEN
        -- 如果序列不存在(比如跨年了)，则创建新序列，从1开始
        EXECUTE 'CREATE SEQUENCE ' || seq_name || ' START 1';
        EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
    END;

    -- 拼接结果: RO-2026-0001
    new_id := prefix || '-' || year_str || '-' || lpad(next_val::text, digits, '0');
    RETURN new_id;
END;
$$;

-- B. 统一触发器函数
CREATE OR REPLACE FUNCTION public.set_readable_id_trigger()
RETURNS TRIGGER AS $$
DECLARE
    prefix_code text;
BEGIN
    -- 1. 根据表名决定前缀 (在此处维护所有表的映射)
    CASE TG_TABLE_NAME
        WHEN 'repair_orders' THEN prefix_code := 'RO'; -- 维修单
        WHEN 'sales_orders'  THEN prefix_code := 'SO'; -- 销售单
        WHEN 'purchase_orders' THEN prefix_code := 'PO'; -- 库存变动
        WHEN 'warranties'    THEN prefix_code := 'WAR';-- 保修单
        ELSE RAISE EXCEPTION 'Table % not supported for readable_id generation', TG_TABLE_NAME;
    END CASE;

    -- 2. 只有当 readable_id 为空时才生成
    -- 只有当 readable_id 为空时才生成 (允许手动覆盖，虽然很少用)
    IF NEW.readable_id IS NULL THEN
        NEW.readable_id := public.generate_tech_id(prefix_code);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- C. 批量绑定触发器

-- 绑定 sales_orders
DROP TRIGGER IF EXISTS trg_set_id_sales ON public.sales_orders;
CREATE TRIGGER trg_set_id_sales
BEFORE INSERT ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.set_readable_id_trigger();

-- 绑定 warranties
DROP TRIGGER IF EXISTS trg_set_id_warranties ON public.warranties;
CREATE TRIGGER trg_set_id_warranties
BEFORE INSERT ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.set_readable_id_trigger();

-- 绑定 purchase_orders
DROP TRIGGER IF EXISTS trg_set_id_purchase ON public.purchase_orders;
CREATE TRIGGER trg_set_id_purchase
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.set_readable_id_trigger();

-- 绑定 repair_orders
DROP TRIGGER IF EXISTS trg_set_id_repair ON public.repair_orders;
CREATE TRIGGER trg_set_id_repair
BEFORE INSERT ON public.repair_orders
FOR EACH ROW EXECUTE FUNCTION public.set_readable_id_trigger();

-- 8.2 通用库存更新触发器
-- 效果: 监听 stock_entry_items 的插入，自动加减 components 或 items 表的库存
CREATE OR REPLACE FUNCTION public.update_inventory_from_entry_item()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理维修配件 (Components)
    IF NEW.component_id IS NOT NULL THEN
        UPDATE public.inventory_components
        SET 
          -- 累加库存 (COALESCE 防止原库存为 NULL)
            stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            
            -- 更新进价：只有当新录入的成本大于 0 时才更新
            -- 这样设计是为了防止例如“赠品入库”填了0成本，导致把进货价洗成0了
            cost_price = CASE 
                            WHEN NEW.cost_price > 0 THEN NEW.cost_price 
                            ELSE cost_price 
                         END
        WHERE id = NEW.component_id;
    END IF;

    -- 处理零售商品 (Items)
    IF NEW.item_id IS NOT NULL THEN
        UPDATE public.inventory_items
        SET 
            stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            cost_price = CASE 
                            WHEN NEW.cost_price > 0 THEN NEW.cost_price 
                            ELSE cost_price 
                         END
        WHERE id = NEW.item_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定 触发器
DROP TRIGGER IF EXISTS trg_update_inventory_on_entry ON public.stock_entry_items;
CREATE TRIGGER trg_update_inventory_on_entry
AFTER INSERT ON public.stock_entry_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_from_entry_item();

-- 8.3 进货单收货处理
-- ---------------------------------------------------------
-- 进货单收货处理触发器 (PO Receipt Orchestrator)
-- 目的: 当 PO 状态变为 'received' 时，自动在 stock_entries 和 stock_entry_items 表
--      中创建记录。
-- 注意: 这里不再直接 UPDATE inventory 表，而是通过插入 stock_entry_items 
--      来触发上面的 PART 1 触发器，实现解耦。
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_po_receipt()
RETURNS TRIGGER AS $$
DECLARE
    po_item RECORD;       -- 用于遍历 PO 子项
    new_entry_id uuid;    -- 新生成的 stock_entries ID
BEGIN
    -- 只有当状态从 'ordered' (或 draft) 变为 'received' 时才触发
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        
        -- 1. 创建入库单主表 (Header)
        INSERT INTO public.stock_entries (
            reference_number,  -- 关联单号 (如 PO-2026-001)
            type,              -- 类型固定为 'purchase'
            created_by
            -- created_at 会自动使用默认值 now()
        )
        VALUES (
            NEW.readable_id,   
            'purchase',
            NEW.created_by
        )
        RETURNING id INTO new_entry_id; -- 获取新 ID

        -- 2. 遍历该 PO 下的所有商品项
        FOR po_item IN SELECT * FROM public.purchase_order_items WHERE purchase_order_id = NEW.id LOOP
            
            -- 3. 插入入库单明细 (Items)
            -- ⚠️ 关键: 这一步插入操作，会自动触发 PART 1 中的 trg_update_inventory_on_entry
            -- 从而自动完成库存和成本的更新。
            INSERT INTO public.stock_entry_items (
                entry_id,
                component_id,
                item_id,
                quantity,
                cost_price
            )
            VALUES (
                new_entry_id,
                po_item.component_id,
                po_item.item_id,
                po_item.quantity,
                po_item.unit_cost
            );
            
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器
DROP TRIGGER IF EXISTS trg_po_receipt ON public.purchase_orders;
CREATE TRIGGER trg_po_receipt
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_po_receipt();

-- ---------------------------------------------------------
-- 8.4: 进货单锁定触发器 (PO Security Lock)
-- 目的: 防止已入库(received)的订单被误修改或删除，保证账实相符。
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_po_update_if_received()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果旧状态已经是 received，并且试图修改或删除
    IF OLD.status = 'received' THEN
        RAISE EXCEPTION '⛔️ 操作被拒绝：该订单已入库锁定 (Status: Received)，无法修改或删除。如需调整库存，请创建新的手动入库单或出库单。';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器
DROP TRIGGER IF EXISTS trg_lock_received_po ON public.purchase_orders;
CREATE TRIGGER trg_lock_received_po
BEFORE UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_po_update_if_received();

-- 8.5 销售是件销售商品库存
CREATE OR REPLACE FUNCTION public.decrease_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- 直接扣减库存 (Stock = Stock - Sold Quantity)
    -- 仅针对 inventory_items (零售商品)
    IF NEW.item_id IS NOT NULL THEN
        UPDATE public.inventory_items
        SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity
        WHERE id = NEW.item_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定到销售子表：每卖出一项，就执行一次扣减
DROP TRIGGER IF EXISTS trg_decrease_inventory_on_sale ON public.sales_order_items;
CREATE TRIGGER trg_decrease_inventory_on_sale
AFTER INSERT ON public.sales_order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrease_inventory_on_sale();

-- 8.6 维修完成时创建保修单 和 减库存
CREATE OR REPLACE FUNCTION public.handle_repair_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_entry_id uuid; -- 用于存储生成的出库单ID
BEGIN
    -- =====================================================
    -- 场景: 订单完成 (Completed)
    -- 动作: 1. 设置complted_at 时间  2. 生成出库单(扣减库存)
    -- =====================================================
    if NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 1. 更新完成时间
        UPDATE public.repair_orders 
        SET completed_at = now() 
        WHERE id = NEW.id;

         -- 2. 自动扣减库存 (通过生成 Stock Entry)
        -- 先检查是否已经扣过库存(防止来回点击完成重复扣除)
        IF NOT EXISTS (SELECT 1 FROM public.stock_entries WHERE reference_number = NEW.readable_id AND type = 'repair') THEN
            
            -- A. 创建出库单头 (Header)
            INSERT INTO public.stock_entries (
                reference_number,
                type,        -- 类型: 维修出库
                created_by   -- 记录是哪个技师操作的(如果有)
            )
            VALUES (
                NEW.readable_id,
                'repair',    
                NEW.technician_id
            )
            RETURNING id INTO new_entry_id;

            -- B. 批量插入出库明细 (Items)
            -- 注意: quantity 变为负数，以此触发通用触发器进行扣减
            INSERT INTO public.stock_entry_items (
                entry_id, component_id, quantity, cost_price
            )
            SELECT 
                new_entry_id,
                component_id,
                -quantity,  -- 🔥 负数 = 扣库存
                0           -- 维修消耗不影响进货均价，填0
            FROM public.repair_order_parts
            WHERE repair_order_id = NEW.id;

        END IF;
    END IF;

    -- =====================================================
    -- 场景: 订单已取机 (delivered)
    -- 动作: 1. 生成保修单  
    -- =====================================================
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- 【分支 1】：如果是返修单 (warranty_id 有值)
        IF NEW.warranty_id IS NOT NULL THEN
            -- 恢复原保修单状态，并计数 +1
            UPDATE public.warranties
            SET 
                status = 'active',           -- 恢复激活
                claim_count = COALESCE(claim_count, 0) + 1,
                last_claim_date = NOW()
            WHERE id = NEW.warranty_id;
        -- 【分支 2】：如果是普通维修单
        --  自动创建保修单 (Warranties)
        ELSE

            INSERT INTO public.warranties (
                repair_order_id, customer_id, start_date, duration_days, status
            )
            VALUES (
                NEW.id, NEW.customer_id, CURRENT_DATE, 
                COALESCE(NEW.warranty_duration_days, 90), 'active'
            )
            ON CONFLICT (repair_order_id) DO NOTHING;

        END IF;
  
    END IF;

    -- =====================================================
    -- 场景: 订单取消 (Cancelled)
    -- 动作: 删除配件记录 (如果订单还没完成过)
    -- =====================================================
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- 如果之前已经完成了(扣了库存)，现在又要取消，逻辑会比较复杂(需要回滚库存)。
        -- 这里假设简单的场景：未完成的订单取消，直接清空配件预选。
        DELETE FROM public.repair_order_parts
        WHERE repair_order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器：在维修订单更新后执行
DROP TRIGGER IF EXISTS trg_repair_status_change ON public.repair_orders;
CREATE TRIGGER trg_repair_status_change
AFTER UPDATE ON public.repair_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_repair_status_change();

CREATE OR REPLACE FUNCTION public.handle_warranty_claim_start()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有当这是一个返修单 (warranty_id 有值) 时触发
    IF NEW.warranty_id IS NOT NULL THEN
        UPDATE public.warranties
        SET status = 'claimed'
        WHERE id = NEW.warranty_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器
DROP TRIGGER IF EXISTS trg_warranty_claim_start ON public.repair_orders;
CREATE TRIGGER trg_warranty_claim_start
AFTER INSERT ON public.repair_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_warranty_claim_start();

-- 8.7 获取当前用户角色 helper
create or replace function public.get_my_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;


-- 8.7.1 用户注册处理函数


create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public -- 强制使用 public 路径
as $$
declare
  user_full_name text;
  user_role_text text;
  final_role public.user_role;
begin
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_role_text := new.raw_user_meta_data->>'role';

  begin
    if user_role_text is null or user_role_text = '' then
      final_role := 'technician'::public.user_role;
    else
      final_role := user_role_text::public.user_role;
    end if;
  exception when others then
    final_role := 'technician'::public.user_role;
  end;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, user_full_name, final_role);
  
  return new;
end;
$$;



drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 8.8 定时任务: 自动标记过期保修单
CREATE OR REPLACE FUNCTION public.check_and_expire_warranties()
RETURNS void AS $$
BEGIN
    UPDATE public.warranties
    SET status = 'expired'
    WHERE status = 'active' AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 每天凌晨 3:00 执行
-- SELECT cron.schedule('daily-warranty-check', '0 3 * * *', $$SELECT public.check_and_expire_warranties()$$);

-- ==============================================================================
--8.9 财务流水自动生成函数
-- 逻辑: 
-- 1. 维修单变为 'delivered' (已取机) -> 记一笔 income
-- 2. 销售单创建 (Insert) -> 记一笔 income
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_income_transaction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER -- 以管理员权限运行，防止普通员工无权写入财务表
AS $$
DECLARE
    trans_desc text;
    user_id uuid;
BEGIN
    -- ==================================================================
    -- 场景 A: 维修单 (Repair Orders) 更新状态
    -- ==================================================================
    IF TG_TABLE_NAME = 'repair_orders' THEN
        -- 只有当状态 **变为** delivered (已取机) 时才触发
        -- 注意：通常 'completed' 是修完，'delivered' 是客户拿走并付款
        -- 如果您的业务逻辑是 completed 就收款，请将下面的 'delivered' 改为 'completed'
        IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
            
            -- 构建描述
            trans_desc := '维修收入 - 单号: ' || NEW.readable_id;
            
            -- 尝试获取操作人 (如果是在 API 调用中)
            user_id := auth.uid(); 

            INSERT INTO public.transactions (
                type, 
                category, 
                amount, 
                description, 
                payment_method, 
                repair_order_id, 
                created_by,
                created_at
            ) VALUES (
                'income',                -- 固定为收入
                'Repair Service',        -- 分类
                NEW.final_price,         -- 金额 (维修单的最终价格)
                trans_desc,              -- 描述
                NEW.payment_method,                  -- 默认支付方式 (建议维修单表加 payment_method 字段来动态获取)
                NEW.id,                  -- 关联维修单ID
                user_id,                 -- 创建人
                NOW()
            );
        END IF;

    -- ==================================================================
    -- 场景 B: 销售单 (Sales Orders) 新建
    -- ==================================================================
    ELSIF TG_TABLE_NAME = 'sales_orders' THEN
        -- 销售单创建时直接记账
        IF TG_OP = 'INSERT' THEN
            
            trans_desc := '零售收入 - 单号: ' || NEW.readable_id;
            user_id := auth.uid();

            INSERT INTO public.transactions (
                type,
                category,
                amount,
                description,
                payment_method,
                sales_order_id,
                created_by,
                created_at
            ) VALUES (
                'income',
                'Retail Sales',
                NEW.total_amount,        -- 销售单总金额
                trans_desc,
                NEW.payment_method,      -- 销售单通常自带支付方式字段
                NEW.id,                  -- 关联销售单ID
                user_id,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 先删除旧的防止冲突
DROP TRIGGER IF EXISTS trg_repair_income ON public.repair_orders;

CREATE TRIGGER trg_repair_income
AFTER UPDATE ON public.repair_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_income_transaction();

-- 先删除旧的
DROP TRIGGER IF EXISTS trg_sales_income ON public.sales_orders;

CREATE TRIGGER trg_sales_income
AFTER INSERT ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_income_transaction();

-- ==============================================================================
-- 9. 安全性与权限 (RLS Policy - Row Level Security)
-- ==============================================================================

-- 启用 RLS
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.categories enable row level security;
alter table public.faults enable row level security;
alter table public.brands enable row level security;
alter table public.models enable row level security;
alter table public.inventory_components enable row level security;
alter table public.inventory_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.stock_entries enable row level security;
alter table public.stock_entry_items enable row level security;
alter table public.repair_orders enable row level security;
alter table public.repair_order_parts enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.transactions enable row level security;
alter table public.component_compatibility enable row level security;
alter table public.warranties enable row level security;

-- Admin 策略 (全部权限)
create policy "Admin access all profiles" on profiles for all using (get_my_role() = 'admin');
create policy "Admin access all customers" on customers for all using (get_my_role() = 'admin');
create policy "Admin access all suppliers" on suppliers for all using (get_my_role() = 'admin');
create policy "Admin access all inventory" on inventory_components for all using (get_my_role() = 'admin');
create policy "Admin access all items" on inventory_items for all using (get_my_role() = 'admin');
create policy "Admin access all po" on purchase_orders for all using (get_my_role() = 'admin');
create policy "Admin access all po_items" on purchase_order_items for all using (get_my_role() = 'admin');
create policy "Admin access all stock" on stock_entries for all using (get_my_role() = 'admin');
create policy "Admin access all stock_items" on stock_entry_items for all using (get_my_role() = 'admin');
create policy "Admin access all repairs" on repair_orders for all using (get_my_role() = 'admin');
create policy "Admin access all repair_parts" on repair_order_parts for all using (get_my_role() = 'admin');
create policy "Admin access all sales" on sales_orders for all using (get_my_role() = 'admin');
create policy "Admin access all sales_items" on sales_order_items for all using (get_my_role() = 'admin');
create policy "Admin access all transactions" on transactions for all using (get_my_role() = 'admin');
create policy "Admin manage brands" on brands for all using (get_my_role() = 'admin');
create policy "Admin manage models" on models for all using (get_my_role() = 'admin');
create policy "Admin manage categories" on categories for all using (get_my_role() = 'admin');
create policy "Admin manage faults" on faults for all using (get_my_role() = 'admin');
create policy "Admin manage compatibility" on component_compatibility for all using (get_my_role() = 'admin');
create policy "Admin manage warranties" on warranties for all using (get_my_role() = 'admin');

-- Staff (Technician & Front Desk) 策略
create policy "Staff manage customers" on customers for all using (get_my_role() in ('technician', 'front_desk'));

create policy "Staff manage inventory" on inventory_components for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage compatibility" on component_compatibility for all using (get_my_role() in ('technician', 'front_desk'));

create policy "Staff manage items" on inventory_items for all using (get_my_role() in ('technician', 'front_desk'));

create policy "Staff manage po" on purchase_orders for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage po_items" on purchase_order_items for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage stock" on stock_entries for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage stock_items" on stock_entry_items for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage repairs" on repair_orders for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage repair_parts" on repair_order_parts for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage sales" on sales_orders for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage sales_items" on sales_order_items for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage transactions" on transactions for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read brands" on brands for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read models" on models for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read categories" on categories for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read faults" on faults for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage warranties" on warranties for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read suppliers" on suppliers for select using (get_my_role() in ('technician', 'front_desk'));

-- 查看自己的profile
create policy "Staff read profiles" on profiles for select using (get_my_role() in ('technician', 'front_desk', 'partner'));



-- 授予 Dashboard 视图的查询权限
GRANT SELECT ON public.dashboard_yearly_stats TO authenticated;
GRANT SELECT ON public.dashboard_monthly_stats TO authenticated;
GRANT SELECT ON public.dashboard_inventory_summary TO authenticated;
GRANT SELECT ON public.dashboard_status_stats TO authenticated;
GRANT SELECT ON public.dashboard_top_models TO authenticated;
grant select on public.partner_inventory_view to authenticated;

GRANT SELECT ON public.dashboard_financial_summary TO authenticated;
GRANT SELECT ON public.dashboard_category_stats TO authenticated;

-- 确保触发器有权写入 profiles，且系统能访问 public schema
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role, anon, authenticated;

-- Service Role 策略 (允许 API/Trigger 完全访问 profiles)
drop policy if exists "Service role full access" on public.profiles;
create policy "Service role full access" 
on public.profiles for all 
to service_role 
using (true) 
with check (true);

-- 用户自我插入策略 (允许注册)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" 
on public.profiles for insert 
to authenticated, anon
with check (auth.uid() = id);

-- 创建一个虚拟列，把你想搜的所有字段拼成一个长字符串
CREATE OR REPLACE FUNCTION public.repair_orders_search_text(ro public.repair_orders)
RETURNS text AS $$
  SELECT 
    COALESCE(ro.readable_id, '') || ' ' || 
    COALESCE(ro.imei_sn, '') || ' ' ||
    COALESCE(c.full_name, '') || ' ' ||
    COALESCE(c.phone, '')
  FROM public.customers c
  WHERE c.id = ro.customer_id;
$$ LANGUAGE sql STABLE;