import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { Sale, Product } from '../types';

interface MonthlyData {
  month: string;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

interface ProductRevenue {
  [key: string]: number;
}

interface SaleItem {
  product_id: string;
  quantity: number;
  price_at_sale: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    selling_price: number;
    category: string;
  };
}

interface ConsumoAnalise {
  produto: string;
  consumo_diario: number;
  consumo_semanal: number;
  consumo_mensal: number;
  quantidade_sugerida: number;
  tendencia: 'subindo' | 'estavel' | 'descendo';
}

const Reports = () => {
  const { t } = useTranslation();
  const { sales } = useSales();
  const { products } = useProducts();
  const [timeFilter, setTimeFilter] = useState('all');
  const [monthlySales, setMonthlySales] = useState<MonthlyData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([]);
  const [revenueContribution, setRevenueContribution] = useState<CategoryData[]>([]);
  const [analiseConsumo, setAnaliseConsumo] = useState<ConsumoAnalise[]>([]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6366F1'];

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
        default:
          return true;
      }
    });
  };

  const arredondamentoPersonalizado = (valor: number): number => {
    if (valor < 1) return 1;
    
    const parteDecimal = valor % 1;
    const parteInteira = Math.floor(valor);
    
    if (parteDecimal >= 0.5) {
      return parteInteira + 1;
    }
    return parteInteira;
  };

  const calcularConsumoMedio = (produto: Product, vendas: Sale[]) => {
    const vendasProduto = vendas.flatMap(venda => 
      venda.sale_items.map(item => ({
        ...item,
        created_at: venda.created_at
      }))
    ).filter(item => item.product_id === produto.id);

    const hoje = new Date();
    const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
    const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

    const vendasMes = vendasProduto.filter(item => 
      new Date(item.created_at) >= umMesAtras
    );

    const vendasSemana = vendasProduto.filter(item => 
      new Date(item.created_at) >= umaSemanaAtras
    );

    const consumoDiario = vendasMes.reduce((sum, item) => sum + item.quantity, 0) / 30;
    const consumoSemanal = vendasSemana.reduce((sum, item) => sum + item.quantity, 0) / 7;
    const consumoMensal = vendasMes.reduce((sum, item) => sum + item.quantity, 0);

    // Calcula tendência baseada na comparação entre consumo diário recente e antigo
    const consumoRecente = vendasSemana.reduce((sum, item) => sum + item.quantity, 0);
    const consumoAntigo = vendasMes
      .filter(item => new Date(item.created_at) < umaSemanaAtras)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    let tendencia: 'subindo' | 'estavel' | 'descendo' = 'estavel';
    if (consumoRecente > consumoAntigo * 1.1) {
      tendencia = 'subindo';
    } else if (consumoRecente < consumoAntigo * 0.9) {
      tendencia = 'descendo';
    }

    // Quantidade sugerida: média mensal + 20% de margem de segurança
    const quantidadeSugerida = Math.ceil(consumoMensal * 1.2);

    return {
      produto: produto.name,
      consumo_diario: arredondamentoPersonalizado(consumoDiario),
      consumo_semanal: arredondamentoPersonalizado(consumoSemanal),
      consumo_mensal: arredondamentoPersonalizado(consumoMensal),
      quantidade_sugerida: arredondamentoPersonalizado(quantidadeSugerida),
      tendencia
    };
  };

  useEffect(() => {
    if (sales && products) {
      const filteredSales = filterSalesByTime(sales as Sale[]);

      // Process monthly sales data
      const monthlyData = filteredSales.reduce<ProductRevenue>((acc, sale) => {
        const date = new Date(sale.created_at);
        const month = date.toLocaleString('pt-BR', { month: 'long' });
        acc[month] = (acc[month] || 0) + Number(sale.total);
        return acc;
      }, {});

      setMonthlySales(Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue
      })));

      // Process category distribution
      const categoryData = filteredSales.reduce<ProductRevenue>((acc, sale) => {
        sale.sale_items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            acc[product.category] = (acc[product.category] || 0) + Number(item.price_at_sale * item.quantity);
          }
        });
        return acc;
      }, {});

      const totalCategorySales = Object.values(categoryData).reduce((sum, value) => sum + value, 0);
      
      setCategoryDistribution(
        Object.entries(categoryData).map(([name, value]) => ({
          name: t(`products.categories.${name}`),
          value: (value / totalCategorySales) * 100
        }))
      );

      // Process revenue contribution by product
      const productRevenue = filteredSales.reduce<ProductRevenue>((acc, sale) => {
        sale.sale_items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            acc[product.name] = (acc[product.name] || 0) + Number(item.price_at_sale * item.quantity);
          }
        });
        return acc;
      }, {});

      const sortedProducts = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const otherRevenue = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(5)
        .reduce((sum, [, value]) => sum + value, 0);

      const totalProductRevenue = Object.values(productRevenue).reduce((sum, value) => sum + value, 0);

      setRevenueContribution([
        ...sortedProducts.map(([name, value]) => ({
          name: name,
          value: Math.floor(value),
          percentage: (value / totalProductRevenue) * 100
        })),
        {
          name: t('reports.others'),
          value: Math.floor(otherRevenue),
          percentage: (otherRevenue / totalProductRevenue) * 100
        }
      ]);

      // Análise de consumo
      const analise = products.map(produto => 
        calcularConsumoMedio(produto, filteredSales)
      );
      
      // Ordena por quantidade sugerida (maior para menor)
      analise.sort((a, b) => b.quantidade_sugerida - a.quantidade_sugerida);
      
      setAnaliseConsumo(analise);
    }
  }, [sales, products, t, timeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('reports.title')}</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm"
          >
            <option value="all">{t('reports.filters.allTime')}</option>
            <option value="daily">{t('reports.filters.daily')}</option>
            <option value="weekly">{t('reports.filters.weekly')}</option>
            <option value="monthly">{t('reports.filters.monthly')}</option>
          </select>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
            <Download className="w-5 h-5 mr-2" />
            {t('common.export')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('reports.monthlyRevenue')}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${t('common.currency')} ${value.toFixed(2)}`} 
                />
                <Bar dataKey="revenue" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('reports.salesByCategory')}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }: CategoryData) => `${name} (${value.toFixed(1)}%)`}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
          <h2 className="text-xl font-semibold mb-4">{t('reports.revenueContribution')}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueContribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }: CategoryData) => 
                    percentage ? `${name} (${Math.floor(percentage)}%)` : name
                  }
                >
                  {revenueContribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${t('common.currency')} ${Math.floor(value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('reports.consumptionAnalysis')}</h2>
            <div className="text-sm text-gray-500">
              {t('reports.sortedByQuantity')}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.product')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.dailyConsumption')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.weeklyConsumption')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.monthlyConsumption')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.suggestedQuantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('reports.trend')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analiseConsumo.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.produto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.consumo_diario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.consumo_semanal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.consumo_mensal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                      {item.quantidade_sugerida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.tendencia === 'subindo' ? 'bg-green-100 text-green-800' : 
                          item.tendencia === 'descendo' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {t(`reports.trends.${item.tendencia}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
