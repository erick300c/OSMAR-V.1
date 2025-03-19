/*
  # Fix RLS policies for products table

  1. Changes
    - Drop existing RLS policies for products table
    - Create new RLS policy that allows authenticated users full access
    - Simplify policy to use a single policy for all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON products;

-- Create a single policy for all operations
CREATE POLICY "Allow authenticated users full access to products"
ON products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
