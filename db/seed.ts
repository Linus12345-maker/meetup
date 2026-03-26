import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { categories } from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding categories...');
  
  const categoryData = [
    { slug: 'tech', name: 'Tech', emoji: '💻' },
    { slug: 'coffee', name: 'Coffee Chat', emoji: '☕' },
    { slug: 'active', name: 'Active', emoji: '👟' },
    { slug: 'design', name: 'Design', emoji: '🎨' },
    { slug: 'other', name: 'Other', emoji: '✨' },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  
  console.log('Categories seeded successfully!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Migration failed');
  console.error(e);
  process.exit(1);
});
