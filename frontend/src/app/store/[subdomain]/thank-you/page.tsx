'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Home, Phone, Mail } from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function ThankYouPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = params.subdomain as string;
  
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const orderNumber = searchParams.get('order');

  // Get theme colors
  const primaryColor = store?.theme?.primaryColor || '#8B5CF6';
  const secondaryColor = store?.theme?.secondaryColor || '#EC4899';
  const accentColor = store?.theme?.accentColor || '#3B82F6';
  const fontFamily = store?.theme?.fontFamily || 'Cairo';

  useEffect(() => {
    loadStore();
  }, [subdomain]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const res = await storefrontApi.getStore(subdomain);
      setStore(res.data);
    } catch (error) {
      console.error('Failed to load store', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const defaultMessage = `شكراً لثقتك! 🎉

تم استلام طلبك بنجاح وسنتواصل معك قريباً لتأكيد التفاصيل.

نعمل جاهدين لتوفير أفضل تجربة تسوق لك!`;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        fontFamily: fontFamily,
        background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10, ${accentColor}10)`
      }}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header with gradient */}
        <div 
          className="p-8 text-center text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${accentColor})`
          }}
        >
          {/* Animated circles */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-16 h-16" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-4xl font-black mb-2">تم إتمام الطلب! 🎉</h1>
            {orderNumber && (
              <p className="text-white/90 text-lg">
                رقم الطلب: <span className="font-bold">#{orderNumber}</span>
              </p>
            )}
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Thank you image */}
          {store?.thankYouImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={store.thankYouImage}
                  alt="Thank you"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          )}

          {/* Thank you message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <div className="prose prose-lg mx-auto text-gray-700 whitespace-pre-line">
              {store?.thankYouMessage || defaultMessage}
            </div>
          </motion.div>

          {/* Store contact info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-4 text-center">للتواصل معنا</h3>
            <div className="space-y-3">
              {store?.phone && (
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                  <a href={`tel:${store.phone}`} className="hover:underline font-semibold">
                    {store.phone}
                  </a>
                </div>
              )}
              {store?.email && (
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5" style={{ color: secondaryColor }} />
                  <a href={`mailto:${store.email}`} className="hover:underline">
                    {store.email}
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Link
              href={`/store/${subdomain}`}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
              style={{ borderColor: primaryColor }}
            >
              <Home className="w-5 h-5" />
              العودة للمتجر
            </Link>
            <button
              onClick={() => router.push(`/store/${subdomain}`)}
              className="flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              style={{
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
              }}
            >
              مواصلة التسوق
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              <Package className="w-4 h-4" />
              سيتم التواصل معك خلال 24 ساعة
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 text-center text-white text-sm"
          style={{
            background: `linear-gradient(to right, ${primaryColor}20, ${secondaryColor}20)`
          }}
        >
          <p style={{ color: primaryColor }} className="font-semibold">
            {store?.nameAr || store?.name} - نشكرك على اختيارنا 💙
          </p>
        </div>
      </motion.div>
    </div>
  );
}
