'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { User, Mail, Phone, Lock, Store, Globe, Gift, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    email: '',
    password: '',
    phone: '',
    // Store Info
    storeName: '',
    storeNameAr: '',
    subdomain: '',
  });

  const getOrCreateDeviceId = () => {
    if (typeof window === 'undefined') return undefined;
    try {
      const key = 'rahba_device_id';
      let id = window.localStorage.getItem(key);
      if (!id) {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          id = window.crypto.randomUUID();
        } else {
          id = `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const deviceId = getOrCreateDeviceId();

      // Map frontend data to backend expected format
      const registerData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,                    // Owner name
        phone: formData.phone,
        storeName: formData.storeName,          // English store name
        storeNameAr: formData.storeNameAr,      // Arabic store name
        subdomain: formData.subdomain,
        deviceId,
      };
      
      const { data } = await authApi.register(registerData);
      
      // Save tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to merchant dashboard
      router.push('/merchant/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    // Only allow lowercase alphanumeric and hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: cleaned });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] group-hover:drop-shadow-[0_0_50px_rgba(168,85,247,0.8)] transition-all duration-300">
              رحبة
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-purple-300 text-sm font-medium">منصة التجارة الإلكترونية</span>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
          </Link>
          <p className="text-gray-300 mt-4 text-xl font-bold">إنشاء متجرك الإلكتروني في دقائق ✨</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-pink-400' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${step >= 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]' : 'bg-gray-700 text-gray-400'} transition-all duration-300`}>
                1
              </div>
              <span className="font-bold">معلوماتك</span>
            </div>
            <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'} transition-all duration-300`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-pink-400' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${step >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]' : 'bg-gray-700 text-gray-400'} transition-all duration-300`}>
                2
              </div>
              <span className="font-bold">متجرك</span>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-purple-500/30 shadow-purple-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <User className="w-8 h-8 text-purple-400" />
                  معلوماتك الشخصية
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="أحمد بن علي"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm ltr-content"
                    placeholder="0555123456"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-purple-300 mt-1">8 أحرف على الأقل</p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2 group"
                >
                  التالي
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Step 2: Store Info */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <Store className="w-8 h-8 text-purple-400" />
                  معلومات المتجر
                </h3>

                {/* Store Name */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    اسم المتجر (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm ltr-content"
                    placeholder="My Awesome Store"
                  />
                </div>

                {/* Store Name Arabic */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    اسم المتجر (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storeNameAr}
                    onChange={(e) => setFormData({ ...formData, storeNameAr: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="متجري الرائع"
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    عنوان المتجر (Subdomain) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-white placeholder-gray-400 backdrop-blur-sm ltr-content"
                      placeholder="mystore"
                      pattern="[a-z0-9-]+"
                    />
                    <span className="text-purple-300 font-mono font-bold">.rahba.dz</span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    حروف صغيرة وأرقام وشرطات فقط
                  </p>
                  {formData.subdomain && (
                    <p className="text-sm text-pink-400 mt-2 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      متجرك سيكون: {formData.subdomain}.rahba.dz
                    </p>
                  )}
                </div>

                {/* Trial Info */}
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Gift className="w-10 h-10 text-green-400 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-green-300 mb-2 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        تجربة مجانية 7 أيام
                      </h4>
                      <ul className="text-sm text-green-200 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          20 طلب مجاني
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          10 منتجات مجانية
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          جميع الميزات
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          بدون بطاقة ائتمان
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/10 border border-purple-400/30 text-purple-200 py-3 rounded-lg hover:bg-white/20 transition-all duration-300 font-bold flex items-center justify-center gap-2 group"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-3 rounded-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        إنشاء المتجر 🚀
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center pt-6 border-t border-purple-500/20">
            <p className="text-purple-200">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="text-pink-400 hover:text-pink-300 font-bold transition-colors">
                تسجيل الدخول ✨
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
