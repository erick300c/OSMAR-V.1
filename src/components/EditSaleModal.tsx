import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Minus, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';
import { Sale } from '../types';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

interface SaleItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, sale }) => {
  const { t } = useTranslation();
  const { products } = useProducts();
  const { updateSale } = useSales();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'pix'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  useEffect(() => {
    if (sale) {
      setItems(
        sale.sale_items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          priceAtSale: item.price_at_sale
        }))
      );
      setPaymentMethod(sale.payment_method as 'card' | 'cash' | 'pix');
      setSearchTerms(sale.sale_items.map(() => ''));
    }
  }, [sale]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, priceAtSale: 0 }]);
    setSearchTerms([...searchTerms, '']);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setSearchTerms(searchTerms.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value as string,
        priceAtSale: product?.selling_price || 0
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: typeof value === 'number' ? value : parseInt(value) || 0
      };
    }
    setItems(newItems);
  };

  const updateSearch = (index: number, value: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await updateSale(sale.id, {
        total: calculateTotal(),
        payment_method: paymentMethod,
        sale_items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price_at_sale: item.priceAtSale
        }))
      });
      onClose();
    } catch (error) {
      console.error('Failed to update sale:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredProducts = (searchTerm: string) => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('sales.editSale')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.productId ? 
                            products.find(p => p.id === item.productId)?.name || '' : 
                            searchTerms[index]
                          }
                          onChange={(e) => {
                            if (!item.productId) {
                              updateSearch(index, e.target.value);
                            }
                          }}
                          placeholder={t('sales.searchProduct')}
                          className="w-full rounded-lg border-gray-300 shadow-sm pr-8"
                          readOnly={!!item.productId}
                        />
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {searchTerms[index] && (
                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
                          {getFilteredProducts(searchTerms[index]).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                updateItem(index, 'productId', product.id);
                                updateSearch(index, '');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100"
                            >
                              {product.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 text-center rounded-lg border-gray-300 shadow-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-24 text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.quantity * item.priceAtSale)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              <Plus className="w-5 h-5 mx-auto" />
            </button>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.paymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash' | 'pix')}
                className="w-full rounded-lg border-gray-300 shadow-sm"
                required
              >
                <option value="card">{t('sales.paymentMethods.card')}</option>
                <option value="cash">{t('sales.paymentMethods.cash')}</option>
                <option value="pix">{t('sales.paymentMethods.pix')}</option>
              </select>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-lg font-semibold">
                {t('common.total')}: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(calculateTotal())}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.some(item => !item.productId)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? t('common.processing') : t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;
