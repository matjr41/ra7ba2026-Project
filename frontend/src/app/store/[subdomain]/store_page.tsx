'use client';

import { useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Star,
  MapPin,
  Sparkles,
  Heart,
  ShieldCheck,
  Truck,
  Filter,
  Search,
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { getStoreIdentifier, getStoreBasePath } from '@/lib/store-utils';
import { formatCurrency } from '@/lib/utils';

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
  if (typeof window !== 'undefined') {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
};

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import LocationSelector from '@/components/LocationSelector';
import DarkStorefront from './page_new_design';

// Animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function StorePage() {
  const params = useParams();
  const storeId = getStoreIdentifier(params);
  const storeBasePath = getStoreBasePath(params, storeId);
  const safeStorePath = storeBasePath || '#';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [supportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [offersEnabled, setOffersEnabled] = useState(true);
  const [enableCart, setEnableCart] = useState(true);

  // One-click checkout (when cart disabled)
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Location
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [communeId, setCommuneId] = useState<number | null>(null);

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!storeId) return;
    loadProducts();
    loadStore();
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    // Keep some UI feature flags optionally from localStorage
    try {
      const features = localStorage.getItem('ra7ba:settings:features');
      if (features) {
        const fj = JSON.parse(features);
        if (typeof fj.showReviews === 'boolean') setReviewsEnabled(fj.showReviews);
        if (typeof fj.showOffers === 'boolean') setOffersEnabled(fj.showOffers);
      }
    } catch {}
  }, [storeId]);

  const loadProducts = async () => {
    try {
      const targetStoreId = storeId;
      console.log('🏪 [StorePage] Loading products for store:', targetStoreId);
      console.log('🏪 [StorePage] Full params:', params);
      
      if (!targetStoreId) {
        console.error('❌ [StorePage] No store identifier found in params!');
        return;
      }
      
      const response = await storefrontApi.getProducts(targetStoreId);
      const list = response.data?.data || [];
      const mapped = list.map((p: any) => ({
        ...p,
        category: p.category?.nameAr || p.category?.name || p.category || '',
      }));
      setProducts(mapped);
      setStoreInfo((prev: any) => prev ?? { name: targetStoreId, subdomain: targetStoreId });
      console.log('✅ [StorePage] Products loaded:', mapped.length, 'products');
    } catch (error) {
      console.error('❌ [StorePage] Error loading products:', error);
      setProducts([]);
      if (storeId) {
        setStoreInfo({ name: storeId, subdomain: storeId });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStore = async () => {
    try {
      const targetStoreId = storeId;
      console.log('🏪 [StorePage] Loading store info for identifier:', targetStoreId);
      
      if (!targetStoreId) {
        console.error('❌ [StorePage] No store identifier found in params!');
        return;
      }
      
      const response = await storefrontApi.getStore(targetStoreId);
      const store = response.data;
      console.log('✅ [StorePage] Store loaded:', store.name || store.nameAr || targetStoreId);
      setStoreInfo(store);
      setStoreDescription(stripHtml(store.descriptionAr || store.description || ''));
      setStoreAddress(store.address || '');
      setSupportPhone(store.phone || '');
      if (store.storeFeatures) {
        if (typeof store.storeFeatures.enableCart === 'boolean') setEnableCart(store.storeFeatures.enableCart);
        if (typeof store.storeFeatures.showReviews === 'boolean') setReviewsEnabled(store.storeFeatures.showReviews);
        if (typeof store.storeFeatures.showSeasonalOffers === 'boolean') setOffersEnabled(store.storeFeatures.showSeasonalOffers);
      }
    } catch (error) {
      console.error('❌ [StorePage] Error loading store info:', error);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return ['all', ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const heroProduct = useMemo(() => filteredProducts[0], [filteredProducts]);
  const spotlightProducts = useMemo(() => filteredProducts.slice(0, 6), [filteredProducts]);
  const randomProducts = useMemo(() => {
    if (!products || products.length === 0) return [] as any[];
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }, [products]);

  const handleSubmitOrder = async () => {
    try {
      setCheckoutSubmitting(true);
      const targetStoreId = storeId;
      if (!targetStoreId) {
        console.error('❌ [StorePage] No store identifier available for order creation');
        setCheckoutSubmitting(false);
        return;
      }
      const itemsSrc = enableCart ? cart : checkoutItems;
      if (!itemsSrc || itemsSrc.length === 0) {
        setCheckoutSubmitting(false);
        return;
      }
      const payload = {
        customerName,
        customerPhone,
        wilaya,  // Arabic wilaya name
        commune, // Arabic commune name
        address,
        items: itemsSrc.map((it: any) => ({ productId: it.id, quantity: it.quantity || 1 })),
        notes,
      };
      await storefrontApi.createOrder(targetStoreId, payload);

      // Clear cart after success if used
      if (enableCart) {
        setCart([]);
        localStorage.removeItem('cart');
      }
      setShowCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      setWilaya('');
      setCommune('');
      setWilayaId(null);
      setCommuneId(null);
      setAddress('');
      setNotes('');
      setCheckoutItems([]);
      if (storeBasePath) {
        router.push(storeBasePath);
      }
    } catch (e) {
      console.error('Failed to create order', e);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Dark theme storefront (افتراضي): إذا لم تكن هناك إعدادات theme أو ليست "light"، اعرض التصميم الداكن الجديد
  const isDark = !storeInfo?.theme || storeInfo?.theme?.mode !== 'light';
  if (isDark) {
    return <DarkStorefront />;
  }

  const itemsSrc = enableCart ? cart : checkoutItems;
  const subtotal = itemsSrc.reduce((s, it) => s + (Number(it.price) * (it.quantity || 1)), 0);
  const shippingEstimate = Number(storeInfo?.checkoutConfig?.shippingFee ?? 600);
  const grandTotal = Number(subtotal) + Number(shippingEstimate);

  // Get theme colors and fonts
  const primaryColor = storeInfo?.theme?.primaryColor || '#3B82F6';
  const secondaryColor = storeInfo?.theme?.secondaryColor || '#8B5CF6';
  const accentColor = storeInfo?.theme?.accentColor || '#EC4899';
  const fontFamily = storeInfo?.theme?.fontFamily || 'Cairo';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white" style={{ fontFamily }}>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-sky-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg"
                style={{
                  boxShadow: `0 0 22px ${(storeInfo?.theme?.primaryColor || '#3B82F6')}55`,
                }}
              >
                {storeInfo?.logo ? (
                  <Image src={storeInfo.logo} alt="Store logo" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-primary-500 to-primary-700">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 mb-0.5">
                  {storeInfo?.name || 'متجر رحبة'}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> توصيل سريع في 24 ساعة
                  </span>
                  <span className="hidden sm:flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-500" /> ضمان الجودة
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {enableCart && (
                <Button
                  variant="ghost"
                  className="relative h-11 rounded-xl border"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor
                  }}
                  onClick={() => setShowCart(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  عربة التسوق
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* تنقّل صفحات المتجر */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <a href="#top" className="px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: `${primaryColor}40`, color: 'rgb(51, 65, 85)' }} onMouseEnter={(e) => { e.currentTarget.style.color = primaryColor; e.currentTarget.style.borderColor = primaryColor; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(51, 65, 85)'; e.currentTarget.style.borderColor = `${primaryColor}40`; }}>الرئيسية</a>
            <a href="#categories" className="px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: `${primaryColor}40`, color: 'rgb(51, 65, 85)' }} onMouseEnter={(e) => { e.currentTarget.style.color = primaryColor; e.currentTarget.style.borderColor = primaryColor; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(51, 65, 85)'; e.currentTarget.style.borderColor = `${primaryColor}40`; }}>التصنيفات</a>
            <a href={`${safeStorePath}/support`} className="px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: `${primaryColor}40`, color: 'rgb(51, 65, 85)' }} onMouseEnter={(e) => { e.currentTarget.style.color = primaryColor; e.currentTarget.style.borderColor = primaryColor; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(51, 65, 85)'; e.currentTarget.style.borderColor = `${primaryColor}40`; }}>الدعم</a>
          </div>
        </div>
      </header>

      {/* Banner */}
      {storeInfo?.banner && (
        <div className="w-full h-40 sm:h-56 md:h-64 lg:h-72 relative">
          <Image src={storeInfo.banner} alt="Store banner" fill className="object-cover" />
        </div>
      )}

      <main className="container mx-auto px-4 py-10 space-y-12">
        {/* منتجات مختارة عشوائياً */}
        {randomProducts.length > 0 && (
          <section className="-mt-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {randomProducts.map((p) => (
                <a
                  key={p.id}
                  href={`${safeStorePath}/products/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow transition hover:-translate-y-1 hover:shadow-lg"
               >
                  <div className="relative h-40 bg-slate-100">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag size={36} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-bold text-slate-900">{p.name}</h3>
                      <span className="text-primary-600 font-bold">{formatCurrency(p.price)}</span>
                    </div>
                    <Button className="mt-3 h-10 w-full rounded-xl">اشتري الآن</Button>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
        {/* وصف المتجر والعنوان */}
        {(storeDescription || storeAddress) && (
          <section className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2">
              {storeDescription && (
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">وصف المتجر</h3>
                  <p className="text-slate-600 leading-relaxed">{storeDescription}</p>
                </div>
              )}
              {storeAddress && (
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">العنوان</h3>
                  <p className="text-slate-600">{storeAddress}</p>
                </div>
              )}
            </div>
          </section>
        )}
        {heroProduct ? (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="grid gap-6 lg:grid-cols-[1.4fr,1fr]"
          >
            <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary-600 via-primary-500 to-blue-500 p-0 text-white shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]" />
              <div className="relative flex h-full flex-col justify-between p-10">
                <div className="space-y-6">
                  <h2 className="text-4xl font-black leading-tight">
                    اكتشف أفضل المنتجات المختارة خصيصاً لك
                  </h2>
                  <p className="max-w-xl text-lg text-white/80">
                    منتجات أصلية، شحن سريع، وخدمة عملاء مميزة. استمتع بتجربة تسوق فاخرة وادفع عند الاستلام بكل أمان.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-300" /> سلع مميزة ذات تقييمات عالية
                    </span>
                    <span className="flex items-center gap-2">
                      <Truck size={16} /> توصيل مجاني للطلبات فوق 10,000 دج
                    </span>
                    <span className="flex items-center gap-2">
                      <Heart size={16} /> منتجات مختارة بعناية
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="h-11 rounded-xl bg-white/95 px-6 text-primary-700 hover:bg-white">
                    تصفح التشكيلة الكاملة
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-11 rounded-xl border border-white/30 bg-white/20 px-6 text-white backdrop-blur hover:bg-white/30"
                    onClick={() => setSelectedCategory('all')}
                  >
                    أحدث الإصدارات
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-slate-100 bg-white/80 shadow-lg backdrop-blur">
              <CardHeader className="items-start gap-2">
                <CardTitle className="text-2xl text-slate-900">
                  {heroProduct?.name}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {stripHtml(heroProduct?.descriptionAr || heroProduct?.description || 'منتج فاخر من مجموعتنا المختارة بعناية')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-100">
                  {heroProduct?.images?.[0] ? (
                    <Image
                      src={heroProduct.images[0]}
                      alt={heroProduct.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ShoppingBag size={48} />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">السعر الحالي</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(heroProduct?.price || 0)}
                    </p>
                  </div>
                  {enableCart ? (
                    <Button
                      className="h-11 rounded-xl px-6"
                      onClick={() => addToCart(heroProduct)}
                    >
                      أضف للسلة الآن
                    </Button>
                  ) : (
                    <Button
                      className="h-11 rounded-xl px-6"
                      onClick={() => { setCheckoutItems([{ ...heroProduct, quantity: 1 }]); setShowCheckout(true); }}
                    >
                      اطلب الآن
                    </Button>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-4 text-sm text-slate-500">
                <div className="flex w-full flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Star className="h-4 w-4 text-amber-400" />
                    {heroProduct?.rating?.toFixed?.(1) || '4.9'} تقييم العملاء
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> ضمان استرجاع لمدة 7 أيام
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="h-4 w-4" /> جاهز للشحن من مخازن رحبة
                </div>
              </CardFooter>
            </Card>
          </motion.section>
        ) : (
          <Card className="rounded-3xl border-none bg-white/70 py-20 text-center shadow-lg">
            <CardContent className="space-y-4">
              <ShoppingBag size={64} className="mx-auto text-slate-200" />
              <CardTitle className="text-2xl text-slate-800">
                لا توجد منتجات متاحة حالياً
              </CardTitle>
              <CardDescription className="text-slate-500">
                سيتم تحديث المتجر بأحدث المنتجات قريباً. عد لاحقاً للاطلاع على الجديد.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 rounded-3xl bg-white/70 p-6 shadow-lg md:grid-cols-3">
          <Card className="h-full rounded-2xl border border-slate-100 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Sparkles />
              </div>
              <div>
                <p className="text-sm text-slate-500">منتجات مختارة بعناية</p>
                <p className="text-lg font-semibold text-slate-800">{products.length}+ منتج حصري</p>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full rounded-2xl border border-slate-100 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck />
              </div>
              <div>
                <p className="text-sm text-slate-500">استبدال مجاني</p>
                <p className="text-lg font-semibold text-slate-800">ضمان لمدة 7 أيام</p>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full rounded-2xl border border-slate-100 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Truck />
              </div>
              <div>
                <p className="text-sm text-slate-500">توصيل سريع وآمن</p>
                <p className="text-lg font-semibold text-slate-800">+100 مدينة مغطاة</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="categories" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900">المنتجات</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-11 w-64 rounded-xl border border-slate-200 bg-white pl-10"
                  placeholder="ابحث عن منتجك المفضل..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Badge variant="outline" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-slate-600" style={{ borderColor: `${primaryColor}40` }}>
                <Filter className="h-4 w-4" style={{ color: primaryColor }} />
                فئات مخصصة
              </Badge>
            </div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {spotlightProducts.map((product) => (
              <motion.div key={product.id} variants={fadeIn}>
                <Card className="group h-full rounded-2xl border border-slate-100 bg-white/80 shadow-lg transition-all hover:-translate-y-2 hover:border-primary-100">
                  <a href={`${safeStorePath}/products/${product.slug}`} className="relative block h-56 overflow-hidden rounded-2xl bg-slate-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ShoppingBag size={36} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Badge className="rounded-full bg-white/90 shadow" style={{ color: primaryColor }}>
                        {product.category || 'مختار'}
                      </Badge>
                      <Badge variant="outline" className="rounded-full bg-white/70 text-slate-600" style={{ borderColor: primaryColor }}>
                        الأكثر طلباً
                      </Badge>
                    </div>
                  </a>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a href={`${safeStorePath}/products/${product.slug}`} className="block">
                          <CardTitle className="text-lg text-slate-900">
                            {product.name}
                          </CardTitle>
                        </a>
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                          {stripHtml(product.descriptionAr || product.description || 'منتج عالي الجودة، مضمون ومصمم ليناسب احتياجاتك اليومية.')}
                        </CardDescription>
                      </div>
                      <button className="text-slate-300 transition hover:text-rose-500">
                        <Heart size={20} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-500">
                      <Star className="h-4 w-4" />
                      <span>{product.rating?.toFixed?.(1) || '4.8'}</span>
                      <span className="text-slate-400">تقييم</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">السعر</p>
                      <p className="text-xl font-bold" style={{ color: primaryColor }}>
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    {enableCart ? (
                      <Button
                        className="h-11 rounded-xl px-5"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => addToCart(product)}
                      >
                        أضف للسلة
                      </Button>
                    ) : (
                      <Button
                        className="h-11 rounded-xl px-5"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => { setCheckoutItems([{ ...product, quantity: 1 }]); setShowCheckout(true); }}
                      >
                        اطلب الآن
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {spotlightProducts.length === 0 && (
              <motion.div variants={fadeIn} className="col-span-full">
                <Card className="rounded-3xl border-none bg-white/70 py-16 text-center shadow">
                  <CardContent className="space-y-4">
                    <ShoppingBag size={56} className="mx-auto text-slate-200" />
                    <CardTitle className="text-xl text-slate-800">
                      لا توجد منتجات مطابقة لبحثك
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      حاول تغيير الفئة أو استخدام كلمات أخرى في البحث.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>

      <AnimatePresence>
        {showCart && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed inset-y-0 left-0 w-full max-w-md bg-white/95 z-50 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">سلة التسوق</h2>
                  <p className="text-sm text-slate-500">{cartCount} منتجات في انتظار الإتمام</p>
                </div>
                <Button variant="ghost" onClick={() => setShowCart(false)} className="h-10 px-3 text-slate-500">
                  <X size={18} />
                </Button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                    <ShoppingCart size={36} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">سلة التسوق فارغة</h3>
                  <p className="text-sm text-slate-500">ابدأ التسوق الآن وأضف منتجاتك المفضلة بسهولة.</p>
                  <Button className="h-11 rounded-xl px-6" onClick={() => setShowCart(false)}>
                    العودة للمتجر
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {cart.map((item) => (
                      <Card key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                            {item.images?.[0] ? (
                              <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <ShoppingBag size={28} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="truncate text-base font-semibold text-slate-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {formatCurrency(item.price)}
                            </p>
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-xs text-slate-500">
                              الكمية المتوفرة: {item.stock ?? 'غير محدد'}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition hover:bg-primary-100"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-sm text-rose-500 hover:text-rose-600"
                            >
                              إزالة المنتج
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-5 border-t border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-between text-base text-slate-600">
                      <span>عدد المنتجات</span>
                      <span>{cartCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>إجمالي الطلب</span>
                      <span className="text-primary-600">{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button
                      className="h-12 w-full rounded-xl text-base"
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                    >
                      إتمام الطلب بأمان
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setShowCheckout(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border"
                style={{
                  boxShadow: `0 0 28px ${(storeInfo?.theme?.primaryColor || '#3B82F6')}44`,
                  borderColor: storeInfo?.theme?.primaryColor || '#3B82F6',
                }}
              >
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h3 className="text-xl font-bold text-slate-900">إتمام الطلب</h3>
                  <Button variant="ghost" onClick={() => setShowCheckout(false)} className="h-10 px-3 text-slate-500">
                    <X size={18} />
                  </Button>
                </div>

                <div className="px-6 py-5 grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="الاسم الكامل" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    <Input placeholder="رقم الهاتف" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>

                  <LocationSelector
                    selectedWilaya={wilayaId ?? undefined}
                    selectedCommune={communeId ?? undefined}
                    onWilayaChange={(id, name) => {
                      setWilayaId(id || null);
                      setWilaya(name || '');
                    }}
                    onCommuneChange={(id, name) => {
                      setCommuneId(id || null);
                      setCommune(name || '');
                    }}
                    required
                  />

                  <Input placeholder="العنوان الكامل" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <Input placeholder="ملاحظات إضافية (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} />

                  {/* Order summary */}
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                    <div className="font-semibold text-slate-800">ملخص الطلب</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {itemsSrc.map((it) => (
                        <div key={it.id} className="flex items-center justify-between">
                          <span className="truncate max-w-[70%]">{it.name}</span>
                          <span className="text-slate-500">
                            {it.quantity || 1} × {formatCurrency(it.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span>إجمالي المنتجات</span>
                      <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الشحن</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(shippingEstimate)} (تقديري)</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-extrabold">
                      <span>المجموع</span>
                      <span className="text-primary-600">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="text-xs text-slate-500">قد يختلف الشحن النهائي حسب منطقتك. سيتم التأكيد عبر الهاتف.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t px-6 py-4">
                  <Button
                    className="h-11 rounded-xl px-6"
                    onClick={handleSubmitOrder}
                    disabled={
                      checkoutSubmitting ||
                      !customerName ||
                      !customerPhone ||
                      !wilaya ||
                      !commune ||
                      !address ||
                      itemsSrc.length === 0
                    }
                  >
                    {checkoutSubmitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                  </Button>
                  <Button variant="secondary" className="h-11 rounded-xl px-6" onClick={() => setShowCheckout(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Store */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-bold text-gray-800 mb-4">عن المتجر</h3>
              {storeInfo?.logo && (
                <img src={storeInfo.logo} alt={storeInfo?.name || storeId} className="w-20 h-20 mx-auto md:mx-0 object-contain mb-4 rounded-lg" />
              )}
              <p className="text-gray-600 text-sm leading-relaxed">
                {storeDescription || 'متجر إلكتروني متميز'}
              </p>
            </div>

            {/* Contact */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-4">تواصل معنا</h3>
              {supportPhone && (
                <p className="text-gray-700 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {supportPhone}
                </p>
              )}
              {supportEmail && (
                <p className="text-gray-700 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {supportEmail}
                </p>
              )}
              {storeAddress && (
                <p className="text-gray-700 text-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {storeAddress}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-800 mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href={safeStorePath} className="hover:text-blue-600 transition-colors">الرئيسية</a></li>
                <li><a href={`${safeStorePath}/products`} className="hover:text-blue-600 transition-colors">المنتجات</a></li>
                <li><a href={`${safeStorePath}/support`} className="hover:text-blue-600 transition-colors">الدعم</a></li>
                <li><a href={`${safeStorePath}/privacy`} className="hover:text-blue-600 transition-colors">سياسة الخصوصية</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-gray-600 text-sm">
              {/* Copyright based on subscription plan */}
              {storeInfo?.subscription?.plan === 'FREE' ? (
                <>
                  {storeInfo?.nameAr || storeInfo?.name || storeId} {new Date().getFullYear()} - 
                  <span className="text-blue-600 mx-1">مدعوم بواسطة</span>
                  <a href="https://ra7ba.shop" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">
                    منصة رحبة
                  </a>
                </>
              ) : (
                <>{storeInfo?.nameAr || storeInfo?.name || storeId} {new Date().getFullYear()} - جميع الحقوق محفوظة</>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}