import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Product } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      setLoading(false);
    }
  }

  async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const newProduct = await api.products.create(product);
    setProducts([...products, newProduct]);
    return newProduct;
  }

  async function updateProduct(id: string, product: Partial<Product>) {
    const updatedProduct = await api.products.update(id, product);
    setProducts(products.map(p => p.id === id ? updatedProduct : p));
    return updatedProduct;
  }

  async function deleteProduct(id: string) {
    await api.products.delete(id);
    setProducts(products.filter(p => p.id !== id));
  }

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh: loadProducts
  };
}
