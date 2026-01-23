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
        create type public.stock_entry_type as enum ('purchase', 'return', 'adjustment');
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
  readable_id serial,
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
  readable_id serial,
  customer_id uuid references public.customers(id),
  model_id integer references public.models(id),
  
  imei_sn text,
  problem_description text,
  status public.order_status default 'pending_check',
  
  labor_cost numeric(10, 2) default 0.00, 
  parts_cost numeric(10, 2) default 0.00, 
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
  readable_id serial,
  customer_id uuid references public.customers(id),
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
  readable_id serial, 
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

-- ==============================================================================
-- 4. 自动化逻辑 (Functions & Triggers)
-- ==============================================================================

-- 4.1 获取当前用户角色 helper
create or replace function public.get_my_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- 4.2 自动库存更新函数
create or replace function public.update_inventory_on_stock_entry()
returns trigger as $$
begin
  if NEW.component_id is not null then
    update public.inventory_components
    set 
      stock_quantity = stock_quantity + NEW.quantity,
      cost_price = NEW.cost_price 
    where id = NEW.component_id;
  end if;

  if NEW.item_id is not null then
    update public.inventory_items
    set 
      stock_quantity = stock_quantity + NEW.quantity,
      cost_price = NEW.cost_price
    where id = NEW.item_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- 4.3 自动创建保修单函数
create or replace function public.create_warranty_on_completion()
returns trigger as $$
begin
  if NEW.status = 'completed' and (OLD.status is distinct from 'completed') then
    if not exists (select 1 from public.warranties where repair_order_id = NEW.id) then
      insert into public.warranties (
        repair_order_id,
        customer_id,
        duration_days,
        coverage_details,
        status
      )
      values (
        NEW.id,
        NEW.customer_id,
        coalesce(NEW.warranty_duration_days, 90), 
        'Garanzia limitata Luna Tech: Copre difetti di fabbricazione. Esclusi danni accidentali o liquidi.',
        'active'
      );
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- 4.4 [关键修复] 用户注册处理函数
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

-- 4.5 绑定 Trigger
drop trigger if exists trigger_create_warranty on public.repair_orders;
create trigger trigger_create_warranty
after update on public.repair_orders
for each row execute function public.create_warranty_on_completion();

drop trigger if exists trigger_update_inventory on public.stock_entry_items;
create trigger trigger_update_inventory
after insert on public.stock_entry_items
for each row execute function public.update_inventory_on_stock_entry();

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