import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Sale } from '../types';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const data = await api.sales.getAll();
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sales'));
    } finally {
      setLoading(false);
    }
  }

  async function createSale(sale: {
    total: number;
    paymentMethod: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceAtSale: number;
    }>;
  }) {
    const newSale = await api.sales.create(sale);
    await loadSales(); // Reload to get the complete sale with items
    return newSale;
  }

  async function updateSale(id: string, updates: Partial<Sale>) {
    const updatedSale = await api.sales.update(id, updates);
    setSales(sales.map(s => s.id === id ? updatedSale : s));
    return updatedSale;
  }

  async function deleteSale(id: string) {
    await api.sales.delete(id);
    setSales(sales.filter(s => s.id !== id));
  }

  return {
    sales,
    loading,
    error,
    createSale,
    updateSale,
    deleteSale,
    refresh: loadSales
  };
}
