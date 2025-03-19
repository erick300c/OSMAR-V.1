import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import NewSaleModal from '../components/NewSaleModal';
import EditSaleModal from '../components/EditSaleModal';
import { Sale } from '../types';

const Sales = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { sales, loading, deleteSale } = useSales();

  const handleDelete = async (id: string) => {
    if (window.confirm(t('sales.confirmDelete'))) {
      try {
        await deleteSale(id);
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
    }
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setIsEditSaleModalOpen(true);
  };

  const filteredSales = sales?.filter(sale => {
    const matchesSearch = sale?.sale_items?.some(item => 
      item?.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || sale?.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const saleDate = new Date(sale.created_at);
    const now = new Date();
    const isDateMatch = dateFilter === 'all' || (
      dateFilter === 'today' ? saleDate.toDateString() === now.toDateString() :
      dateFilter === 'week' ? saleDate >= new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) :
      dateFilter === 'month' ? saleDate.getMonth() === now.getMonth() : true
    );

    const isPaymentMatch = paymentFilter === 'all' || sale.payment_method === paymentFilter;

    return matchesSearch && isDateMatch && isPaymentMatch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('sales.title')}</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center transition-colors duration-200 shadow-md hover:shadow-lg active:transform active:scale-95"
          onClick={() => setIsNewSaleModalOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('sales.newSale')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center bg-white rounded-lg shadow-sm p-2">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder={t('sales.searchSales')}
            className="flex-1 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm"
          >
            <option value="all">{t('sales.filters.allDates')}</option>
            <option value="today">{t('sales.filters.today')}</option>
            <option value="week">{t('sales.filters.thisWeek')}</option>
            <option value="month">{t('sales.filters.thisMonth')}</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm"
          >
            <option value="all">{t('sales.filters.allPayments')}</option>
            <option value="card">{t('sales.paymentMethods.card')}</option>
            <option value="cash">{t('sales.paymentMethods.cash')}</option>
            <option value="pix">{t('sales.paymentMethods.pix')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.items')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.paymentMethod')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.total')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(sale.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {sale.sale_items?.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {item.quantity}x {item.products?.name} (${item.price_at_sale.toFixed(2)} each)
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {t(`sales.paymentMethods.${sale.payment_method}`)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  ${Number(sale.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
      />

      {selectedSale && (
        <EditSaleModal
          isOpen={isEditSaleModalOpen}
          onClose={() => {
            setIsEditSaleModalOpen(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
        />
      )}
    </div>
  );
};

export default Sales;
