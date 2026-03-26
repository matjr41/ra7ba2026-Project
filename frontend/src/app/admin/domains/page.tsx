'use client';

import { useState, useEffect } from 'react';
import { Globe, Check, X, Eye, AlertCircle, Copy, CheckCircle, ExternalLink, Trash2, Search, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminDomains() {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<{ tenantId: string; domain?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending_verification' | 'pending' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // استنتاج دومين المنصة من متغيرات البيئة (قائمة مفصولة بفواصل) للعرض في تعليمات DNS
  const rawAppDomains = (process.env.NEXT_PUBLIC_APP_DOMAIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const appHostname = (rawAppDomains[0] || 'www.ra7ba.shop').replace(/^https?:\/\//, '');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listDomains();
      setDomains(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = domains.filter((d: any) => {
    const statusOk =
      filterStatus === 'all'
        ? true
        : (d?.status === filterStatus) || (filterStatus === 'active' && (d?.status === 'active' || d?.isVerified));
    const q = searchQuery.trim().toLowerCase();
    const textOk = !q
      ? true
      : (String(d?.domain || '').toLowerCase().includes(q) || String(d?.tenantName || '').toLowerCase().includes(q));
    return statusOk && textOk;
  });

  const verifyDomain = async (tenantId: string, domain: string) => {
    try {
      setVerifying(true);
      const result = await adminApi.verifyDomain(tenantId, domain);
      setDnsRecords(result?.dnsRecords || []);
      setShowDNSModal(true);
    } catch (error) {
      showToast('فشل التحقق من السجلات', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const approveDomain = async (tenantId: string, domain: string) => {
    try {
      setActionLoading(true);
      await adminApi.approveDomain(tenantId, domain);
      showToast('تمت الموافقة على الدومين بنجاح! ✅', 'success');
      loadDomains();
    } catch (error) {
      showToast('حدث خطأ أثناء الموافقة', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectDomain = async (tenantId: string, reason: string) => {
    try {
      setActionLoading(true);
      await adminApi.rejectDomain(tenantId, reason);
      showToast('تم رفض الدومين', 'info');
      loadDomains();
    } catch (error) {
      showToast('حدث خطأ أثناء الرفض', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDomain = async (tenantId: string) => {
    try {
      setDeletingId(tenantId);
      setActionLoading(true);
      await adminApi.deleteDomain(tenantId);
      showToast('تم حذف الدومين', 'success');
      loadDomains();
    } catch (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setDeletingId(null);
      setActionLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const openConfirm = (action: 'approve' | 'reject' | 'delete', payload: { tenantId: string; domain?: string }) => {
    setConfirmAction(action);
    setConfirmPayload(payload);
    setRejectReason('');
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmPayload(null);
    setRejectReason('');
  };

  const handleConfirm = async () => {
    if (!confirmAction || !confirmPayload) return;
    try {
      if (confirmAction === 'approve') {
        await approveDomain(confirmPayload.tenantId, confirmPayload.domain || '');
      } else if (confirmAction === 'reject') {
        if (!rejectReason.trim()) {
          showToast('يرجى إدخال سبب الرفض', 'error');
          return;
        }
        await rejectDomain(confirmPayload.tenantId, rejectReason.trim());
      } else if (confirmAction === 'delete') {
        await deleteDomain(confirmPayload.tenantId);
      }
      closeConfirm();
    } catch (_) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ! ✅', 'info');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الدومينات المخصصة</h1>
        <p className="text-gray-600">الموافقة على طلبات ربط الدومينات</p>
      </div>

      {/* DNS Instructions Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          تعليمات DNS للتجار
        </h2>
        <div className="space-y-3 text-gray-700">
          <p className="font-semibold">يجب على التاجر إضافة السجلات التالية في إعدادات DNS الخاصة بالدومين:</p>
          
          <div className="bg-white rounded-lg p-4">
            <p className="font-bold text-blue-900 mb-2">1️⃣ سجل A Record:</p>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <p>Type: <span className="text-blue-600">A</span></p>
              <p>Name: <span className="text-blue-600">@</span></p>
              <p>Value: <span className="text-blue-600">76.76.21.21</span> (مثال - استبدل بـ IP الخاص بك)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="font-bold text-blue-900 mb-2">2️⃣ سجل CNAME Record:</p>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <p>Type: <span className="text-purple-600">CNAME</span></p>
              <p>Name: <span className="text-purple-600">www</span></p>
              <p>Value: <span className="text-purple-600">{appHostname}</span></p>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>⏱️ ملاحظة:</strong> قد يستغرق انتشار التغييرات من 1-48 ساعة
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الدومينات</p>
              <h3 className="text-3xl font-bold text-gray-900">{domains.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">مفعّلة</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {domains.filter((d: any) => d?.status === 'active' || d?.isVerified)?.length || 0}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">بانتظار التفعيل</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {domains.filter((d: any) => d?.status === 'pending' || d?.status === 'pending_verification')?.length || 0}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-2xl font-bold text-white">طلبات الدومينات</h2>
        </div>

        {/* Toolbar: search + status filter */}
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو المتجر..."
                className="w-full border rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">كل الحالات</option>
              <option value="active">مفعّل</option>
              <option value="pending_verification">بانتظار التحقق</option>
              <option value="pending">بانتظار الإعداد</option>
              <option value="error">خطأ</option>
            </select>
          </div>
        </div>

        {filteredDomains.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد طلبات دومينات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDomains.map((domain: any) => (
              <div key={domain.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{domain.domain || 'لم يحدد بعد'}</h3>
                        <p className="text-sm text-gray-600">
                          المتجر: <span className="font-semibold">{domain.tenantName || 'غير معروف'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">الحالة</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          domain.status === 'active' ? 'bg-green-100 text-green-700' :
                          domain.status === 'pending_verification' ? 'bg-blue-100 text-blue-700' :
                          domain.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {domain.status === 'active' ? 'مفعّل' : domain.status === 'pending_verification' ? 'بانتظار التحقق' : domain.status === 'pending' ? 'بانتظار الإعداد' : 'خطأ'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">آخر تحديث</p>
                        <p className="text-sm text-gray-800">{domain.verifiedAt || domain.requestedAt || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {domain.status === 'active' || domain.isVerified ? (
                      <>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold">
                          <CheckCircle className="w-5 h-5" />
                          مفعّل
                        </span>
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                          زيارة
                        </a>
                        <button
                          onClick={() => openConfirm('delete', { tenantId: domain.tenantId, domain: domain.domain })}
                          disabled={deletingId === domain.tenantId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => verifyDomain(domain.tenantId, domain.domain)}
                          disabled={verifying}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          التحقق من DNS
                        </button>
                        <button
                          onClick={() => openConfirm('approve', { tenantId: domain.tenantId, domain: domain.domain })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <Check className="w-4 h-4" />
                          موافقة
                        </button>
                        <button
                          onClick={() => openConfirm('reject', { tenantId: domain.tenantId, domain: domain.domain })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <X className="w-4 h-4" />
                          رفض
                        </button>
                        <button
                          onClick={() => openConfirm('delete', { tenantId: domain.tenantId, domain: domain.domain })}
                          disabled={deletingId === domain.tenantId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DNS Verification Modal */}
      {showDNSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">نتائج التحقق من DNS</h2>

            <div className="space-y-4">
              {dnsRecords.map((record, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-2 ${
                  record.status === 'verified' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{record.type} Record</span>
                    {record.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-bold">
                        <CheckCircle className="w-5 h-5" />
                        تم التحقق
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold">
                        <X className="w-5 h-5" />
                        غير صحيح
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-20">Name:</span>
                      <code className="flex-1 px-3 py-2 bg-white rounded border font-mono text-sm">{record.name}</code>
                      <button
                        onClick={() => copyToClipboard(record.name)}
                        className="p-2 hover:bg-gray-100 rounded transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-20">Value:</span>
                      <code className="flex-1 px-3 py-2 bg-white rounded border font-mono text-sm">{record.value}</code>
                      <button
                        onClick={() => copyToClipboard(record.value)}
                        className="p-2 hover:bg-gray-100 rounded transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDNSModal(false)}
              className="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تأكيد العملية</h3>
            <p className="text-gray-700 mb-4">
              {confirmAction === 'approve' && 'هل تريد الموافقة على ربط هذا الدومين؟'}
              {confirmAction === 'reject' && 'يرجى إدخال سبب الرفض لهذا الدومين:'}
              {confirmAction === 'delete' && 'هل تريد حذف هذا الدومين نهائياً؟'}
            </p>
            {confirmAction === 'reject' && (
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="سبب الرفض"
                className="w-full border rounded-lg p-3 mb-4"
                rows={3}
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                disabled={actionLoading || (confirmAction === 'reject' && !rejectReason.trim())}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
