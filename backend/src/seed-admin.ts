import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const SUPER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const SUPER_ADMIN_NAME = 'Rahba Super Admin';

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
      console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment. Aborting super admin seed.');
      return;
    }

    console.log('🔒 Creating Super Admin account...');

    // Check if super admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existing) {
      console.log('✅ Super Admin already exists');
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: {
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      });
      
      console.log('✅ Super Admin password updated');
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    
    await prisma.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        name: SUPER_ADMIN_NAME,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        emailVerified: true,
        createdIp: 'system',
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password loaded from ADMIN_PASSWORD env');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
