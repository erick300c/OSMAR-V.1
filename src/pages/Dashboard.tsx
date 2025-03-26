import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, LucideIcon } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { Sale } from '../types';
import DateRangePicker from '../components/DateRangePicker';

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
  
  // Inicializa com o período diário
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [startDate, setStartDate] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
  const [endDate, setEndDate] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
  
  const [salesData, setSalesData] = useState<{ [key: string]: number }>({});
  const [totalSales, setTotalSales] = useState(0);
  const [numberOfSales, setNumberOfSales] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const currentDate = new Date();
    
    if (period !== 'custom') {
      let start: Date | null = null;
      let end: Date | null = null;

      switch (period) {
        case 'daily':
          start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
          end = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
          break;
        case 'weekly':
          start = new Date(currentDate);
          start.setDate(currentDate.getDate() - currentDate.getDay());
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
          end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'yearly':
          start = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0);
          end = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          start = null;
          end = null;
      }

      setStartDate(start);
      setEndDate(end);
    }
  };

  const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isOneDayView = (start: Date | null, end: Date | null, period: string): boolean => {
    if (period === 'daily') return true;
    if (!start || !end) return false;
    return isSameDay(start, end);
  };

  useEffect(() => {
    if (sales && products) {
      const filteredSales = filterSalesByDateRange(sales as Sale[]);
      
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

      // Verificar se é visualização de um único dia
      const showHourlyView = isOneDayView(startDate, endDate, selectedPeriod);

      // Processar dados de vendas por período
      const salesByDate = filteredSales.reduce<SalesData>((acc, sale) => {
        const date = new Date(sale.created_at);
        let key;
        
        if (showHourlyView) {
          // Para visualização de um dia, agrupar por hora
          const hour = date.getHours();
          key = `${hour.toString().padStart(2, '0')}:00`;
        } else {
          // Para outros períodos, manter o agrupamento por data
          key = date.toLocaleDateString('pt-BR');
        }
        
        acc[key] = (acc[key] || 0) + Number(sale.total);
        return acc;
      }, {});

      if (showHourlyView) {
        // Encontrar a primeira e última hora com vendas
        const hours = Object.keys(salesByDate)
          .map(time => parseInt(time))
          .sort((a, b) => a - b);

        if (hours.length > 0) {
          const firstHour = Math.min(...hours);
          const lastHour = Math.max(...hours);

          // Criar array apenas com as horas entre a primeira e última venda
          const sortedData: SalesData = {};
          for (let hour = firstHour; hour <= lastHour; hour++) {
            const key = `${hour.toString().padStart(2, '0')}:00`;
            sortedData[key] = salesByDate[key] || 0;
          }
          setSalesData(sortedData);
        } else {
          // Se não houver vendas, mostrar apenas a hora atual
          const currentHour = new Date().getHours();
          setSalesData({
            [`${currentHour.toString().padStart(2, '0')}:00`]: 0
          });
        }
      } else {
        // Para outros períodos, ordenar as datas cronologicamente
        const sortedData = Object.entries(salesByDate)
          .sort((a, b) => {
            const dateA = a[0].split('/').reverse().join('-');
            const dateB = b[0].split('/').reverse().join('-');
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          })
          .reduce((acc, [date, value]) => {
            acc[date] = value;
            return acc;
          }, {} as SalesData);
        setSalesData(sortedData);
      }
    }
  }, [sales, products, startDate, endDate, selectedPeriod]);

  const filterSalesByDateRange = (sales: Sale[]) => {
    if (!startDate || !endDate) {
      return sales;
    }

    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= startDate && saleDate <= endDate;
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
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          selectedPeriod={selectedPeriod}
          onChange={(dates) => {
            setStartDate(dates[0]);
            setEndDate(dates[1]);
          }}
          onPeriodChange={handlePeriodChange}
        />
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
                  const showHourlyView = isOneDayView(startDate, endDate, selectedPeriod);
                  if (showHourlyView) {
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
