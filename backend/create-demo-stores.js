const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Demo store templates
const demoStores = [
  {
    subdomain: 'electronics-demo',
    name: 'Electronics Store',
    nameAr: 'متجر الإلكترونيات',
    description: 'Your one-stop shop for all electronic devices and accessories',
    logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop&crop=center',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&crop=center',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      backgroundColor: '#F8FAFC',
      textColor: '#1F2937'
    },
    products: [
      {
        name: 'iPhone 15 Pro',
        price: 150000,
        stock: 25,
        description: 'Latest iPhone with advanced features and premium design',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&crop=center',
        category: 'Smartphones'
      },
      {
        name: 'Samsung Galaxy S24',
        price: 120000,
        stock: 30,
        description: 'Powerful Android smartphone with excellent camera',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=500&fit=crop&crop=center',
        category: 'Smartphones'
      },
      {
        name: 'MacBook Air M3',
        price: 180000,
        stock: 15,
        description: 'Ultra-thin laptop with M3 chip for ultimate performance',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&crop=center',
        category: 'Laptops'
      }
    ]
  },
  {
    subdomain: 'fashion-demo',
    name: 'Fashion Boutique',
    nameAr: 'بوتيك الأزياء',
    description: 'Trendy fashion and accessories for modern lifestyle',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop&crop=center',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&crop=center',
    theme: {
      primaryColor: '#EC4899',
      secondaryColor: '#BE185D',
      accentColor: '#F59E0B',
      backgroundColor: '#FDF2F8',
      textColor: '#1F2937'
    },
    products: [
      {
        name: 'Summer Dress',
        price: 8500,
        stock: 50,
        description: 'Elegant summer dress perfect for any occasion',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop&crop=center',
        category: 'Dresses'
      },
      {
        name: 'Designer Handbag',
        price: 12000,
        stock: 20,
        description: 'Luxury handbag with premium leather finish',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop&crop=center',
        category: 'Accessories'
      },
      {
        name: 'Casual Sneakers',
        price: 6500,
        stock: 40,
        description: 'Comfortable sneakers for everyday wear',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop&crop=center',
        category: 'Shoes'
      }
    ]
  },
  {
    subdomain: 'beauty-demo',
    name: 'Beauty Paradise',
    nameAr: 'جنة التجميل',
    description: 'Premium beauty products and cosmetics',
    logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop&crop=center',
    banner: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop&crop=center',
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      backgroundColor: '#FAF5FF',
      textColor: '#1F2937'
    },
    products: [
      {
        name: 'Luxury Face Cream',
        price: 4500,
        stock: 60,
        description: 'Anti-aging face cream with natural ingredients',
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&h=500&fit=crop&crop=center',
        category: 'Skincare'
      },
      {
        name: 'Makeup Palette',
        price: 3200,
        stock: 35,
        description: 'Professional makeup palette with 20 colors',
        image: 'https://images.unsplash.com/photo-1583241800698-9c2e0c1d5b8d?w=500&h=500&fit=crop&crop=center',
        category: 'Makeup'
      },
      {
        name: 'Hair Serum',
        price: 2800,
        stock: 45,
        description: 'Nourishing hair serum for healthy shine',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop&crop=center',
        category: 'Hair Care'
      }
    ]
  }
];

async function createDemoStores() {
  try {
    console.log('🏪 Creating demo stores...');

    for (const storeData of demoStores) {
      console.log(`Creating ${storeData.name}...`);

      // Check if store already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { subdomain: storeData.subdomain }
      });

      if (existingTenant) {
        console.log(`✅ Store ${storeData.name} already exists`);
        continue;
      }

      // Create demo user for this store
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      
      const user = await prisma.user.create({
        data: {
          email: `${storeData.subdomain}@demo.ra7ba.com`,
          password: hashedPassword,
          name: `${storeData.name} Owner`,
          phone: '+213555000000',
          role: 'MERCHANT',
          isActive: true,
        }
      });

      // Create tenant with active status (demo stores are always active)
      const tenant = await prisma.tenant.create({
        data: {
          subdomain: storeData.subdomain,
          name: storeData.name,
          nameAr: storeData.nameAr,
          description: storeData.description,
          logo: storeData.logo,
          banner: storeData.banner,
          theme: storeData.theme,
          ownerId: user.id,
          status: 'ACTIVE', // Demo stores are always active
        }
      });

      // Create active subscription for demo store
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          status: 'ACTIVE',
          plan: 'PRO', // Demo stores get Pro features
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      });

      // Create demo products
      for (const productData of storeData.products) {
        await prisma.product.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            image: productData.image,
            category: productData.category,
            isActive: true,
            tenantId: tenant.id,
          }
        });
      }

      console.log(`✅ Created ${storeData.name} with ${storeData.products.length} products`);
    }

    console.log('🎉 All demo stores created successfully!');
    console.log('\n📋 Demo Store Access:');
    demoStores.forEach(store => {
      console.log(`🏪 ${store.name}: https://${store.subdomain}.ra7ba.com`);
      console.log(`   📧 Email: ${store.subdomain}@demo.ra7ba.com`);
      console.log(`   🔑 Password: demo123456\n`);
    });

  } catch (error) {
    console.error('❌ Error creating demo stores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoStores();
