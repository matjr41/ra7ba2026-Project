const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const SUPER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const SUPER_ADMIN_NAME = 'Rahba Super Admin';

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
      console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD is not set. Skipping super admin seed.');
      return;
    }

    console.log('🔒 Creating Super Admin account...');

    const existing = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existing) {
      console.log('✅ Super Admin already exists');
      
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      
      console.log('✅ Super Admin password updated');
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    
    await prisma.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        name: SUPER_ADMIN_NAME,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true,
        createdIp: 'system',
      },
    });

    console.log('✅ Super Admin created!');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password loaded from environment');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
