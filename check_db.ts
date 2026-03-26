import { db } from '/Users/alox/Developer/review/meetup/db';
import { events } from '/Users/alox/Developer/review/meetup/db/schema';
import { desc } from 'drizzle-orm';

async function check() {
  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.createdAt)],
    limit: 5,
    with: { host: true }
  });
  console.log('Recent Events:', JSON.stringify(allEvents, null, 2));
}

check().catch(console.error);
