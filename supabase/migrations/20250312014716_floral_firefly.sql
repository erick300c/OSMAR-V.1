/*
  # Fix RLS policies for products table

  1. Changes
    - Drop existing RLS policy for products table
    - Create new RLS policies with proper user authentication checks
    - Add policies for all CRUD operations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;

-- Create new policies for products table
CREATE POLICY "Enable read access for authenticated users"
ON products FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON products FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON products FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');
