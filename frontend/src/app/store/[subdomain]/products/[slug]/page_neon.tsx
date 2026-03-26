'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, 
  Package, Truck, RefreshCw, Shield, X, ArrowRight, Loader2
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button, Input, Badge } from '@/components/ui';
import { useCart } from '@/hooks/use-cart';

const ProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const { subdomain, slug } = params;
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await storefrontApi.getProduct(subdomain as string, slug as string);
        setProduct(res.data);
        setSelectedVariant(res.data.variants?.[0] || null);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (subdomain && slug) {
      loadProduct();
    }
  }, [subdomain, slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addItem({
        id: selectedVariant?.id || product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: selectedVariant?.price || product.price,
        image: product.images?.[0] || '',
        quantity,
        productId: product.id,
        variantId: selectedVariant?.id
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push(`/store/${subdomain}/checkout`);
  };

  const handleImageHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomImage) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">المنتج غير موجود</h1>
        <p className="text-muted-foreground mb-6">عذراً، لا يمكن العثور على المنتج المطلوب</p>
        <Button onClick={() => router.push(`/store/${subdomain}`)}>
          العودة للمتجر
        </Button>
      </div>
    );
  }

  const mainImage = product.images?.[selectedImage] || '';

  return (
    <div className="bg-background">
      {/* Product Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                className={`relative aspect-square rounded-xl bg-muted overflow-hidden ${
                  zoomImage ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setZoomImage(!zoomImage)}
                onMouseMove={handleImageHover}
                onMouseLeave={() => setZoomPosition({ x: 0, y: 0 })}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {mainImage ? (
                  <>
                    <Image
                      src={mainImage}
                      alt={product.nameAr || product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    {zoomImage && (
                      <motion.div
                        className="absolute inset-0 bg-cover bg-no-repeat"
                        style={{
                          backgroundImage: `url(${mainImage})`,
                          backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          backgroundSize: '200%',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                        }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </motion.div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image: string, index: number) => (
                    <motion.button
                      key={index}
                      className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Title & Price */}
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {product.nameAr || product.name}
                </h1>
                {product.category && (
                  <p className="text-muted-foreground mb-4">
                    {product.category.nameAr || product.category.name}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(selectedVariant?.price || product.price)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                  {product.comparePrice && (
                    <Badge variant="outline" className="text-sm">
                      وفر {Math.round((1 - product.price / product.comparePrice) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'fill-current' : 'fill-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  (24 تقييم)
                </span>
              </div>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">الألوان المتاحة:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant: any) => (
                      <Button
                        key={variant.id}
                        variant={
                          selectedVariant?.id === variant.id
                            ? 'default'
                            : 'outline'
                        }
                        className="rounded-full"
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {variant.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <span className="sr-only">نقص الكمية</span>
                    <span className="text-xl">-</span>
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <span className="sr-only">زيادة الكمية</span>
                    <span className="text-xl">+</span>
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock} متوفر في المخزن
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 ml-2" />
                      أضف إلى السلة
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={addingToCart}
                >
                  <span>اشتري الآن</span>
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <span>شحن سريع</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <span>توصيل لجميع المناطق</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <span>إرجاع سهل خلال 14 يوم</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span>ضمان أصلي</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {/* Description */}
              <div>
                <h3 className="text-xl font-bold mb-4">الوصف</h3>
                <div
                  className="prose prose-sm sm:prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: product.description || 'لا يوجد وصف متوفر'
                  }}
                />
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xl font-bold mb-4">المواصفات</h3>
                {product.specifications?.length > 0 ? (
                  <div className="space-y-2">
                    {product.specifications.map((spec: any, i: number) => (
                      <div key={i} className="flex border-b pb-2">
                        <span className="font-medium w-1/3 text-muted-foreground">
                          {spec.key}:
                        </span>
                        <span className="flex-1">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    لا توجد مواصفات متاحة
                  </p>
                )}
              </div>

              {/* Reviews */}
              <div>
                <h3 className="text-xl font-bold mb-4">التقييمات (24)</h3>
                <div className="space-y-6">
                  <div className="bg-background p-6 rounded-lg border">
                    <h4 className="text-lg font-medium mb-4">تقييم العملاء</h4>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="text-center">
                        <div className="text-5xl font-bold mb-2">4.8</div>
                        <div className="flex justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < 5 ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          بناءً على 24 تقييم
                        </p>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="w-8 text-sm">{stars}</span>
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400"
                                style={{ width: `${(stars / 5) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-sm text-muted-foreground">
                              {Math.floor(24 * (stars / 5))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.relatedProducts?.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {product.relatedProducts.map((related: any) => (
                <div
                  key={related.id}
                  className="group relative bg-background rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/store/${subdomain}/products/${related.slug}`)}
                >
                  <div className="relative aspect-square bg-muted">
                    {related.images?.[0] && (
                      <Image
                        src={related.images[0]}
                        alt={related.nameAr || related.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-1">
                      {related.nameAr || related.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary">
                        {formatCurrency(related.price)}
                      </span>
                      {related.comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(related.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;