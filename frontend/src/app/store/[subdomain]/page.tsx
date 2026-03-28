'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, X, Plus, Minus, Search, Filter,
  Truck, Shield, Star, Phone, MapPin, ChevronLeft,
  Package, CheckCircle, Heart, Zap, ArrowRight, Menu
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { getStoreIdentifier, getStoreBasePath } from '@/lib/store-utils';
import { formatCurrency } from '@/lib/utils';
import LocationSelector from '@/components/LocationSelector';

// ─── SSR-safe stripHtml ───────────────────────────────────────────────────────
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
};

// ─── Image helper ─────────────────────────────────────────────────────────────
const getFirstImage = (images: any): string | null => {
  if (!images) return null;
  try {
    const arr = typeof images === 'string' ? JSON.parse(images) : images;
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0];
  } catch { }
  return null;
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="h-16 bg-white border-b" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <Skeleton className="h-48 rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product, primaryColor, onBuy, onAdd, enableCart
}: {
  product: any; primaryColor: string; onBuy: (p: any) => void; onAdd: (p: any) => void; enableCart: boolean;
}) {
  const img = getFirstImage(product.images);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {img && !imgError ? (
          <img
            src={img}
            alt={product.nameAr || product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package size={40} className="text-gray-400" />
          </div>
        )}
        {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            خصم {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> مميز
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
          {product.nameAr || product.name}
        </h3>
        {product.category && (
          <span className="text-xs text-gray-400 mb-2">{product.category}</span>
        )}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold" style={{ color: primaryColor }}>
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>
          {enableCart ? (
            <button
              onClick={() => onAdd(product)}
              className="w-full py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart size={14} /> أضف للسلة
            </button>
          ) : (
            <button
              onClick={() => onBuy(product)}
              className="w-full py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              اشتري الآن
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StorePage() {
  const params = useParams();
  const storeId = getStoreIdentifier(params);
  const storeBasePath = getStoreBasePath(params, storeId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enableCart, setEnableCart] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [communeId, setCommuneId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [shippingFee, setShippingFee] = useState(600);

  // Theme
  const primaryColor = storeInfo?.theme?.primaryColor || '#6366F1';
  const fontFamily = storeInfo?.theme?.fontFamily || 'Cairo, sans-serif';

  // Load data
  useEffect(() => {
    if (!storeId) return;
    const savedCart = localStorage.getItem('cart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch { } }
    Promise.all([
      storefrontApi.getStore(storeId).catch(() => null),
      storefrontApi.getProducts(storeId).catch(() => null),
    ]).then(([storeRes, productsRes]) => {
      if (storeRes?.data) {
        const s = storeRes.data;
        setStoreInfo(s);
        if (typeof s.storeFeatures?.enableCart === 'boolean') setEnableCart(s.storeFeatures.enableCart);
      }
      if (productsRes?.data) {
        const list = productsRes.data?.data || productsRes.data || [];
        setProducts(list.map((p: any) => ({
          ...p,
          category: p.category?.nameAr || p.category?.name || p.category || '',
          images: (() => { try { return typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch { return []; } })(),
        })));
      }
    }).finally(() => setLoading(false));
  }, [storeId]);

  // Update shipping fee when wilaya changes
  useEffect(() => {
    if (!wilaya || !storeInfo?.shippingConfig) { setShippingFee(600); return; }
    try {
      const cfg = typeof storeInfo.shippingConfig === 'string'
        ? JSON.parse(storeInfo.shippingConfig) : storeInfo.shippingConfig;
      const wilayas = Array.isArray(cfg?.wilayas) ? cfg.wilayas : [];
      const matched = wilayas.find((w: any) => w?.wilayaName === wilaya || w?.wilayaCode === wilaya);
      if (matched && matched.isActive !== false) {
        const fee = Number(matched.homeDeliveryPrice ?? matched.deskDeliveryPrice ?? 600);
        setShippingFee(Number.isFinite(fee) ? fee : 600);
      }
    } catch { setShippingFee(600); }
  }, [wilaya, storeInfo]);

  // Cart helpers
  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
    setShowCart(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => {
      const next = prev.map(i => i.id === id ? { ...i, quantity: qty } : i);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, [removeFromCart]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  // Categories & filter
  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach(p => { if (p.category) s.add(p.category); });
    return ['all', ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    const catOk = selectedCategory === 'all' || p.category === selectedCategory;
    const searchOk = !searchTerm || (p.nameAr || p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return catOk && searchOk;
  }), [products, selectedCategory, searchTerm]);

  // Order submission
  const itemsSrc = enableCart ? cart : checkoutItems;
  const orderSubtotal = itemsSrc.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0);
  const orderTotal = orderSubtotal + shippingFee;

  const handleBuyNow = (product: any) => {
    setCheckoutItems([{ ...product, quantity: 1 }]);
    setShowCheckout(true);
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone || !wilaya || !commune || !address || itemsSrc.length === 0) return;
    try {
      setCheckoutSubmitting(true);
      await storefrontApi.createOrder(storeId, {
        customerName, customerPhone, wilaya, commune, address, notes,
        items: itemsSrc.map((it: any) => ({ productId: it.id, quantity: it.quantity || 1 })),
      });
      setOrderSuccess(true);
      if (enableCart) { setCart([]); localStorage.removeItem('cart'); }
      setTimeout(() => {
        setOrderSuccess(false);
        setShowCheckout(false);
        setShowCart(false);
        setCustomerName(''); setCustomerPhone(''); setWilaya(''); setCommune('');
        setWilayaId(null); setCommuneId(null); setAddress(''); setNotes('');
        setCheckoutItems([]);
      }, 3000);
    } catch (e) {
      console.error('Order failed', e);
      alert('فشل إرسال الطلب، حاول مجدداً');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  if (loading) return <StoreSkeleton />;

  const storeName = storeInfo?.nameAr || storeInfo?.name || storeId;
  const storeLogo = storeInfo?.logo;
  const storeBanner = storeInfo?.banner;
  const storeDesc = stripHtml(storeInfo?.descriptionAr || storeInfo?.description || '');

  return (
    <div dir="rtl" style={{ fontFamily }} className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href={storeBasePath || '#'} className="flex items-center gap-3 shrink-0">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="h-10 w-10 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: primaryColor }}>
                {storeName?.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-gray-900 text-lg hidden sm:block">{storeName}</span>
          </a>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Cart button */}
          {enableCart && (
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Search - mobile */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="bg-transparent flex-1 text-sm outline-none"
            />
          </div>
        </div>
      </header>

      {/* ── Banner ── */}
      {storeBanner && (
        <div className="relative h-48 md:h-72 w-full overflow-hidden">
          <img src={storeBanner} alt="banner" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 right-6 text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold drop-shadow-lg">{storeName}</h1>
            {storeDesc && <p className="text-sm md:text-base opacity-90 mt-1 max-w-md">{storeDesc}</p>}
          </div>
        </div>
      )}

      {/* ── Trust bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-8 flex-wrap text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><Truck size={14} className="text-green-500" /> توصيل سريع</span>
          <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-500" /> منتجات أصلية</span>
          <span className="flex items-center gap-1.5"><Phone size={14} className="text-purple-500" /> دعم على مدار الساعة</span>
          <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-500" fill="currentColor" /> تقييمات العملاء</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Category filter ── */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
                style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}
              >
                {cat === 'all' ? 'الكل' : cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Products grid ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                primaryColor={primaryColor}
                enableCart={enableCart}
                onAdd={addToCart}
                onBuy={handleBuyNow}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            {storeLogo && <img src={storeLogo} alt={storeName} className="h-8 w-8 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
            <span className="font-bold text-gray-800">{storeName}</span>
          </div>
          {storeDesc && <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">{storeDesc}</p>}
          {storeInfo?.phone && (
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2 mb-4">
              <Phone size={14} /> {storeInfo.phone}
            </p>
          )}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {storeName}
            {storeInfo?.subscription?.plan === 'FREE' && (
              <> · مدعوم بـ <a href="https://ra7ba.shop" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-semibold">رحبة</a></>
            )}
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════════════
           CART DRAWER
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[70] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={20} /> سلة المشتريات
                  {cartCount > 0 && <span className="text-sm font-normal text-gray-500">({cartCount} منتج)</span>}
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                    <p>السلة فارغة</p>
                  </div>
                ) : cart.map(item => {
                  const img = getFirstImage(item.images);
                  return (
                    <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        {img ? (
                          <img src={img} alt={item.nameAr || item.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.nameAr || item.name}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: primaryColor }}>{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition">
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition" style={{ backgroundColor: primaryColor }}>
                            <Plus size={12} />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className="mr-auto text-red-400 hover:text-red-600 transition">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t px-5 py-4 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>المجموع الفرعي</span>
                    <span className="font-bold text-gray-900">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <button
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    className="w-full py-3 rounded-xl text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    إتمام الطلب <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
           CHECKOUT MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[80]"
              onClick={() => !checkoutSubmitting && setShowCheckout(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                style={{ pointerEvents: 'auto' }}
              >
                {/* Success state */}
                {orderSuccess ? (
                  <div className="p-12 text-center">
                    <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">تم استلام طلبك! 🎉</h3>
                    <p className="text-gray-500">سنتواصل معك قريباً لتأكيد الطلب</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                      <h3 className="text-xl font-extrabold text-gray-900">إتمام الطلب</h3>
                      <button onClick={() => setShowCheckout(false)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Form */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">الاسم الكامل *</label>
                          <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="محمد أحمد"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">رقم الهاتف *</label>
                          <input
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="07xxxxxxxx"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">الولاية والبلدية *</label>
                        <LocationSelector
                          selectedWilaya={wilayaId ?? undefined}
                          selectedCommune={communeId ?? undefined}
                          onWilayaChange={(id, name) => { setWilayaId(id || null); setWilaya(name || ''); }}
                          onCommuneChange={(id, name) => { setCommuneId(id || null); setCommune(name || ''); }}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">العنوان التفصيلي *</label>
                        <input
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="الشارع، الحي، رقم المنزل..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">ملاحظات (اختياري)</label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="أي تعليمات إضافية..."
                          rows={2}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                      </div>

                      {/* Order summary */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <p className="font-bold text-gray-800 mb-3">ملخص الطلب</p>
                        {itemsSrc.map(it => (
                          <div key={it.id} className="flex justify-between text-gray-600">
                            <span className="truncate ml-4">{it.nameAr || it.name} × {it.quantity || 1}</span>
                            <span className="shrink-0 font-semibold">{formatCurrency(Number(it.price) * (it.quantity || 1))}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>المنتجات</span>
                            <span>{formatCurrency(orderSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>الشحن {wilaya ? `(${wilaya})` : ''}</span>
                            <span className="font-semibold">{formatCurrency(shippingFee)}</span>
                          </div>
                          <div className="flex justify-between text-gray-900 font-extrabold text-base pt-1">
                            <span>المجموع الكلي</span>
                            <span style={{ color: primaryColor }}>{formatCurrency(orderTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="border-t px-6 py-4 shrink-0">
                      <button
                        onClick={handleSubmitOrder}
                        disabled={checkoutSubmitting || !customerName || !customerPhone || !wilaya || !commune || !address || itemsSrc.length === 0}
                        className="w-full py-3.5 rounded-xl text-white font-extrabold text-base transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {checkoutSubmitting ? (
                          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الإرسال...</>
                        ) : (
                          <><CheckCircle size={20} /> تأكيد الطلب</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
