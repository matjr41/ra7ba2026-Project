'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Heart, Star, Filter, Grid3X3, List,
  Sun, Moon, Menu, X, Package, ArrowRight, Eye, Zap
} from 'lucide-react';
import { storefrontApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button, Input, Badge } from '@/components/ui';

const neonGlow = {
  boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
};

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    loadStoreData();
    loadCartFromStorage();
  }, [subdomain]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [storeRes, productsRes, categoriesRes] = await Promise.all([
        storefrontApi.getStore(subdomain),
        storefrontApi.getProducts(subdomain),
        storefrontApi.getCategories(subdomain),
      ]);
      
      setStore(storeRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load store data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch (error) {
      console.error('Failed to load cart', error);
    }
  };

  const addToCart = (product: any) => {
    try {
      const existingIndex = cartItems.findIndex(item => item.id === product.id);
      let newCart;
      
      if (existingIndex >= 0) {
        newCart = [...cartItems];
        newCart[existingIndex].quantity += 1;
      } else {
        newCart = [...cartItems, { ...product, quantity: 1 }];
      }
      
      setCartItems(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Failed to add to cart', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.nameAr?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
        darkMode 
          ? 'bg-gray-900/90 border-gray-800' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              {store?.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{store?.name || subdomain}</h1>
                <p className="text-sm opacity-70">{store?.description}</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                <Input
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full p-2"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                className="relative rounded-full p-2"
                onClick={() => router.push(`/store/${subdomain}/cart`)}
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                  <Input
                    placeholder="ابحث عن المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center gap-2"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="relative flex items-center gap-2"
                    onClick={() => router.push(`/store/${subdomain}/cart`)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    السلة ({cartItemsCount})
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      {store?.coverImage && (
        <section className="relative h-96 overflow-hidden">
          <Image
            src={store.coverImage}
            alt={store.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white max-w-2xl"
              >
                <h2 className="text-4xl lg:text-6xl font-bold mb-4">
                  {store.name}
                </h2>
                <p className="text-xl mb-6 opacity-90">
                  {store.description || 'اكتشف مجموعتنا المميزة من المنتجات'}
                </p>
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  تسوق الآن
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Filters & Controls */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
              className="rounded-full"
            >
              الكل
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.nameAr || category.name}
              </Button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div id="products">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-24 h-24 mx-auto opacity-30 mb-4" />
              <h3 className="text-2xl font-bold mb-2">لا توجد منتجات</h3>
              <p className="opacity-70">جرب البحث بكلمات أخرى أو تصفح فئة مختلفة</p>
            </div>
          ) : (
            <motion.div
              layout
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-800 hover:bg-gray-750'
                      : 'bg-white hover:shadow-xl hover:shadow-purple-500/25'
                  } ${viewMode === 'list' ? 'flex gap-4' : ''}`}
                  onClick={() => router.push(`/store/${subdomain}/products/${product.slug}`)}
                >
                  {/* Product Image */}
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'
                  }`}>
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.nameAr || product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Package className="w-16 h-16 opacity-30" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.comparePrice && (
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                        خصم {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
                      </Badge>
                    )}

                    {/* Quick Actions */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full p-2 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to wishlist logic
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Quick View */}
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="w-full backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/store/${subdomain}/products/${product.slug}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        عرض سريع
                      </Button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.nameAr || product.name}
                      </h3>
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {product.stock} متبقي
                        </Badge>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm opacity-70 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                      <span className="text-sm opacity-70 mr-2">(4.8)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(product.price)}
                        </div>
                        {product.comparePrice && (
                          <div className="text-sm opacity-50 line-through">
                            {formatCurrency(product.comparePrice)}
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.stock === 0}
                        className="rounded-full"
                      >
                        {product.stock === 0 ? (
                          'غير متوفر'
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            أضف
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'توصيل سريع', desc: 'خلال 24-48 ساعة' },
              { icon: Package, title: 'منتجات أصلية', desc: 'ضمان الجودة' },
              { icon: Heart, title: 'خدمة ممتازة', desc: 'دعم على مدار الساعة' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="opacity-70">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}