const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const prisma = new PrismaClient();
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/20251003232100_add_missing_order_timestamp_columns/migration.sql'),
      'utf8'
    );
    
    console.log('Applying migration...');
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('Migration applied successfully!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
