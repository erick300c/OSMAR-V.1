import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useReports() {
  const [monthlySales, setMonthlySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const [monthlyData, categoryData] = await Promise.all([
        api.reports.getMonthlySales(),
        api.reports.getCategorySales()
      ]);
      setMonthlySales(monthlyData);
      setCategorySales(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reports'));
    } finally {
      setLoading(false);
    }
  }

  return {
    monthlySales,
    categorySales,
    loading,
    error,
    refresh: loadReports
  };
}
