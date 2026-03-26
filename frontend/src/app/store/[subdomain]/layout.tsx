'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { storefrontApi } from '@/lib/api';
import { getStoreIdentifier } from '@/lib/store-utils';
import Head from 'next/head';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const storeId = getStoreIdentifier(params);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoreMetadata = async () => {
      try {
        if (!storeId) return;
        const response = await storefrontApi.getStore(storeId);
        if (response.data) {
          const newFavicon = response.data.favicon;
          const newStoreName = response.data.nameAr || response.data.name || storeId;
          
          // Helper to strip HTML tags
          const stripHtml = (html: string) => {
            if (typeof window !== 'undefined') {
              const tmp = document.createElement('DIV');
              tmp.innerHTML = html;
              return tmp.textContent || tmp.innerText || '';
            }
            return html.replace(/<[^>]*>/g, '');
          };
          
          // Get clean description for meta/title
          const description = response.data.descriptionAr || response.data.description || '';
          const cleanDescription = stripHtml(description).trim();
          
          // Update state
          setFavicon(newFavicon);
          setStoreName(newStoreName);
          
          // Update favicon immediately without flash
          if (newFavicon) {
            // Remove all existing favicons
            const existingLinks = document.querySelectorAll("link[rel*='icon']");
            existingLinks.forEach(link => link.remove());
            
            // Add new favicon
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = newFavicon;
            document.head.appendChild(link);
          }
          
          // Update title with store name (no platform branding)
          document.title = newStoreName;
          
          // Update meta description
          if (cleanDescription) {
            let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.name = 'description';
              document.head.appendChild(metaDesc);
            }
            metaDesc.content = cleanDescription.substring(0, 160); // Limit to 160 chars for SEO
          }
        }
      } catch (error) {
        console.error('Failed to load store metadata', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      loadStoreMetadata();
    }
  }, [storeId]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 text-gray-900">
        {children}
      </body>
    </html>
  );
}
