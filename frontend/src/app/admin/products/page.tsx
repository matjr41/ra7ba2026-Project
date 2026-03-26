'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, Edit2, Trash2, CheckCircle, XCircle, Store, Tag, TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, tenantsResponse] = await Promise.all([
        adminApi.getAllProducts({ search: searchTerm, tenantId: filterTenant, status: filterStatus }),
        adminApi.getTenants(),
      ]);
      
      setProducts(productsResponse.data.data.map((p: any) => ({
        ...p,
        category: p.category?.nameAr || 'غير مصنف',
        createdAt: new Date(p.createdAt).toLocaleDateString('ar-DZ'),
      })));
      
      setTenants(tenantsResponse.data.tenants || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.nameAr.includes(searchTerm);
    const matchesTenant = filterTenant === 'all' || product.tenant.id === filterTenant;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive);
    return matchesSearch && matchesTenant && matchesStatus;
  });

  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const activeProducts = filteredProducts.filter(p => p.isActive).length;
  const outOfStock = filteredProducts.filter(p => p.stock === 0).length;

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`هل تريد حذف المنتج "${productName}"؟`)) return;
    
    try {
      await adminApi.deleteProduct(productId);
      alert('تم حذف المنتج بنجاح!');
      loadData();
    } catch (error) {
      alert('حدث خطأ في حذف المنتج');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
        <p className="text-gray-600">جميع منتجات جميع المتاجر في منصة واحدة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي المنتجات</p>
              <h3 className="text-3xl font-bold text-gray-900">{filteredProducts.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">منتجات نشطة</p>
              <h3 className="text-3xl font-bold text-gray-900">{activeProducts}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">نفذ من المخزون</p>
              <h3 className="text-3xl font-bold text-gray-900">{outOfStock}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">قيمة المخزون</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()} دج</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="all">جميع المتاجر</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المنتج</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المتجر</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الفئة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">السعر</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المخزون</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{product.nameAr}</p>
                      <p className="text-sm text-gray-500">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{product.tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{product.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{product.price.toLocaleString()} دج</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      product.stock === 0 ? 'bg-red-100 text-red-700' :
                      product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.stock} وحدة
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {product.isActive ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{product.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.nameAr)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
