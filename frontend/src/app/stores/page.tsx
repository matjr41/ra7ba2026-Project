'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Store, Search, MapPin, Package, Star, TrendingUp,
  Clock, Shield, Award, ChevronRight, Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Input, Card, Badge } from '@/components/ui';

interface StoreData {
  id: string;
  name: string;
  nameAr: string;
  subdomain: string;
  logo: string;
  description: string;
  descriptionAr: string;
  address: string;
  productCount: number;
  rating: number;
  category: string;
  isVerified: boolean;
  isFeatured: boolean;
}

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'جميع المتاجر', icon: Store },
    { value: 'fashion', label: 'أزياء وملابس', icon: Package },
    { value: 'electronics', label: 'إلكترونيات', icon: TrendingUp },
    { value: 'food', label: 'أطعمة ومشروبات', icon: Package },
    { value: 'beauty', label: 'جمال وعناية', icon: Award },
    { value: 'home', label: 'منزل وديكور', icon: Store },
  ];

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [searchQuery, selectedCategory, stores]);

  const loadStores = async () => {
    try {
      setLoading(true);
      // Fetch active stores
      const response = await api.get('/stores/active');
      
      // Mock data for demonstration
      const mockStores: StoreData[] = [
        {
          id: '1',
          name: 'Fashion Hub',
          nameAr: 'مركز الأزياء',
          subdomain: 'fashion-hub',
          logo: 'https://via.placeholder.com/150',
          description: 'Your destination for trendy fashion',
          descriptionAr: 'وجهتك للأزياء العصرية',
          address: 'الجزائر، وهران',
          productCount: 245,
          rating: 4.8,
          category: 'fashion',
          isVerified: true,
          isFeatured: true
        },
        {
          id: '2',
          name: 'Tech Zone',
          nameAr: 'منطقة التقنية',
          subdomain: 'tech-zone',
          logo: 'https://via.placeholder.com/150',
          description: 'Latest electronics and gadgets',
          descriptionAr: 'أحدث الإلكترونيات والأجهزة',
          address: 'الجزائر، العاصمة',
          productCount: 189,
          rating: 4.6,
          category: 'electronics',
          isVerified: true,
          isFeatured: false
        },
        {
          id: '3',
          name: 'Beauty Palace',
          nameAr: 'قصر الجمال',
          subdomain: 'beauty-palace',
          logo: 'https://via.placeholder.com/150',
          description: 'Premium beauty and skincare products',
          descriptionAr: 'منتجات العناية والجمال الفاخرة',
          address: 'الجزائر، قسنطينة',
          productCount: 156,
          rating: 4.9,
          category: 'beauty',
          isVerified: true,
          isFeatured: true
        },
        {
          id: '4',
          name: 'Home Decor Plus',
          nameAr: 'ديكور المنزل بلس',
          subdomain: 'home-decor',
          logo: 'https://via.placeholder.com/150',
          description: 'Transform your home with style',
          descriptionAr: 'حول منزلك بأناقة',
          address: 'الجزائر، عنابة',
          productCount: 312,
          rating: 4.7,
          category: 'home',
          isVerified: false,
          isFeatured: false
        },
        {
          id: '5',
          name: 'Gourmet Foods',
          nameAr: 'الأطعمة الفاخرة',
          subdomain: 'gourmet-foods',
          logo: 'https://via.placeholder.com/150',
          description: 'Delicious food and beverages',
          descriptionAr: 'أطعمة ومشروبات لذيذة',
          address: 'الجزائر، تلمسان',
          productCount: 98,
          rating: 4.5,
          category: 'food',
          isVerified: true,
          isFeatured: false
        }
      ];

      setStores(response.data?.stores || mockStores);
    } catch (error) {
      console.error('Failed to load stores:', error);
      // Use mock data on error
      const mockStores: StoreData[] = [
        {
          id: '1',
          name: 'Fashion Hub',
          nameAr: 'مركز الأزياء',
          subdomain: 'fashion-hub',
          logo: 'https://via.placeholder.com/150',
          description: 'Your destination for trendy fashion',
          descriptionAr: 'وجهتك للأزياء العصرية',
          address: 'الجزائر، وهران',
          productCount: 245,
          rating: 4.8,
          category: 'fashion',
          isVerified: true,
          isFeatured: true
        }
      ];
      setStores(mockStores);
    } finally {
      setLoading(false);
    }
  };

  const filterStores = () => {
    let filtered = [...stores];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.nameAr.includes(searchQuery) ||
        store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.descriptionAr.includes(searchQuery)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(store => store.category === selectedCategory);
    }

    // Sort featured stores first
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.rating - a.rating;
    });

    setFilteredStores(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              اكتشف أفضل المتاجر
            </h1>
            <p className="text-xl mb-8 opacity-90">
              تسوق من مئات المتاجر الموثوقة واحصل على أفضل المنتجات بأسعار منافسة
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <Input
                placeholder="ابحث عن متجر أو منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-14 py-4 text-lg rounded-2xl text-gray-800"
              />
            </div>
          </motion.div>
        </div>

        {/* Wave Shape */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-20">
            <path
              fill="white"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </section>

      {/* Stores Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'all' 
              ? `جميع المتاجر (${filteredStores.length})`
              : `${categories.find(c => c.value === selectedCategory)?.label} (${filteredStores.length})`
            }
          </h2>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 ml-2" />
            تصفية
          </Button>
        </div>

        {filteredStores.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">لا توجد متاجر</h3>
            <p className="text-gray-500">جرب البحث بكلمات أخرى أو تصفح فئة مختلفة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="overflow-hidden h-full hover:shadow-2xl transition-all duration-300">
                  {/* Store Header */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                    {store.isFeatured && (
                      <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
                        مميز
                      </Badge>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {store.logo ? (
                        <Image
                          src={store.logo}
                          alt={store.nameAr}
                          width={100}
                          height={100}
                          className="rounded-full bg-white p-2 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Store className="w-12 h-12 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {store.nameAr}
                        </h3>
                        <p className="text-sm text-gray-500">{store.name}</p>
                      </div>
                      {store.isVerified && (
                        <div className="bg-green-100 p-2 rounded-full">
                          <Shield className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {store.descriptionAr || store.description}
                    </p>

                    {/* Store Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Package className="w-4 h-4" />
                          المنتجات
                        </span>
                        <span className="font-bold">{store.productCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Star className="w-4 h-4" />
                          التقييم
                        </span>
                        <span className="font-bold text-yellow-500">{store.rating}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          الموقع
                        </span>
                        <span className="text-gray-700">{store.address}</span>
                      </div>
                    </div>

                    {/* Visit Button */}
                    <Button
                      onClick={() => router.push(`/store/${store.subdomain}`)}
                      className="w-full group"
                    >
                      زيارة المتجر
                      <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">لماذا تختار منصتنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'متاجر موثوقة',
                description: 'جميع المتاجر مراجعة ومعتمدة لضمان أفضل تجربة تسوق'
              },
              {
                icon: Clock,
                title: 'دعم على مدار الساعة',
                description: 'فريق دعم متخصص لمساعدتك في أي وقت'
              },
              {
                icon: Award,
                title: 'أفضل الأسعار',
                description: 'عروض وخصومات حصرية على جميع المنتجات'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
