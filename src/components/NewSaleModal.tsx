import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Minus, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SaleItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
  productName?: string;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { products } = useProducts();
  const { createSale } = useSales();
  const [items, setItems] = useState<SaleItem[]>([{ productId: '', quantity: 1, priceAtSale: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'pix'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>(['']);

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
        [field]: value as string,
        priceAtSale: product?.selling_price || 0,
        productName: product?.name
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
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
      await createSale({
        total: calculateTotal(),
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale
        }))
      });
      setItems([{ productId: '', quantity: 1, priceAtSale: 0 }]);
      setSearchTerms(['']);
      setPaymentMethod('card');
      onClose();
    } catch (error) {
      console.error('Failed to create sale:', error);
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
          <h2 className="text-2xl font-bold">{t('sales.newSale')}</h2>
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
                          value={item.productId ? item.productName || '' : searchTerms[index]}
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
                      {searchTerms[index] && !item.productId && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                          {getFilteredProducts(searchTerms[index]).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                updateItem(index, 'productId', product.id);
                                updateSearch(index, '');
                              }}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                ${product.selling_price.toFixed(2)} - {product.quantity} {product.unit} available
                              </div>
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
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('sales.addItem')}
            </button>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.paymentMethod')}
              </label>
              <div className="flex gap-4">
                {(['card', 'cash', 'pix'] as const).map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    {t(`sales.paymentMethods.${method}`)}
                  </label>
                ))}
              </div>
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

export default NewSaleModal;
