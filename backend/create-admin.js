const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  // Skip if DATABASE_URL is not set yet (during build phase)
  if (!process.env.DATABASE_URL) {
    console.log('⏭️ Skipping admin creation - DATABASE_URL not available yet');
    return;
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔧 Creating/updating admin user...');

    const adminEmail = process.env.ADMIN_EMAIL || 'ra7baa1@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'abdo@154122';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      // Update to use env credentials and ensure active
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { 
          email: adminEmail,
          password: hashedPassword, 
          isActive: true 
        }
      });
      console.log('🔁 Admin credentials updated from environment variables.');
      console.log('📧 Email:', adminEmail);
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Ra7ba Admin',
        phone: '+213555000000',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password from ADMIN_PASSWORD env');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
