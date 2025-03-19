import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, LucideIcon } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { Sale } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

interface SalesData {
  [key: string]: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => {
  const { t } = useTranslation();

  const getIconBackground = () => {
    switch (title) {
      case t('dashboard.totalSales'):
        return 'bg-emerald-500';
      case t('dashboard.numberOfSales'):
        return 'bg-blue-500';
      case t('dashboard.lowStockItems'):
        return 'bg-red-500';
      case t('dashboard.netProfit'):
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm text-gray-600 font-medium">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${getIconBackground()} p-3 rounded-full`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { sales } = useSales();
  const { products } = useProducts();
  const [timeFilter, setTimeFilter] = useState('daily');
  const [salesData, setSalesData] = useState<{ [key: string]: number }>({});
  const [totalSales, setTotalSales] = useState(0);
  const [numberOfSales, setNumberOfSales] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    if (sales && products) {
      const filteredSales = filterSalesByTime(sales as Sale[]);
      
      // Calcular total de vendas e número de vendas
      const total = filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      setTotalSales(total);
      setNumberOfSales(filteredSales.length);

      // Calcular lucro líquido
      const profit = filteredSales.reduce((sum, sale) => {
        const saleProfit = sale.sale_items.reduce((itemSum, item) => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const costPrice = product.cost_price || 0;
            const profit = (item.price_at_sale - costPrice) * item.quantity;
            return itemSum + profit;
          }
          return itemSum;
        }, 0);
        return sum + saleProfit;
      }, 0);
      setNetProfit(profit);

      // Calcular itens com estoque baixo
      const lowStock = products.filter(product => 
        product.quantity <= product.min_stock_level
      ).length;
      setLowStockItems(lowStock);

      // Processar dados de vendas por período
      const salesByDate = filteredSales.reduce<SalesData>((acc, sale) => {
        const date = new Date(sale.created_at);
        let key;
        
        if (timeFilter === 'daily') {
          // Para visualização diária, agrupar por hora inteira
          const hour = date.getHours();
          key = `${hour.toString().padStart(2, '0')}:00`;
        } else {
          // Para outros períodos, manter o agrupamento por data
          key = date.toLocaleDateString('pt-BR');
        }
        
        acc[key] = (acc[key] || 0) + Number(sale.total);
        return acc;
      }, {});

      // Ordenar os dados por hora quando estiver no modo diário
      if (timeFilter === 'daily') {
        const sortedData: SalesData = {};
        Object.keys(salesByDate)
          .sort((a, b) => {
            const hourA = parseInt(a.split(':')[0]);
            const hourB = parseInt(b.split(':')[0]);
            return hourA - hourB;
          })
          .forEach(key => {
            sortedData[key] = salesByDate[key];
          });
        setSalesData(sortedData);
      } else {
        setSalesData(salesByDate);
      }
    }
  }, [sales, products, timeFilter]);

  const filterSalesByTime = (sales: Sale[]) => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      switch (timeFilter) {
        case 'daily':
          return saleDate.toDateString() === now.toDateString();
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return saleDate >= weekAgo;
        case 'monthly':
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        case 'yearly':
          return saleDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const chartData = Object.entries(salesData).map(([date, value]) => ({
    date,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="rounded-lg border-gray-300 shadow-sm"
        >
          <option value="daily">{t('dashboard.filters.daily')}</option>
          <option value="weekly">{t('dashboard.filters.weekly')}</option>
          <option value="monthly">{t('dashboard.filters.monthly')}</option>
          <option value="yearly">{t('dashboard.filters.yearly')}</option>
          <option value="all">{t('dashboard.filters.allTime')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalSales')}
          value={`${t('common.currency')} ${totalSales.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title={t('dashboard.numberOfSales')}
          value={numberOfSales}
          icon={ShoppingCart}
        />
        <StatCard
          title={t('dashboard.lowStockItems')}
          value={lowStockItems}
          icon={AlertTriangle}
        />
        <StatCard
          title={t('dashboard.netProfit')}
          value={`${t('common.currency')} ${netProfit.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.salesOverview')}</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${t('common.currency')} ${value.toFixed(2)}`}
                labelFormatter={(label) => {
                  if (timeFilter === 'daily') {
                    const hour = parseInt(label.split(':')[0]);
                    const nextHour = (hour + 1) % 24;
                    return `${label} - ${nextHour.toString().padStart(2, '0')}:00`;
                  }
                  return `${t('common.date')}: ${label}`;
                }}
              />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
