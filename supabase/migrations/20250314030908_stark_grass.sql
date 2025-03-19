/*
  # Fix RLS policies and add stored procedures

  1. Changes
    - Add stored procedures for reports
    - Drop existing policies before creating new ones
    - Add proper RLS policies for all tables
*/

-- Create stored procedure for monthly sales
CREATE OR REPLACE FUNCTION get_monthly_sales()
RETURNS TABLE (
  month text,
  total numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'Month') as month,
    sum(total) as total
  FROM sales
  GROUP BY to_char(created_at, 'Month')
  ORDER BY min(created_at);
END;
$$;

-- Create stored procedure for category sales
CREATE OR REPLACE FUNCTION get_category_sales()
RETURNS TABLE (
  category text,
  total numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    sum(si.price_at_sale * si.quantity) as total
  FROM sale_items si
  JOIN products p ON p.id = si.product_id
  GROUP BY p.category;
END;
$$;

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop policies for products table
  DROP POLICY IF EXISTS "Enable read access for all users" ON products;
  DROP POLICY IF EXISTS "Enable write access for authenticated users" ON products;
  DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
  
  -- Drop policies for sales table
  DROP POLICY IF EXISTS "Enable read access for all users" ON sales;
  DROP POLICY IF EXISTS "Enable write access for authenticated users" ON sales;
  DROP POLICY IF EXISTS "Allow authenticated users full access to sales" ON sales;
  
  -- Drop policies for sale_items table
  DROP POLICY IF EXISTS "Enable read access for all users" ON sale_items;
  DROP POLICY IF EXISTS "Enable write access for authenticated users" ON sale_items;
  DROP POLICY IF EXISTS "Allow authenticated users full access to sale_items" ON sale_items;
END $$;

-- Update RLS policies to ensure proper access
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create new policies for products table
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Enable write access for authenticated users"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create new policies for sales table
CREATE POLICY "Enable read access for all users"
ON sales FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Enable write access for authenticated users"
ON sales FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create new policies for sale_items table
CREATE POLICY "Enable read access for all users"
ON sale_items FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Enable write access for authenticated users"
ON sale_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
