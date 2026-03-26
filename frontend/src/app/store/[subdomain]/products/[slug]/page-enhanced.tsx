'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Star, Heart, Share2, Shield, Truck, 
  Package, Clock, ChevronLeft, ChevronRight, Zap,
  Award, CheckCircle, AlertCircle, Sparkles, Gift,
  TrendingUp, Users, Eye, ShoppingBag, Minus, Plus
} from 'lucide-react';
import { Button, Badge, Card, Input } from '@/components/ui';
import LocationSelector from '@/components/LocationSelector';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

// Strip HTML helper
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  
  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [communeId, setCommuneId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadProduct();
  }, [subdomain, slug]);

  const loadProduct = async () => {
    try {
      const [productRes, storeRes] = await Promise.all([
        storefrontApi.getProduct(subdomain, slug),
        storefrontApi.getStore(subdomain)
      ]);
      setProduct(productRes.data);
      setStore(storeRes.data);
    } catch (error) {
      console.error('Error loading product:', error);
      router.push(`/store/${subdomain}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    try {
      setCheckoutSubmitting(true);
      const payload = {
        customerName,
        customerPhone,
        wilaya,
        commune,
        address,
        items: [{ productId: product.id, quantity }],
        notes,
      };
      await storefrontApi.createOrder(subdomain, payload);
      
      setShowCheckout(false);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setWilaya('');
      setCommune('');
      setWilayaId(null);
      setCommuneId(null);
      setAddress('');
      setNotes('');
      
      // Show success animation
      router.push(`/store/${subdomain}/thank-you`);
    } catch (e) {
      console.error('Failed to create order', e);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const images = useMemo(() => {
    if (!product?.images) return [];
    try {
      const imgs = typeof product.images === 'string' 
        ? JSON.parse(product.images) 
        : product.images;
      return Array.isArray(imgs) ? imgs : [];
    } catch {
      return [];
    }
  }, [product]);

  const subtotal = Number(product?.price || 0) * quantity;
  const shippingEstimate = Number(store?.checkoutConfig?.shippingFee ?? 600);
  const grandTotal = subtotal + shippingEstimate;

  const discount = product?.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">المنتج غير موجود</h2>
          <Button onClick={() => router.push(`/store/${subdomain}`)}>
            العودة للمتجر
          </Button>
        </Card>
      </div>
    );
  }

  const primaryColor = store?.theme?.primaryColor || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-purple-100"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/store/${subdomain}`)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>العودة للمتجر</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(isWishlisted && "text-red-500")}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-4"
          >
            {/* Main Image */}
            <motion.div 
              className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.nameAr || product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                  <Package className="w-32 h-32 text-purple-300" />
                </div>
              )}
              
              {/* Discount Badge */}
              {discount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                    -{discount}%
                  </Badge>
                </motion.div>
              )}
              
              {/* Stock Badge */}
              {product.stock <= 5 && product.stock > 0 && (
                <motion.div 
                  animate={pulseAnimation}
                  className="absolute top-4 left-4"
                >
                  <Badge className="bg-orange-500 text-white">
                    آخر {product.stock} قطع!
                  </Badge>
                </motion.div>
              )}
            </motion.div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImage === idx 
                        ? "border-purple-500 shadow-lg" 
                        : "border-gray-200"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.nameAr} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={slideIn}
            className="space-y-6"
          >
            {/* Title & Category */}
            <div>
              {product.category && (
                <Badge variant="outline" className="mb-2">
                  {product.category.nameAr || product.category.name}
                </Badge>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {product.nameAr || product.name}
              </h1>
              
              {/* Rating & Views */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.8 (234 تقييم)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.views || 0} مشاهدة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>23 يشاهد الآن</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <motion.div 
              variants={scaleIn}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
            >
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">السعر</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(product.price)}
                    </span>
                    {product.comparePrice && (
                      <span className="text-xl text-gray-400 line-through">
                        {formatCurrency(product.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>
                {discount > 0 && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
                  >
                    وفر {formatCurrency(product.comparePrice - product.price)}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {stripHtml(product.descriptionAr || product.description || 'منتج مميز من تشكيلتنا')}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">منتج أصلي 100%</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg"
              >
                <Truck className="w-5 h-5" />
                <span className="text-sm font-medium">توصيل سريع</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-purple-50 text-purple-700 p-3 rounded-lg"
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">ضمان الجودة</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-orange-50 text-orange-700 p-3 rounded-lg"
              >
                <Gift className="w-5 h-5" />
                <span className="text-sm font-medium">هدية مع الطلب</span>
              </motion.div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">الكمية:</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => quantity < product.stock && setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                      boxShadow: `0 10px 30px ${primaryColor}40`
                    }}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    اطلب الآن
                  </Button>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="h-14 px-6 border-2"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>

              {/* Urgency Message */}
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-yellow-800">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    أسرع! 12 شخص يشاهد هذا المنتج الآن
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Trust Badges */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Award className="w-8 h-8 mx-auto text-purple-500" />
                  <p className="text-xs text-gray-600">جودة مضمونة</p>
                </div>
                <div className="space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-blue-500" />
                  <p className="text-xs text-gray-600">توصيل 24-48 ساعة</p>
                </div>
                <div className="space-y-2">
                  <TrendingUp className="w-8 h-8 mx-auto text-green-500" />
                  <p className="text-xs text-gray-600">الأكثر مبيعاً</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.relatedProducts.map((related: any) => (
                <motion.div
                  key={related.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/store/${subdomain}/products/${related.slug}`)}
                >
                  <div className="relative aspect-square">
                    {related.images?.[0] ? (
                      <Image
                        src={related.images[0]}
                        alt={related.nameAr || related.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {related.nameAr || related.name}
                    </h3>
                    <p className="text-purple-600 font-bold">
                      {formatCurrency(related.price)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCheckout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              style={{
                boxShadow: `0 0 100px ${primaryColor}30`,
                border: `2px solid ${primaryColor}20`
              }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">إتمام الطلب</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCheckout(false)}
                >
                  ×
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <h3 className="font-bold mb-3">ملخص الطلب</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {images[0] && (
                        <Image
                          src={images[0]}
                          alt={product.nameAr}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{product.nameAr || product.name}</p>
                        <p className="text-sm text-gray-600">الكمية: {quantity}</p>
                      </div>
                      <p className="font-bold">{formatCurrency(subtotal)}</p>
                    </div>
                  </div>
                  <div className="border-t mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>المجموع الجزئي</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>التوصيل</span>
                      <span>{formatCurrency(shippingEstimate)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>المجموع الكلي</span>
                      <span style={{ color: primaryColor }}>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info Form */}
                <div className="space-y-4">
                  <h3 className="font-bold">معلومات التوصيل</h3>
                  
                  <Input
                    placeholder="الاسم الكامل"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="h-12"
                  />
                  
                  <Input
                    placeholder="رقم الهاتف"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="h-12"
                    dir="ltr"
                  />
                  
                  <LocationSelector
                    selectedWilaya={wilayaId ?? undefined}
                    selectedCommune={communeId ?? undefined}
                    onWilayaChange={(id, name) => {
                      setWilayaId(id);
                      setWilaya(name);
                    }}
                    onCommuneChange={(id, name) => {
                      setCommuneId(id);
                      setCommune(name);
                    }}
                    required
                  />
                  
                  <Input
                    placeholder="العنوان بالتفصيل"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="h-12"
                  />
                  
                  <textarea
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none h-24"
                  />
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={checkoutSubmitting || !customerName || !customerPhone || !wilaya || !address}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {checkoutSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        تأكيد الطلب - {formatCurrency(grandTotal)}
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Trust Messages */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>دفع آمن</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span>توصيل سريع</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>جودة مضمونة</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
