'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onImagesChange, maxImages = 10 }: ImageUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (images.length < maxImages) {
          onImagesChange([...images, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* منطقة الرفع */}
      {images.length < maxImages && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-purple-400 mb-2 group-hover:text-purple-600 transition" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-purple-600">اضغط لرفع الصور</span> أو اسحب وأفلت
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP (MAX. 5MB) - {images.length}/{maxImages}
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* معاينة الصور */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move transition-transform hover:scale-105 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <img
                src={image}
                alt={`صورة ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-400 transition"
              />
              
              {/* زر الحذف */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>

              {/* علامة الصورة الرئيسية */}
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                  رئيسية
                </div>
              )}

              {/* رقم الترتيب */}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          💡 اسحب الصور لإعادة ترتيبها - الصورة الأولى ستكون الرئيسية
        </p>
      )}
    </div>
  );
}
