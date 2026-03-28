'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Star, Heart, Share2, ChevronLeft, ChevronRight, Check, X, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';
import { useMemo } from 'react';
import LocationSelector from '@/components/LocationSelector';


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any | null>(null);
  const [store, setStore] = useState<any | null>(null);
  const [enableCart, setEnableCart] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Checkout overlay (Buy Now)
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [communeId, setCommuneId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log(`🔄 Loading product: ${subdomain}/${slug}`);
        
        const [pRes, sRes] = await Promise.all([
          storefrontApi.getProduct(subdomain, slug),
          storefrontApi.getStore(subdomain),
        ]);
        
        console.log('📦 Product response:', pRes);
        console.log('🏪 Store response:', sRes);
        
        if (pRes?.data) {
          setProduct(pRes.data);
        } else {
          console.error('❌ No product data in response');
          setProduct(null);
        }
        
        if (sRes?.data) {
          setStore(sRes.data);
          const features = sRes.data?.storeFeatures || {};
          setEnableCart(typeof features.enableCart === 'boolean' ? features.enableCart : true);
        }
      } catch (e) {
        console.error('❌ Failed to load product:', e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (subdomain && slug) {
      load();
    }
  }, [subdomain, slug]);

  const addToCart = (prod: any) => {
    try {
      const saved = localStorage.getItem('cart');
      let cart = saved ? JSON.parse(saved) : [];
      const keyMatch = (a: any, b: any) => JSON.stringify(a || {}) === JSON.stringify(b || {});
      const idx = cart.findIndex((it: any) => it.id === prod.id && keyMatch(it.selectedOptions, selectedOptions));
      const newItem = {
        id: prod.id,
        name: prod.name,
        nameAr: prod.nameAr,
        price: Number(effectivePrice),
        images: images || [],
        selectedOptions,
        quantity,
      };
      if (idx >= 0) cart[idx].quantity += quantity; else cart.push(newItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      router.push(`/store/${subdomain}`);
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const handleSubmitOrder = async () => {
    if (!product) return;
    try {
      setCheckoutSubmitting(true);
      const payload = {
        customerName,
        customerPhone,
        wilaya,
        commune,
        address,
        items: [{ productId: product.id, quantity, selectedOptions }],
        notes,
      };
      await storefrontApi.createOrder(subdomain, payload);
      setShowCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      setWilaya('');
      setCommune('');
      setWilayaId(null);
      setCommuneId(null);
      setAddress('');
      setNotes('');
      router.push(`/store/${subdomain}`);
    } catch (e) {
      console.error('Failed to create order', e);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const images = useMemo(() => {
    if (!product) return [] as string[];
    return Array.isArray(product.images) ? product.images : (product.thumbnail ? [product.thumbnail] : []);
  }, [product]);
  const safeDescription = useMemo(() => {
    const html = product?.descriptionAr || product?.description || '';
    try {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    } catch {
      return html;
    }
  }, [product]);
  const variants = product?.variants || [];
  const options = product?.options || [];
  const selectedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    const keys = Object.keys(selectedOptions || {});
    return (
      variants.find((v: any) => {
        const vopts = typeof v.options === 'string' ? JSON.parse(v.options) : v.options || {};
        return keys.every((k) => vopts?.[k] === selectedOptions[k]);
      }) || null
    );
  }, [variants, selectedOptions]);
  const effectivePrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const effectiveStock = (typeof selectedVariant?.stock === 'number' ? selectedVariant.stock : product?.stock) ?? 0;
  const compareAt = Number(product?.comparePrice ?? 0);
  const hasDiscount = Number.isFinite(compareAt) && compareAt > 0 && compareAt > effectivePrice;
  const discountPercent = hasDiscount ? Math.round((1 - (effectivePrice / compareAt)) * 100) : 0;
  const allSelected = useMemo(() => {
    if (!options || options.length === 0) return true;
    if (!variants || variants.length === 0) return true;
    return options.every((opt: any) => !!selectedOptions[opt.name]);
  }, [options, variants, selectedOptions]);
  const mainImage = images[selectedImage] || '';
  const subtotal = Number(effectivePrice) * (quantity || 1);
  const shippingEstimate = Number(store?.checkoutConfig?.shippingFee ?? 600);
  const grandTotal = Number(subtotal) + Number(shippingEstimate);

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

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="text-red-500" size={48} />
          </div>
          <p className="mt-3 text-slate-600 text-lg font-semibold">عذراً، المنتج غير متاح حالياً</p>
          <p className="text-slate-500 text-sm mt-2">قد يكون المنتج قد تم حذفه أو غير متوفر</p>
          <Button onClick={() => router.push(`/store/${subdomain}`)} className="mt-6">
            العودة للمتجر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-sky-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{store?.name || subdomain}</h1>
          <Button variant="secondary" onClick={() => router.push(`/store/${subdomain}`)}>
            العودة للمتجر
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-slate-100">
              {mainImage ? (
                <Image src={mainImage} alt={product.name} fill className="object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ShoppingBag size={48} />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square overflow-hidden rounded-xl border ${selectedImage === i ? 'border-primary-500' : 'border-slate-200'}`}
                  >
                    <Image src={img} alt={`${product.name}-${i}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card className="rounded-2xl border border-slate-100 bg-white/80 shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">{product.name}</CardTitle>
              <CardDescription className="text-slate-600">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: safeDescription || 'منتج مميز من تشكيلتنا' 
                  }}
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Star className="h-4 w-4" />
                <span>{product.rating?.toFixed?.(1) || '4.8'}</span>
                <span className="text-slate-400">تقييم</span>
              </div>

              <div>
                <p className="text-sm text-slate-500">السعر</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-extrabold text-primary-600">{formatCurrency(effectivePrice)}</p>
                  {hasDiscount && (
                    <>
                      <span className="text-slate-400 line-through">{formatCurrency(compareAt)}</span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600 text-sm font-bold">خصم {discountPercent}%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm text-slate-600">
                {effectiveStock > 0 ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">متوفر بالمخزون</span>
                ) : (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">غير متوفر</span>
                )}
              </div>

              {options && options.length > 0 && (
                <div className="space-y-4">
                  {options.map((opt: any) => (
                    <div key={opt.id} className="space-y-2">
                      <div className="text-sm text-slate-700">{opt.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {opt.values?.map((val: any) => {
                          const active = selectedOptions[opt.name] === val.value;
                          return (
                            <button
                              key={val.id}
                              onClick={() => {
                                setSelectedOptions((prev) => {
                                  const next = { ...prev } as Record<string, string>;
                                  if (next[opt.name] === val.value) {
                                    delete next[opt.name];
                                  } else {
                                    next[opt.name] = val.value;
                                  }
                                  return next;
                                });
                              }}
                              className={`px-3 py-2 rounded-xl border text-sm ${active ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                            >
                              {val.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(selectedOptions).length > 0 && (
                <div className="text-sm text-slate-600">المحدد: {Object.values(selectedOptions).join(' / ')}</div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  className="h-10 w-10 rounded-xl border border-slate-200 grid place-items-center"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-12 text-center font-bold">{quantity}</div>
                <button
                  className="h-10 w-10 rounded-xl border border-slate-200 grid place-items-center"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {enableCart ? (
                  <Button className="h-11 rounded-xl px-6" onClick={() => addToCart(product)} disabled={(variants.length > 0 && !allSelected) || (product?.trackInventory && effectiveStock <= 0)}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> أضف للسلة
                  </Button>
                ) : (
                  <Button className="h-11 rounded-xl px-6" onClick={() => setShowCheckout(true)} disabled={(variants.length > 0 && !allSelected) || (product?.trackInventory && effectiveStock <= 0)}>
                    <ArrowRight className="mr-2 h-4 w-4" /> اطلب الآن
                  </Button>
                )}
                <Badge className="rounded-full bg-white text-primary-600 border border-primary-200">
                  {product.category?.nameAr || product.category?.name || 'منتج' }
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {product?.relatedProducts?.length > 0 && (
          <section className="mt-10">
            <h3 className="mb-4 text-xl font-bold text-slate-900">منتجات ذات صلة</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {product.relatedProducts.map((rp: any) => (
                <a
                  key={rp.id}
                  href={`/store/${subdomain}/products/${rp.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow hover:-translate-y-1 transition"
                >
                  <div className="relative h-36 bg-slate-100">
                    {rp.images?.[0] ? (
                      <Image src={rp.images[0]} alt={rp.nameAr || rp.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="line-clamp-1 text-sm font-semibold text-slate-900">{rp.nameAr || rp.name}</div>
                      <div className="text-primary-600 text-sm font-bold">{formatCurrency(rp.price)}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCheckout(false)} />
          <div
            className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border"
            style={{
              boxShadow: `0 0 28px ${(store?.theme?.primaryColor || '#3B82F6')}44`,
              borderColor: store?.theme?.primaryColor || '#3B82F6',
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[70%]">{product.name}</span>
                    <span className="text-slate-500">{quantity} × {formatCurrency(effectivePrice)}</span>
                  </div>
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
                  !address
                }
              >
                {checkoutSubmitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
              </Button>
              <Button variant="secondary" className="h-11 rounded-xl px-6" onClick={() => setShowCheckout(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
