import { supabase } from './supabase';
import { Product, Sale } from '../types';

export const api = {
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },

    async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, product: Partial<Product>) {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  sales: {
    async getAll() {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            price_at_sale,
            product_id,
            products (
              id,
              name,
              selling_price,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(sale: {
      total: number;
      paymentMethod: string;
      items: Array<{
        productId: string;
        quantity: number;
        priceAtSale: number;
      }>;
    }) {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total: sale.total,
          payment_method: sale.paymentMethod
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = sale.items.map(item => ({
        sale_id: saleData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_sale: item.priceAtSale
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      return saleData;
    },

    async update(id: string, updates: Partial<Sale>) {
      // Primeiro, atualiza a venda principal
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .update({
          total: updates.total,
          payment_method: updates.payment_method
        })
        .eq('id', id)
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Se houver itens para atualizar
      if (updates.sale_items) {
        // Remove os itens antigos
        const { error: deleteError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', id);
        
        if (deleteError) throw deleteError;

        // Insere os novos itens
        const saleItems = updates.sale_items.map(item => ({
          sale_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      return saleData;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  }
};
