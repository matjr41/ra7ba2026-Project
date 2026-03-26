'use client';

import { formatCurrency } from '@/lib/utils';
import { Package, Star, ShoppingCart, Heart, Share2 } from 'lucide-react';

interface ProductPreviewProps {
  product: {
    name: string;
    description: string;
    price: string;
    comparePrice?: string;
    images: string[];
    category?: string;
    tags?: string;
    badges?: string[];
    isOffer?: boolean;
    offerPrice?: string;
  };
}

export default function ProductPreview({ product }: ProductPreviewProps) {
  const displayPrice = product.isOffer && product.offerPrice 
    ? parseFloat(product.offerPrice) 
    : parseFloat(product.price || '0');
  
  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > displayPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - displayPrice) / parseFloat(product.comparePrice!)) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* معاينة الصورة */}
      <div className="relative aspect-square bg-gray-100">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-20 h-20" />
          </div>
        )}
        
        {/* الشارات */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {product.badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-lg"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* نسبة الخصم */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            -{discountPercent}%
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button className="flex-1 bg-white/90 backdrop-blur-sm text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-white transition flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            أضف للسلة
          </button>
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg hover:bg-white transition">
            <Heart className="w-5 h-5" />
          </button>
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg hover:bg-white transition">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* تفاصيل المنتج */}
      <div className="p-4">
        {/* التصنيف */}
        {product.category && (
          <p className="text-xs text-purple-600 font-semibold mb-2">
            {product.category}
          </p>
        )}

        {/* الاسم */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2">
          {product.name || 'اسم المنتج'}
        </h3>

        {/* التقييم */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-4 h-4 fill-yellow-400 text-yellow-400"
            />
          ))}
          <span className="text-xs text-gray-600 mr-2">(4.8)</span>
        </div>

        {/* الوصف */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* السعر */}
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(displayPrice)}
          </div>
          {hasDiscount && (
            <div className="text-sm text-gray-400 line-through">
              {formatCurrency(parseFloat(product.comparePrice!))}
            </div>
          )}
        </div>

        {/* الوسوم */}
        {product.tags && (
          <div className="flex flex-wrap gap-2 mt-3">
            {product.tags.split(',').slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
