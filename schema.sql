-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id text primary key,
  name text not null,
  role text not null,
  pin text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS TABLE
create table public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  category text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVENTORY TABLE
create table public.inventory (
  id text primary key,
  name text not null,
  unit text not null,
  stock numeric default 0,
  cost numeric default 0,
  min_stock numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RECIPES TABLE
create table public.recipes (
  product_id text primary key references public.products(id) on delete cascade,
  ingredients jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SHIFTS TABLE
create table public.shifts (
  id text primary key,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  start_cash numeric default 0,
  end_cash numeric default 0,
  cash_sales numeric default 0,
  expected_cash numeric default 0,
  actual_cash numeric default 0,
  difference numeric default 0,
  user_id text,
  status text default 'OPEN',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS TABLE
create table public.transactions (
  id text primary key,
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  grand_total numeric default 0,
  payment_method text,
  change numeric default 0,
  pay_amount numeric default 0,
  cashier_id text,
  shift_id text,
  customer_name text,
  status text default 'PAID',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPENSES TABLE
create table public.expenses (
  id text primary key, -- client gen 'exp_...'
  type text,
  item_id text, -- optional
  item_name text,
  qty numeric,
  total_cost numeric,
  date timestamp with time zone,
  user_id text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SETTINGS TABLE (Single Row)
create table public.settings (
  id serial primary key,
  store_name text,
  store_address text,
  footer_message text,
  show_dash_lines boolean,
  show_footer boolean,
  printer_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SEED DATA (Optional, run if empty)
INSERT INTO public.users (id, name, role, pin) VALUES
('u1', 'Owner', 'ADMIN', '1234'),
('u2', 'Budi (Kasir)', 'CASHIER', '0000'),
('u3', 'Siti (Gudang)', 'INVENTORY', '5678'),
('u4', 'Finance Staff', 'FINANCE', '9999')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (id, store_name, store_address, footer_message, show_dash_lines, show_footer) 
VALUES (1, 'RATAKIRI POS', 'Jl. Teknologi No. 1', 'TERIMA KASIH', true, true)
ON CONFLICT (id) DO NOTHING;
