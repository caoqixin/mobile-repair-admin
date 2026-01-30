-- ==============================================================================
-- 1. 基础环境设置 (Extensions & Enums)
-- ==============================================================================

-- 启用 UUID 生成扩展
create extension if not exists "uuid-ossp";

-- 安全地创建枚举类型
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('admin', 'technician', 'front_desk', 'partner');
    end if;
    if not exists (select 1 from pg_type where typname = 'order_status') then
        create type public.order_status as enum ('pending_check', 'pending_quote', 'approved', 'repairing', 'waiting_parts', 'completed', 'cancelled');
    end if;
    if not exists (select 1 from pg_type where typname = 'payment_method') then
        create type public.payment_method as enum ('cash', 'card', 'transfer', 'wechat', 'alipay'); 
    end if;
    if not exists (select 1 from pg_type where typname = 'part_quality') then
        create type public.part_quality as enum ('compatibile', 'originale', 'service_pack_original', 'incell', 'hard_oled', 'soft_oled');
    end if;
    if not exists (select 1 from pg_type where typname = 'po_status') then
        create type public.po_status as enum ('draft', 'ordered', 'received', 'cancelled');
    end if;
    if not exists (select 1 from pg_type where typname = 'stock_entry_type') then
        create type public.stock_entry_type as enum ('purchase', 'return', 'adjustment', 'repair');
    end if;
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type public.transaction_type as enum ('income', 'expense');
    end if;
    if not exists (select 1 from pg_type where typname = 'warranty_status') then
        create type public.warranty_status as enum ('active', 'expired', 'voided', 'claimed');
    end if;
end $$;

-- ==============================================================================
-- 2. 核心表结构 (Tables)
-- ==============================================================================

-- 2.1 员工与权限表
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role public.user_role default 'technician',
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 2.2 客户档案
create table if not exists public.customers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text unique not null,
  email text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 2.3 供应商
create table if not exists public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null, 
  website text,
  description text,
  created_at timestamp with time zone default now()
);

-- 2.4 基础分类
create table if not exists public.categories (
  id serial primary key,
  name text not null, 
  type text check (type in ('component', 'item')),
  created_at timestamp with time zone default now()
);

-- 2.5 故障类型定义
create table if not exists public.faults (
  id serial primary key,
  name text not null, 
  description text,
  created_at timestamp with time zone default now()
);

-- 2.6 品牌 (Brands)
create table if not exists public.brands (
  id serial primary key,
  name text not null unique
);

-- 2.7 机型 (Models)
create table if not exists public.models (
  id serial primary key,
  brand_id integer references public.brands(id),
  name text not null, 
  code text, 
  is_tablet boolean default false,
  release_year integer,
  created_at timestamp with time zone default now()
);

-- 2.8 库存：维修配件
create table if not exists public.inventory_components (
  id uuid default uuid_generate_v4() primary key,
  sku text unique,
  name text not null, 
  category_id integer references public.categories(id),
  supplier_id uuid references public.suppliers(id),
  quality public.part_quality default 'compatibile',
  stock_quantity integer default 0,
  cost_price numeric(10, 2) default 0.00, 
  suggested_repair_price numeric(10, 2), 
  partner_repair_price numeric(10, 2), 
  created_at timestamp with time zone default now()
);

-- 2.9 配件-机型兼容表
create table if not exists public.component_compatibility (
  id serial primary key,
  component_id uuid references public.inventory_components(id) on delete cascade,
  model_id integer references public.models(id) on delete cascade,
  unique(component_id, model_id)
);

-- 2.10 库存：零售商品
create table if not exists public.inventory_items (
  id uuid default uuid_generate_v4() primary key,
  sku text unique,
  name text not null,
  category_id integer references public.categories(id),
  stock_quantity integer default 0,
  cost_price numeric(10, 2) default 0.00,
  retail_price numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- 2.11 进货单
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

create table if not exists public.purchase_order_items (
  id uuid default uuid_generate_v4() primary key,
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade,
  component_id uuid references public.inventory_components(id), 
  item_id uuid references public.inventory_items(id), 
  product_name text, 
  quantity integer default 1,
  unit_cost numeric(10, 2)
);

-- 2.12 入库记录
create table if not exists public.stock_entries (
  id uuid default uuid_generate_v4() primary key,
  reference_number text, 
  type public.stock_entry_type default 'purchase',
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.stock_entry_items (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.stock_entries(id) on delete cascade,
  component_id uuid references public.inventory_components(id),
  item_id uuid references public.inventory_items(id),
  quantity integer not null,
  cost_price numeric(10, 2) 
);

-- 2.13 维修订单
create table if not exists public.repair_orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id text,
  customer_id uuid references public.customers(id),
  model_id integer references public.models(id),
  
  imei_sn text,
  problem_description text,
  additional_notes text,
  status public.order_status default 'pending_check',
  
  total_price numeric(10, 2) default 0.00, 
  deposit numeric(10, 2) default 0.00, 
  warranty_duration_days integer default 90, 
  
  technician_id uuid references public.profiles(id), 
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table if not exists public.repair_order_parts (
  id uuid default uuid_generate_v4() primary key,
  repair_order_id uuid references public.repair_orders(id) on delete cascade,
  component_id uuid references public.inventory_components(id),
  quantity integer default 1,
  unit_price numeric(10, 2) 
);

-- 2.14 零售订单 (之前讨论过但漏掉了，补上)
create table if not exists public.sales_orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id text,
  seller_id uuid references public.profiles(id),
  total_amount numeric(10, 2) not null,
  payment_method public.payment_method default 'cash',
  created_at timestamp with time zone default now()
);

create table if not exists public.sales_order_items (
  id uuid default uuid_generate_v4() primary key,
  sales_order_id uuid references public.sales_orders(id) on delete cascade,
  item_id uuid references public.inventory_items(id),
  quantity integer default 1,
  unit_price numeric(10, 2)
);

-- 2.15 财务流水
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type public.transaction_type not null,
  amount numeric(10, 2) not null,
  category text, 
  payment_method public.payment_method,
  description text,
  repair_order_id uuid references public.repair_orders(id),
  sales_order_id uuid references public.sales_orders(id), -- 关联零售单
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 2.16 保修单 (使用修正后的生成列)
create table if not exists public.warranties (
  id uuid default uuid_generate_v4() primary key,
  readable_id text, 
  repair_order_id uuid references public.repair_orders(id) not null unique, 
  customer_id uuid references public.customers(id) not null,
  
  start_date date default current_date, 
  duration_days integer default 90, 
  -- [FIXED] 使用 Date + Integer (天数)
  end_date date generated always as (start_date + duration_days) stored,
  
  coverage_details text, 
  status public.warranty_status default 'active',
  
  claim_count integer default 0, 
  last_claim_date date,
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 3. 视图 (Views)
-- ==============================================================================

create or replace view public.partner_inventory_view as 
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

-- =========================================================
-- 1. 年度统计视图 (用于: 年度收入、年度维修量、历史年份弹窗)
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_yearly_stats AS
SELECT
    CAST(EXTRACT(YEAR FROM created_at) AS INTEGER) AS year,
    COUNT(*) FILTER (WHERE status != 'cancelled') AS repair_count,
    COALESCE(SUM(total_price) FILTER (WHERE status != 'cancelled'), 0) AS total_revenue
FROM public.repair_orders
GROUP BY 1
ORDER BY 1 DESC;

-- =========================================================
-- 2. 月度统计视图 (用于: 本月收入/单量、本年趋势图表)
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_monthly_stats AS
SELECT
    TO_CHAR(created_at, 'YYYY-MM') AS month_str,
    CAST(EXTRACT(YEAR FROM created_at) AS INTEGER) AS year,
    CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) AS month,
    COUNT(*) FILTER (WHERE status != 'cancelled') AS repair_count,
    COALESCE(SUM(total_price) FILTER (WHERE status != 'cancelled'), 0) AS total_revenue
FROM public.repair_orders
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- =========================================================
-- 3. 库存资产视图 (用于: 维修配件 & 前台商品 的总值/总量)
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_inventory_summary AS
-- 维修配件
SELECT
    'components' AS category,
    COUNT(*) AS sku_count, -- SKU数量
    COALESCE(SUM(stock_quantity), 0) AS total_quantity, -- 库存总件数
    COALESCE(SUM(cost_price * stock_quantity), 0) AS total_value -- 库存总成本
FROM public.inventory_components
UNION ALL
-- 前台商品
SELECT
    'items' AS category,
    COUNT(*) AS sku_count,
    COALESCE(SUM(stock_quantity), 0) AS total_quantity,
    COALESCE(SUM(cost_price * stock_quantity), 0) AS total_value
FROM public.inventory_items;

-- =========================================================
-- 4. 状态分布视图 (用于: 饼图 & 进行中工单统计)
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_status_stats AS
SELECT
    status,
    COUNT(*) AS count
FROM public.repair_orders
GROUP BY status;

-- =========================================================
-- 5. 热门机型视图 (用于: Top 5 机型)
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_top_models AS
SELECT
    m.name AS model_name,
    COUNT(*) AS repair_count
FROM public.repair_orders ro
JOIN public.models m ON ro.model_id = m.id
GROUP BY m.name
ORDER BY repair_count DESC;

-- 权限赋予 (防止 Refine 无法读取视图)
GRANT SELECT ON public.dashboard_yearly_stats TO authenticated;
GRANT SELECT ON public.dashboard_monthly_stats TO authenticated;
GRANT SELECT ON public.dashboard_inventory_summary TO authenticated;
GRANT SELECT ON public.dashboard_status_stats TO authenticated;
GRANT SELECT ON public.dashboard_top_models TO authenticated;

-- ==============================================================================
-- 4. 自动化逻辑 (Functions & Triggers)
-- ==============================================================================

-- 4.1 获取当前用户角色 helper
create or replace function public.get_my_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;


-- 4.3 [关键修复] 用户注册处理函数
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public -- 强制使用 public 路径
as $$
declare
  user_full_name text;
  user_avatar_url text;
  user_role_text text;
  final_role public.user_role;
begin
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_avatar_url := new.raw_user_meta_data->>'avatar_url';
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

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (new.id, new.email, user_full_name, user_avatar_url, final_role);
  
  return new;
end;
$$;



drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ==============================================================================
-- 5. RLS 权限策略 (Row Level Security)
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
create policy "Staff read profiles" on profiles for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff update own profile" on profiles for update using (auth.uid() = id);
create policy "Staff manage customers" on customers for all using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff read suppliers" on suppliers for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage inventory" on inventory_components for all using (get_my_role() in ('technician', 'front_desk'));
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
create policy "Staff read compatibility" on component_compatibility for select using (get_my_role() in ('technician', 'front_desk'));
create policy "Staff manage warranties" on warranties for all using (get_my_role() in ('technician', 'front_desk'));

-- Partner (合作伙伴) 策略
create policy "Partner read brands" on brands for select using (get_my_role() = 'partner');
create policy "Partner read models" on models for select using (get_my_role() = 'partner');
create policy "Partner read categories" on categories for select using (get_my_role() = 'partner');
create policy "Partner read faults" on faults for select using (get_my_role() = 'partner');
create policy "Partner read compatibility" on component_compatibility for select using (get_my_role() = 'partner');
create policy "Partner read profiles" on profiles for select using (get_my_role() = 'partner');
create policy "Partner update own profile" on profiles for update using (auth.uid() = id and get_my_role() = 'partner');

-- 授权 View 访问
grant select on public.partner_inventory_view to authenticated;

-- ==============================================================================
-- 6. 关键：权限授予 (Fix for "Database error creating new user")
-- ==============================================================================
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


CREATE OR REPLACE FUNCTION public.generate_tech_id(prefix text, digits integer DEFAULT 4)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- <--- 关键！让函数以管理员权限运行
AS $$
DECLARE
    year_str text;
    seq_name text;
    next_val integer;
    new_id text;
BEGIN
    year_str := to_char(now(), 'YYYY');
    seq_name := 'seq_' || prefix || '_' || year_str;

    BEGIN
        EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
    EXCEPTION WHEN undefined_table THEN
        EXECUTE 'CREATE SEQUENCE ' || seq_name || ' START 1';
        EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
    END;

    new_id := prefix || '-' || year_str || '-' || lpad(next_val::text, digits, '0');
    RETURN new_id;
END;
$$;

-- 1. 创建主触发器函数
CREATE OR REPLACE FUNCTION public.set_readable_id_trigger()
RETURNS TRIGGER AS $$
DECLARE
    prefix_code text;
BEGIN
    -- 根据表名决定前缀
    CASE TG_TABLE_NAME
        WHEN 'sales_orders' THEN prefix_code := 'SO';
        WHEN 'warranties' THEN prefix_code := 'WAR';
        WHEN 'purchase_orders' THEN prefix_code := 'PO';
        WHEN 'repair_orders' THEN prefix_code := 'RO';
        ELSE RAISE EXCEPTION 'Table % not supported for readable_id generation', TG_TABLE_NAME;
    END CASE;

    -- 只有当 readable_id 为空时才生成 (允许手动覆盖，虽然很少用)
    IF NEW.readable_id IS NULL THEN
        NEW.readable_id := public.generate_tech_id(prefix_code);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 绑定触发器到四张表 (批量执行)

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

-- =========================================================
-- Luna Tech 供应链核心触发器逻辑 (Supply Chain Triggers)
-- 包含: 自动库存更新、进货单入库流转、已入库订单锁定
-- =========================================================

-- ---------------------------------------------------------
-- PART 1: 通用库存更新触发器 (Core Inventory Engine)
-- 目的: 监听 stock_entry_items 表。一旦有任何入库明细插入(无论是来自PO还是手动盘盈)，
--      自动去更新 inventory_components 或 inventory_items 的库存和成本。
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_inventory_from_entry_item()
RETURNS TRIGGER AS $$
BEGIN
    -- A. 如果是维修配件 (Component)
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

    -- B. 如果是零售商品 (Item)
    ELSIF NEW.item_id IS NOT NULL THEN
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

-- 绑定 Part 1 触发器
DROP TRIGGER IF EXISTS trg_update_inventory_on_entry ON public.stock_entry_items;
CREATE TRIGGER trg_update_inventory_on_entry
AFTER INSERT ON public.stock_entry_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_from_entry_item();


-- ---------------------------------------------------------
-- PART 2: 进货单收货处理触发器 (PO Receipt Orchestrator)
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

-- 绑定 Part 2 触发器
DROP TRIGGER IF EXISTS trg_po_receipt ON public.purchase_orders;
CREATE TRIGGER trg_po_receipt
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_po_receipt();


-- ---------------------------------------------------------
-- PART 3: 进货单锁定触发器 (PO Security Lock)
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

-- 绑定 Part 3 触发器
DROP TRIGGER IF EXISTS trg_lock_received_po ON public.purchase_orders;
CREATE TRIGGER trg_lock_received_po
BEFORE UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_po_update_if_received();

-- 脚本结束


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

CREATE OR REPLACE FUNCTION public.handle_repair_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_entry_id uuid; -- 用于存储生成的出库单ID
BEGIN
    -- =====================================================
    -- 场景 A: 订单完成 (Completed)
    -- 动作: 1. 生成保修单  2. 生成出库单(扣减库存)
    -- =====================================================
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- 1. 更新完成时间
        UPDATE public.repair_orders 
        SET completed_at = now() 
        WHERE id = NEW.id;

        -- 2. 自动创建保修单 (Warranties)
        INSERT INTO public.warranties (
            repair_order_id, customer_id, start_date, duration_days, status
        )
        VALUES (
            NEW.id, NEW.customer_id, CURRENT_DATE, 
            COALESCE(NEW.warranty_duration_days, 90), 'active'
        )
        ON CONFLICT (repair_order_id) DO NOTHING;

        -- 3. 🔥 核心新增: 自动扣减库存 (通过生成 Stock Entry)
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
    -- 场景 B: 订单取消 (Cancelled)
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