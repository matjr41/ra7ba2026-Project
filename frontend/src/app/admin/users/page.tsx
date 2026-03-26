'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Shield, Store, UserCheck, UserX, Eye, Ban, CheckCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getAllUsers({ search: searchTerm, role: filterRole, status: filterStatus });
      
      setUsers(data.data.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt).toLocaleDateString('ar-DZ'),
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.includes(searchTerm) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const merchants = filteredUsers.filter(u => u.role === 'MERCHANT').length;
  const customers = filteredUsers.filter(u => u.role === 'CUSTOMER').length;
  const activeUsers = filteredUsers.filter(u => u.isActive).length;

  const toggleUserStatus = async (userId: string) => {
    if (confirm('هل تريد تغيير حالة هذا المستخدم؟')) {
      try {
        await adminApi.toggleUserStatus(userId);
        alert('تم تغيير حالة المستخدم بنجاح!');
        loadData();
      } catch (error) {
        alert('حدث خطأ');
      }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-600">التجار والعملاء في المنصة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
              <h3 className="text-3xl font-bold text-gray-900">{filteredUsers.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">التجار</p>
              <h3 className="text-3xl font-bold text-gray-900">{merchants}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Store className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">العملاء</p>
              <h3 className="text-3xl font-bold text-gray-900">{customers}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">نشطين</p>
              <h3 className="text-3xl font-bold text-gray-900">{activeUsers}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <CheckCircle className="w-8 h-8 text-orange-600" />
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
              placeholder="ابحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
          >
            <option value="all">جميع الأدوار</option>
            <option value="MERCHANT">تاجر</option>
            <option value="CUSTOMER">عميل</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الدور</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المتجر</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الإحصائيات</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                      user.role === 'MERCHANT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'MERCHANT' ? <Store className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {user.role === 'MERCHANT' ? 'تاجر' : 'عميل'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.tenant ? (
                      <div>
                        <p className="font-semibold text-gray-900">{user.tenant.name}</p>
                        <p className="text-sm text-gray-500">@{user.tenant.subdomain}</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${
                          user.tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.tenant.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {user.role === 'MERCHANT' && (
                        <>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">{user.productsCount}</span> منتج
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">{user.ordersCount}</span> طلب
                          </div>
                        </>
                      )}
                      {user.role === 'CUSTOMER' && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{user.ordersCount}</span> طلب
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{user.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-2 rounded-lg transition ${
                          user.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
