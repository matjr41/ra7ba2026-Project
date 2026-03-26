'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Star, Search, Menu, X, Heart, Sparkles, 
  TrendingUp, Package, Shield, Zap, ArrowRight, Filter
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button, Input, Badge } from '@/components/ui';
import { getStoreBasePath, getStoreIdentifier } from '@/lib/store-utils';

// Neon glow effect
const neonGlow = {
  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
};

// Strip HTML helper
const stripHtml = (html: string) => {
  if (typeof window !== 'undefined') {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
};

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = getStoreIdentifier(params);
  const storeBasePath = getStoreBasePath(params, storeId);
  const safeStorePath = storeBasePath || '#';

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdAt');

  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.95)']);
  const enableCart = !!(store?.storeFeatures?.enableCart ?? true);

  // Get theme colors and fonts
  const primaryColor = store?.theme?.primaryColor || '#8B5CF6';
  const secondaryColor = store?.theme?.secondaryColor || '#EC4899';
  const accentColor = store?.theme?.accentColor || '#3B82F6';
  const fontFamily = store?.theme?.fontFamily || 'Cairo';

  // Convert hex to RGB for gradients
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 139, g: 92, b: 246 };
  };

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  useEffect(() => {
    if (!storeId) return;
    loadStore();
    loadProducts();
    loadCategories();
    loadCart();
  }, [storeId, sortBy, selectedCategory]);

  const loadStore = async () => {
    try {
      if (!storeId) return;
      const res = await storefrontApi.getStore(storeId);
      setStore(res.data);
    } catch (error) {
      console.error('Failed to load store', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = { sortBy };
      if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;
      if (!storeId) return;
      const res = await storefrontApi.getProducts(storeId, params);
      setProducts(res.data?.data || []);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      if (!storeId) return;
      const res = await storefrontApi.getCategories(storeId);
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadCart = () => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  };

  const addToCart = (product: any) => {
    const newCart = [...cart];
    const existing = newCart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      newCart.push({ ...product, quantity: 1 });
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p?.category?.id === selectedCategory;
    const matchSearch = !searchTerm || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameAr?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const randomProducts = useMemo(() => {
    if (!products || products.length === 0) return [] as any[];
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }, [products]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      className="min-h-screen text-white" 
      dir="rtl"
      style={{
        fontFamily: fontFamily,
        background: `linear-gradient(to bottom right, #000000, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2), #000000)`
      }}
    >
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br via-black"
          style={{ 
            backgroundImage: `linear-gradient(to bottom right, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2), rgba(0, 0, 0, 1), rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2))`
          }}
        />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: primaryColor,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ backgroundColor: headerBg, borderColor: `${primaryColor}30` }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {store?.logo ? (
                <Image src={store.logo} alt={store?.nameAr || store?.name || storeId} width={48} height={48} className="w-12 h-12 object-contain rounded-lg" />
              ) : (
                <div className="relative">
                  <Sparkles className="w-8 h-8" style={{ color: primaryColor, boxShadow: `0 0 20px ${primaryColor}80` }} />
                </div>
              )}
              <h1 
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {store?.nameAr || store?.name || storeId}
              </h1>
            </motion.div>

            {/* Search - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: accentColor }} />
                <Input
                  type="text"
                  placeholder="ابحث عن منتجك المفضل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 text-white pl-12 pr-4 py-3 rounded-xl backdrop-blur-sm focus:ring-2"
                  style={{ borderColor: `${primaryColor}50`, outlineColor: primaryColor }}
                />
              </div>
            </div>

            {/* Cart & Menu */}
            <div className="flex items-center gap-4">
              {enableCart && (
                <Button
                  onClick={() => setShowCart(true)}
                  className="relative rounded-xl"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 0 20px ${primaryColor}80`
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {totalCartItems}
                    </span>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden bg-white/5 hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: accentColor }} />
              <Input
                type="text"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 text-white pl-12 pr-4 py-3 rounded-xl"
                style={{ borderColor: `${primaryColor}50` }}
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-gray-900 to-black border-l z-50 overflow-y-auto"
              style={{ borderColor: primaryColor }}
            >
              <div className="p-6">
                {/* Close Button */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold" style={{ color: primaryColor }}>القائمة</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">التصنيفات</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right px-4 py-3 rounded-xl transition ${
                        selectedCategory === 'all'
                          ? 'text-white font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={selectedCategory === 'all' ? { backgroundColor: `${primaryColor}40` } : {}}
                    >
                      جميع المنتجات
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-right px-4 py-3 rounded-xl transition ${
                          selectedCategory === cat.id
                            ? 'text-white font-semibold'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                        style={selectedCategory === cat.id ? { backgroundColor: `${primaryColor}40` } : {}}
                      >
                        {cat.nameAr || cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Store Info */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">معلومات المتجر</h3>
                  <div className="space-y-3 text-sm">
                    {store?.phone && (
                      <p className="text-gray-300">📞 {store.phone}</p>
                    )}
                    {store?.email && (
                      <p className="text-gray-300">📧 {store.email}</p>
                    )}
                    {store?.address && (
                      <p className="text-gray-300">📍 {store.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Banner */}
      {store?.banner && (
        <div className="w-full h-40 sm:h-56 md:h-64 lg:h-72 relative">
          <Image src={store.banner} alt="Store banner" fill className="object-cover" />
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Random Picks under banner */}
          {randomProducts.length > 0 && (
            <section className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {randomProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
                    onClick={() => safeStorePath !== '#' && router.push(`${safeStorePath}/products/${p.slug}`)}
                  >
                    <div className="relative h-40 overflow-hidden bg-black/50">
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt={p.nameAr || p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12" style={{ color: `${accentColor}50` }} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold line-clamp-1">{p.nameAr || p.name}</h3>
                        <span 
                          className="bg-clip-text text-transparent font-bold"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {formatCurrency(p.price)}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-3 rounded-xl"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                        }}
                      >
                        أشتري الآن
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20 text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            >
              <h2 
                className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent leading-tight"
                style={{
                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                اكتشف عالم التسوق الرقمي
              </h2>
            </motion.div>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              منتجات أصلية، أسعار تنافسية، وتوصيل سريع لباب منزلك
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Package, label: 'منتج متنوع', value: products.length },
                { icon: Star, label: 'تقييم عالي', value: '4.9' },
                { icon: Shield, label: 'دفع آمن', value: '100%' },
                { icon: Zap, label: 'توصيل سريع', value: '24h' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="backdrop-blur-sm rounded-2xl p-6 border"
                  style={{
                    background: `linear-gradient(to bottom right, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3), rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.3))`,
                    borderColor: `${primaryColor}30`,
                    boxShadow: `0 0 20px ${primaryColor}50`
                  }}
                  whileHover={{ scale: 1.05, ...neonGlow }}
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Categories */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <Button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-6 py-3 whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                style={selectedCategory === 'all' ? {
                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 0 20px ${primaryColor}80`
                } : {}}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                كل المنتجات
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-6 py-3 whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  style={selectedCategory === cat.id ? {
                    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 0 20px ${primaryColor}80`
                  } : {}}
                >
                  {(cat.nameAr || cat.name)}
                  {typeof cat?._count?.products === 'number' && (
                    <span className="ml-2 text-xs opacity-80">({cat._count.products})</span>
                  )}
                </Button>
              ))}
            </div>

            {/* Sorting */}
            <div className="mt-4 flex items-center justify-end">
              <label className="mr-2 text-sm text-gray-400">ترتيب:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/5 text-white border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: `${primaryColor}50` }}
              >
                <option value="createdAt">الأحدث</option>
                <option value="price-asc">السعر: من الأرخص للأغلى</option>
                <option value="price-desc">السعر: من الأغلى للأرخص</option>
                <option value="name">الاسم</option>
              </select>
            </div>
          </motion.section>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-t-transparent rounded-full"
                style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
              />
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -10 }}
                    className="group relative backdrop-blur-sm rounded-2xl overflow-hidden border transition-all cursor-pointer"
                    style={{
                      background: `linear-gradient(to bottom right, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2), rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2))`,
                      borderColor: `${primaryColor}30`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}80`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = `${primaryColor}30`}
                    onClick={() => safeStorePath !== '#' && router.push(`${safeStorePath}/products/${product.slug}`)}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-black/50">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.nameAr || product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16" style={{ color: `${accentColor}50` }} />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Discount Badge */}
                      {product.comparePrice && (
                        <Badge className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                          {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}% خصم
                        </Badge>
                      )}

                      {/* Quick Actions */}
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-white/90 hover:bg-white text-black rounded-full p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to wishlist
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 
                        className="text-lg font-bold mb-2 line-clamp-2 transition-colors"
                        style={{ color: 'white' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                      >
                        {product.nameAr || product.name}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {stripHtml(product.descriptionAr || product.description || '')}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-400 mr-2">(4.8)</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div 
                            className="text-2xl font-bold bg-clip-text text-transparent"
                            style={{
                              backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            {formatCurrency(product.price)}
                          </div>
                          {product.comparePrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.comparePrice)}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (enableCart) {
                              addToCart(product);
                            } else {
                              safeStorePath !== '#' && router.push(`${safeStorePath}/products/${product.slug}`);
                            }
                          }}
                          className="rounded-xl"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                          }}
                        >
                          {enableCart ? (
                            <ShoppingCart className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-bold">اشتري الآن</span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Neon border effect on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={neonGlow} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Package className="w-24 h-24 mx-auto mb-4" style={{ color: `${accentColor}50` }} />
              <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات</h3>
              <p className="text-gray-400">جرب البحث بكلمة أخرى أو اختر تصنيف آخر</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md backdrop-blur-xl z-50 overflow-y-auto border-l"
              style={{
                background: `linear-gradient(to bottom right, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.95), rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.95))`,
                borderColor: `${primaryColor}50`
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">سلة المشتريات</h3>
                  <Button
                    onClick={() => setShowCart(false)}
                    className="bg-white/10 hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="w-24 h-24 mx-auto mb-4" style={{ color: `${accentColor}50` }} />
                    <p className="text-gray-400">سلتك فارغة</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-white/5 rounded-xl p-4 border" style={{ borderColor: `${primaryColor}30` }}>
                          <div className="flex gap-4">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/50">
                              {item.images?.[0] ? (
                                <Image
                                  src={item.images[0]}
                                  alt={item.nameAr || item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="w-full h-full p-4" style={{ color: `${accentColor}50` }} />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white mb-1">{item.nameAr || item.name}</h4>
                              <div className="font-bold" style={{ color: primaryColor }}>{formatCurrency(item.price)}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-400">الكمية: {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mb-6" style={{ borderColor: `${primaryColor}30` }}>
                      <div className="flex items-center justify-between text-xl font-bold text-white">
                        <span>المجموع:</span>
                        <span 
                          className="bg-clip-text text-transparent"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {formatCurrency(cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0))}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => safeStorePath !== '#' && router.push(`${safeStorePath}/checkout`)}
                      className="w-full text-white font-bold py-4 rounded-xl"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 0 20px ${primaryColor}80`
                      }}
                    >
                      إتمام الطلب
                      <ArrowRight className="w-5 h-5 mr-2" />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-black/50 backdrop-blur-sm mt-20" style={{ borderColor: `${primaryColor}30` }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Store */}
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>عن المتجر</h3>
              {store?.logo && (
                <Image src={store.logo} alt={store?.nameAr || store?.name || storeId} width={80} height={80} className="w-20 h-20 mx-auto md:mx-0 object-contain mb-4 rounded-lg" />
              )}
              <p className="text-gray-400 text-sm leading-relaxed">
                {stripHtml(store?.descriptionAr || store?.description || 'متجر إلكتروني متميز')}
              </p>
            </div>

            {/* Contact */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>تواصل معنا</h3>
              {store?.phone && (
                <p className="text-gray-300 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {store.phone}
                </p>
              )}
              {store?.email && (
                <p className="text-gray-300 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {store.email}
                </p>
              )}
              {store?.address && (
                <p className="text-gray-300 text-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {store.address}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href={safeStorePath} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>الرئيسية</a></li>
                <li><a href={`${safeStorePath}/products`} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>المنتجات</a></li>
                <li><a href={`${safeStorePath}/support`} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>الدعم</a></li>
                <li><a href={`${safeStorePath}/privacy`} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>سياسة الخصوصية</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center" style={{ borderColor: `${primaryColor}30` }}>
            <p className="text-gray-400 text-sm">
              {/* Copyright based on subscription plan */}
              {store?.subscription?.plan === 'FREE' ? (
                <>
                  {store?.nameAr || store?.name || storeId} © {new Date().getFullYear()} - 
                  <span className="mx-1" style={{ color: primaryColor }}>مدعوم بواسطة</span>
                  <a href="https://ra7ba.shop" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: primaryColor }} onMouseEnter={(e) => e.currentTarget.style.color = secondaryColor} onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}>
                    منصة رحبة
                  </a>
                </>
              ) : (
                <>{store?.nameAr || store?.name || storeId} © {new Date().getFullYear()} - جميع الحقوق محفوظة</>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
