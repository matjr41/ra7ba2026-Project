'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Store, Search, Filter, Eye, Ban, CheckCircle, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';

export default function AdminMerchantsPage() {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => { loadMerchants(); }, [statusFilter]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getTenants(1, 100, statusFilter || undefined);
      setMerchants(data?.data || []);
    } catch { } finally { setLoading(false); }
  };

  const handleSuspend = async () => {
    if (!suspendModal || !suspendReason.trim()) return;
    try {
      setActionLoading(suspendModal.id);
      await adminApi.suspendTenant(suspendModal.id, suspendReason);
      setSuspendModal(null);
      setSuspendReason('');
      loadMerchants();
    } catch { alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const handleActivate = async (id: string) => {
    try {
      setActionLoading(id);
      await adminApi.activateTenant(id);
      loadMerchants();
    } catch { alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const filtered = merchants.filter(m =>
    (m.nameAr || m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: merchants.length,
    active: merchants.filter(m => m.status === 'ACTIVE').length,
    trial: merchants.filter(m => m.status === 'TRIAL').length,
    suspended: merchants.filter(m => m.status === 'SUSPENDED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          إدارة المتاجر
        </h1>
        <p className="text-gray-500 mt-1 text-sm">تفعيل وإيقاف المتاجر والإشراف عليها</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'الكل', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'نشط', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'تجريبي', value: stats.trial, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'موقوف', value: stats.suspended, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو النطاق أو البريد..."
            className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white">
            <option value="">جميع الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="TRIAL">تجريبي</option>
            <option value="SUSPENDED">موقوف</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد متاجر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['المتجر', 'المالك', 'الحالة', 'الاشتراك', 'تاريخ التسجيل', 'التحكم'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const isActive = m.status === 'ACTIVE' || m.status === 'TRIAL';
                  const isSuspended = m.status === 'SUSPENDED';
                  const isLoading = actionLoading === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {m.logo ? (
                            <img src={m.logo} alt="" className="w-9 h-9 rounded-xl object-cover" onError={e => (e.currentTarget.style.display='none')} />
                          ) : (
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                              {(m.nameAr || m.name || '?').charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{m.nameAr || m.name}</p>
                            <a href={`/store/${m.subdomain}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline">{m.subdomain}.ra7ba.shop</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800">{m.owner?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{m.owner?.email || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          m.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                          m.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {m.status === 'ACTIVE' && '● نشط'}
                          {m.status === 'TRIAL' && '● تجريبي'}
                          {m.status === 'SUSPENDED' && '● موقوف'}
                          {m.status === 'EXPIRED' && '● منتهي'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {m.subscription?.plan === 'FREE' ? 'مجاني' :
                         m.subscription?.plan === 'STANDARD' ? 'قياسي' :
                         m.subscription?.plan === 'PRO' ? 'احترافي' : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString('ar-DZ') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* Preview */}
                          <a href={`/store/${m.subdomain}`} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition" title="معاينة">
                            <Eye className="w-4 h-4" />
                          </a>

                          {/* Toggle active/suspend */}
                          {isLoading ? (
                            <div className="w-8 h-8 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          ) : isSuspended ? (
                            <button onClick={() => handleActivate(m.id)}
                              className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition" title="تفعيل المتجر">
                              <ToggleLeft className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => { setSuspendModal({ id: m.id, name: m.nameAr || m.name }); setSuspendReason(''); }}
                              className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition" title="إيقاف المتجر">
                              <ToggleRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-gray-900">إيقاف المتجر</h3>
              <button onClick={() => setSuspendModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              هل أنت متأكد من إيقاف متجر <span className="font-bold text-gray-900">"{suspendModal.name}"</span>؟
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">سبب الإيقاف *</label>
              <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                rows={3} placeholder="اكتب سبب الإيقاف..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
                إلغاء
              </button>
              <button onClick={handleSuspend} disabled={!suspendReason.trim() || !!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                إيقاف المتجر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
