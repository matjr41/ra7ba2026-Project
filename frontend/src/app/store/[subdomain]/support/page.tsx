'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    try {
      const g = localStorage.getItem('ra7ba:settings:general');
      if (g) {
        const gj = JSON.parse(g);
        if (gj.supportEmail) setEmail(gj.supportEmail);
        if (gj.supportPhone) setPhone(gj.supportPhone);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
          <h1 className="mb-6 text-3xl font-extrabold text-slate-900">الدعم والتواصل</h1>
          <p className="mb-6 text-slate-600">يسعدنا تواصلك معنا لأي استفسار أو مساعدة.</p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <Mail className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm text-slate-500">البريد الإلكتروني</p>
                <p className="font-semibold text-slate-900">{email || 'غير محدد'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <Phone className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm text-slate-500">رقم الهاتف</p>
                <p className="font-semibold text-slate-900">{phone || 'غير محدد'}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-4 text-sm text-slate-600">
              <MessageSquare className="mr-2 inline h-4 w-4 text-primary-500" />
              للإستفسارات العاجلة يمكنك مراسلتنا عبر البريد أو الهاتف المذكورين أعلاه.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
