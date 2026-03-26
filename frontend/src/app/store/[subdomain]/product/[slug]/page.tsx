'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Eye, Star, Check, Package, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const slug = params.slug as string;

  // Temporary redirect to the improved products route
  useEffect(() => {
    if (subdomain && slug) {
      router.replace(`/store/${subdomain}/products/${slug}`);
    }
  }, [router, subdomain, slug]);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProduct();
  }, [subdomain, slug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await storefrontApi.getProduct(subdomain, slug);
      setProduct(res.data);
      setRelatedProducts(res.data.relatedProducts || []);
    } catch (error) {
      console.error('Failed to load product', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    router.push(`/store/${subdomain}/order/${product.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-cairo">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-xl font-cairo mb-4">المنتج غير موجود</p>
          <Button onClick={() => router.push(`/store/${subdomain}`)} className="font-cairo">
            العودة للمتجر
          </Button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : (product.thumbnail ? [product.thumbnail] : []);
  const discount = product.comparePrice 
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/store/${subdomain}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-cairo"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للمتجر
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg"
            >
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.nameAr}
                  fill
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="w-32 h-32 text-gray-300" />
                </div>
              )}

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                  خصم {discount}%
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-blue-500 shadow-md scale-105'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Image src={img} alt={`${product.nameAr} ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 font-cairo leading-tight">
                {product.nameAr || product.name}
              </h1>
              
              {/* Views & Rating */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="font-tajawal">{product.views || 0} مشاهدة</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-gray-600 mr-2 font-tajawal">(4.8)</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-4 mb-6">
                <div className="text-4xl lg:text-5xl font-bold text-blue-600 font-cairo">
                  {formatCurrency(product.price)}
                </div>
                {product.comparePrice && (
                  <div className="text-2xl text-gray-400 line-through mb-2 font-cairo">
                    {formatCurrency(product.comparePrice)}
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                {product.stock > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-bold font-tajawal">متوفر في المخزون ({product.stock} قطعة)</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-bold font-tajawal">غير متوفر حالياً</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {product.descriptionAr && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-cairo">وصف المنتج</h3>
                <div 
                  className="text-gray-700 leading-relaxed font-tajawal text-lg prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.descriptionAr }}
                />
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <Check className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-bold text-gray-900 mb-1 font-cairo">توصيل سريع</h4>
                <p className="text-sm text-gray-600 font-tajawal">خلال 24-48 ساعة</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <Check className="w-6 h-6 text-green-600 mb-2" />
                <h4 className="font-bold text-gray-900 mb-1 font-cairo">دفع عند الاستلام</h4>
                <p className="text-sm text-gray-600 font-tajawal">آمن ومضمون</p>
              </div>
            </div>

            {/* Order Button */}
            <Button
              onClick={handleOrderNow}
              disabled={product.stock === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 rounded-xl shadow-lg text-xl font-cairo disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-6 h-6 ml-2" />
              اطلب الآن
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 font-cairo">منتجات مشابهة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProd: any) => (
                <motion.div
                  key={relProd.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => router.push(`/store/${subdomain}/products/${relProd.slug}`)}
                  className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="relative h-48">
                    {relProd.images?.[0] ? (
                      <Image src={relProd.images[0]} alt={relProd.nameAr} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 font-cairo">
                      {relProd.nameAr}
                    </h3>
                    <div className="text-2xl font-bold text-blue-600 font-cairo">
                      {formatCurrency(relProd.price)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
