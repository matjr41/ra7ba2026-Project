// Fix failed migration in Railway PostgreSQL
const { PrismaClient } = require('@prisma/client');

async function fixMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing failed migration...');
    
    // Delete the failed migration record
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251018_complete_schema_sync'
    `);
    
    console.log('✅ Failed migration removed successfully!');
    console.log('Now redeploy your backend on Railway.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
