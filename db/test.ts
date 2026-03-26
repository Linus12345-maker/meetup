import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { events } from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function test() {
  const allEvents = await db.select().from(events).limit(1);
  if (allEvents.length === 0) {
    console.log('No events found');
    return;
  }
  const event = allEvents[0];
  console.log('Event ID:', event.id);

  try {
    const res = await fetch(`http://localhost:3001/api/events/${event.id}`);
    const text = await res.text();
    console.log('API Response status:', res.status);
    console.log('API Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
