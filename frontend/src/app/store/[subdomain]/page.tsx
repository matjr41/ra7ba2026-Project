'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, X, Plus, Minus, Search, Truck, Shield,
  Phone, Package, CheckCircle, ArrowLeft, Star, Tag,
  Home, Building2, ChevronRight, MapPin, Loader2
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { getStoreIdentifier, getStoreBasePath } from '@/lib/store-utils';
import { formatCurrency } from '@/lib/utils';
import LocationSelector from '@/components/LocationSelector';

// ── Helpers ──────────────────────────────────────────────────────────────────
const stripHtml = (h: string): string =>
  h ? h.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim() : '';

const parseImages = (raw: any): string[] => {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch { return []; }
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />;
}
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F7F9]" dir="rtl">
      <div className="h-16 bg-white shadow-sm" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Pulse className="h-52 w-full rounded-3xl" />
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <Pulse key={i} className="h-9 w-20 rounded-full" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length:10}).map((_,i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <Pulse className="h-44 rounded-none" />
              <div className="p-3 space-y-2">
                <Pulse className="h-3.5 w-4/5" />
                <Pulse className="h-3.5 w-2/5" />
                <Pulse className="h-9 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, primaryColor, enableCart, onAdd, onBuy, storeBasePath }: any) {
  const [err, setErr] = useState(false);
  const imgs = parseImages(product.images);
  const img = imgs[0];
  const discount = product.comparePrice && Number(product.comparePrice) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => window.location.href = `${storeBasePath}/products/${product.slug}`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {img && !err ? (
          <img
            src={img} alt={product.nameAr || product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package size={36} className="text-gray-300" />
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Star size={9} fill="currentColor" /> مميز
          </div>
        )}
        {/* Quick buy overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={e => { e.stopPropagation(); enableCart ? onAdd(product) : onBuy(product); }}
            className="text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            {enableCart ? 'أضف للسلة' : 'اشتري الآن'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[13px] text-gray-400 mb-0.5">{product.category || ''}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 flex-1">
          {product.nameAr || product.name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-extrabold" style={{ color: primaryColor }}>
            {formatCurrency(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); enableCart ? onAdd(product) : onBuy(product); }}
          className="w-full py-2.5 rounded-2xl text-white text-sm font-bold transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          {enableCart ? 'أضف للسلة' : 'اشتري الآن'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
function CheckoutModal({ open, onClose, items, storeInfo, storeId, onSuccess }: any) {
  const primaryColor = storeInfo?.theme?.primaryColor || '#6366F1';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [wilayaId, setWilayaId] = useState<number|null>(null);
  const [communeId, setCommuneId] = useState<number|null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home'|'office'>('home');
  const [shippingFee, setShippingFee] = useState(600);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calculate real shipping from config
  useEffect(() => {
    if (!wilaya || !storeInfo?.shippingConfig) { setShippingFee(600); return; }
    try {
      const cfg = typeof storeInfo.shippingConfig === 'string'
        ? JSON.parse(storeInfo.shippingConfig) : storeInfo.shippingConfig;
      const matched = (cfg?.wilayas || []).find((w: any) =>
        w?.wilayaName === wilaya || w?.wilayaCode === wilaya
      );
      if (matched && matched.isActive !== false) {
        const fee = deliveryType === 'office'
          ? Number(matched.deskDeliveryPrice ?? matched.homeDeliveryPrice ?? 600)
          : Number(matched.homeDeliveryPrice ?? 600);
        setShippingFee(Number.isFinite(fee) ? fee : 600);
      }
    } catch { setShippingFee(600); }
  }, [wilaya, deliveryType, storeInfo]);

  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * (i.quantity || 1), 0);
  const total = subtotal + shippingFee;
  const canSubmit = name && phone && wilaya && (deliveryType === 'office' || commune) && address;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await storefrontApi.createOrder(storeId, {
        customerName: name, customerPhone: phone,
        wilaya, commune: deliveryType === 'office' ? wilaya : commune,
        address, notes,
        items: items.map((i: any) => ({ productId: i.id, quantity: i.quantity || 1 })),
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSuccess(); onClose(); }, 2800);
    } catch { alert('فشل إرسال الطلب، حاول مجدداً'); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-3"
        onClick={() => !submitting && onClose()}
      >
        <motion.div
          initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
          transition={{ type: 'spring', damping: 26 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {success ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center px-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }}>
                <CheckCircle size={72} className="text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-extrabold text-gray-900">تم استلام طلبك! 🎉</h3>
              <p className="text-gray-500 text-sm">سنتواصل معك قريباً لتأكيد الطلب وتحديد موعد التوصيل</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <h3 className="text-xl font-extrabold text-gray-900">إتمام الطلب</h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable form */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">الاسم الكامل *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="محمد أحمد"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">رقم الهاتف *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07xxxxxxxx" dir="ltr"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
                  </div>
                </div>

                {/* Delivery type */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">نوع التوصيل *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeliveryType('home')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                        deliveryType === 'home'
                          ? 'text-white border-transparent'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      style={deliveryType === 'home' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Home size={16} /> توصيل للمنزل
                    </button>
                    <button
                      onClick={() => setDeliveryType('office')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                        deliveryType === 'office'
                          ? 'text-white border-transparent'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      style={deliveryType === 'office' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Building2 size={16} /> مكتب بريد
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">
                    {deliveryType === 'home' ? 'الولاية والبلدية *' : 'الولاية *'}
                  </label>
                  <LocationSelector
                    selectedWilaya={wilayaId ?? undefined}
                    selectedCommune={deliveryType === 'home' ? (communeId ?? undefined) : undefined}
                    onWilayaChange={(id, name) => { setWilayaId(id || null); setWilaya(name || ''); setCommuneId(null); setCommune(''); }}
                    onCommuneChange={(id, name) => { setCommuneId(id || null); setCommune(name || ''); }}
                    required
                    hideCommune={deliveryType === 'office'}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">
                    {deliveryType === 'home' ? 'العنوان التفصيلي *' : 'اسم مكتب البريد *'}
                  </label>
                  <input value={address} onChange={e => setAddress(e.target.value)}
                    placeholder={deliveryType === 'home' ? 'الشارع، الحي، رقم المنزل...' : 'مكتب البريد...'}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ملاحظات (اختياري)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="أي تعليمات إضافية للتوصيل..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none" />
                </div>

                {/* Order summary */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                  <p className="font-extrabold text-gray-800 mb-3">ملخص الطلب</p>
                  {items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-gray-600">
                      <span className="truncate ml-4">{it.nameAr || it.name} × {it.quantity || 1}</span>
                      <span className="shrink-0 font-semibold">{formatCurrency(Number(it.price) * (it.quantity || 1))}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                    <div className="flex justify-between text-gray-500">
                      <span>المنتجات</span><span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-1">
                        {deliveryType === 'home' ? <Home size={12}/> : <Building2 size={12}/>}
                        الشحن {wilaya ? `· ${wilaya}` : ''}
                      </span>
                      <span className="font-semibold">{formatCurrency(shippingFee)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-gray-900 text-base pt-1 border-t border-gray-200">
                      <span>المجموع</span>
                      <span style={{ color: primaryColor }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="border-t px-6 py-4 shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="w-full py-3.5 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting
                    ? <><Loader2 size={18} className="animate-spin" /> جاري الإرسال...</>
                    : <><CheckCircle size={18} /> تأكيد الطلب</>
                  }
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StorePage() {
  const params = useParams();
  const storeId = getStoreIdentifier(params);
  const storeBasePath = getStoreBasePath(params, storeId);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [enableCart, setEnableCart] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const primaryColor = storeInfo?.theme?.primaryColor || '#6366F1';
  const fontFamily = storeInfo?.theme?.fontFamily ? `${storeInfo.theme.fontFamily}, sans-serif` : 'Cairo, sans-serif';
  const storeName = storeInfo?.nameAr || storeInfo?.name || storeId;

  useEffect(() => {
    if (!storeId) return;
    try { const s = localStorage.getItem('cart'); if (s) setCart(JSON.parse(s)); } catch {}
    Promise.all([
      storefrontApi.getStore(storeId).catch(() => null),
      storefrontApi.getProducts(storeId).catch(() => null),
    ]).then(([sr, pr]) => {
      if (sr?.data) {
        setStoreInfo(sr.data);
        const f = sr.data?.storeFeatures || {};
        if (typeof f.enableCart === 'boolean') setEnableCart(f.enableCart);
      }
      if (pr?.data) {
        const list: any[] = pr.data?.data || pr.data || [];
        setProducts(list.map((p: any) => ({
          ...p,
          images: parseImages(p.images),
          category: p.category?.nameAr || p.category?.name || p.category || '',
        })));
      }
    }).finally(() => setLoading(false));
  }, [storeId]);

  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      const next = ex
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
    setShowCart(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => { const n = prev.filter(i => i.id !== id); localStorage.setItem('cart', JSON.stringify(n)); return n; });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => { const n = prev.map(i => i.id === id ? { ...i, quantity: qty } : i); localStorage.setItem('cart', JSON.stringify(n)); return n; });
  }, [removeFromCart]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const categories = useMemo(() => {
    const s = new Set<string>(); products.forEach(p => { if (p.category) s.add(p.category); }); return ['all', ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    const c = selectedCategory === 'all' || p.category === selectedCategory;
    const s = !searchTerm || (p.nameAr || p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return c && s;
  }), [products, selectedCategory, searchTerm]);

  if (loading) return <PageSkeleton />;

  return (
    <div dir="rtl" style={{ fontFamily }} className="min-h-screen bg-[#F7F7F9]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Logo */}
          <a href={storeBasePath || '#'} className="flex items-center gap-2.5 shrink-0 ml-auto">
            {storeInfo?.logo ? (
              <img src={storeInfo.logo} alt={storeName} className="h-9 w-9 rounded-2xl object-cover" onError={e => (e.currentTarget.style.display='none')} />
            ) : (
              <div className="h-9 w-9 rounded-2xl flex items-center justify-center text-white text-base font-extrabold" style={{ background: primaryColor }}>
                {(storeName || '?').charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-gray-900 text-lg">{storeName}</span>
          </a>

          {/* Search */}
          <div className="flex-1 max-w-sm mr-auto">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 min-w-0" />
            </div>
          </div>

          {/* Cart */}
          {enableCart && (
            <button onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white font-bold text-sm shrink-0 transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}>
              <ShoppingCart size={17} />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── Banner ── */}
      {storeInfo?.banner && (
        <div className="relative h-44 md:h-64 overflow-hidden">
          <img src={storeInfo.banner} alt="banner" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-xl">{storeName}</h1>
            {storeInfo?.descriptionAr || storeInfo?.description ? (
              <p className="text-sm text-white/80 mt-1 max-w-lg">{stripHtml(storeInfo.descriptionAr || storeInfo.description)}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Trust bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 flex-wrap">
          {[
            { icon: <Truck size={13} className="text-emerald-500" />, label: 'توصيل سريع' },
            { icon: <Shield size={13} className="text-blue-500" />, label: 'منتجات أصلية' },
            { icon: <Phone size={13} className="text-violet-500" />, label: 'دعم فوري' },
            { icon: <Star size={13} className="text-amber-500" fill="currentColor" />, label: 'جودة مضمونة' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              {icon}{label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Categories ── */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat ? 'text-white shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
                style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}>
                {cat === 'all' ? '🛍 الكل' : cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Products ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-28">
            <Package size={56} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">لا توجد منتجات</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} primaryColor={primaryColor}
                enableCart={enableCart} storeBasePath={storeBasePath}
                onAdd={addToCart}
                onBuy={(prod: any) => { setCheckoutItems([{ ...prod, quantity: 1 }]); setShowCheckout(true); }} />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            {storeInfo?.logo && <img src={storeInfo.logo} alt={storeName} className="h-8 w-8 rounded-xl object-cover" onError={e => (e.currentTarget.style.display='none')} />}
            <span className="font-extrabold text-gray-800">{storeName}</span>
          </div>
          {storeInfo?.phone && (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Phone size={13} />{storeInfo.phone}
            </p>
          )}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {storeName}
            {storeInfo?.subscription?.plan === 'FREE' && (
              <> · <a href="https://ra7ba.shop" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-semibold hover:underline">رحبة</a></>
            )}
          </p>
        </div>
      </footer>

      {/* ══ CART DRAWER ══ */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              className="fixed inset-y-0 left-0 w-full max-w-sm bg-white z-[70] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={19} style={{ color: primaryColor }} />
                  السلة {cartCount > 0 && <span className="text-sm font-normal text-gray-400">({cartCount})</span>}
                </h2>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 space-y-3">
                    <ShoppingCart size={44} className="mx-auto opacity-20" />
                    <p className="text-sm font-medium">السلة فارغة</p>
                  </div>
                ) : cart.map(item => {
                  const img = item.images?.[0];
                  return (
                    <div key={item.id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 shrink-0">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-gray-400" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.nameAr || item.name}</p>
                        <p className="text-sm font-extrabold mt-0.5" style={{ color: primaryColor }}>{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"><Minus size={11} /></button>
                          <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-xl flex items-center justify-center text-white transition" style={{ backgroundColor: primaryColor }}><Plus size={11} /></button>
                          <button onClick={() => removeFromCart(item.id)} className="mr-auto text-red-400 hover:text-red-600 p-1 transition"><X size={13} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {cart.length > 0 && (
                <div className="border-t px-5 py-4 space-y-3 shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المجموع</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <button
                    onClick={() => { setShowCart(false); setCheckoutItems(cart); setShowCheckout(true); }}
                    className="w-full py-3.5 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}>
                    إتمام الطلب <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ CHECKOUT ══ */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={checkoutItems.length > 0 ? checkoutItems : cart}
        storeInfo={storeInfo}
        storeId={storeId}
        onSuccess={() => { setCart([]); localStorage.removeItem('cart'); setCheckoutItems([]); }}
      />
    </div>
  );
}
