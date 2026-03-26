import { verifyToken, createClerkClient } from '@clerk/backend';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function requireAuth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    const clerkId = verified.sub;
    
    let userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!userRecord) {
      // Fetch user from clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);
      
      const insertData = {
        clerkId,
        name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim() : 'Anonymous',
        avatarUrl: clerkUser.imageUrl,
      };
      
      const [newRecord] = await db.insert(users).values(insertData).returning();
      userRecord = newRecord;
    }
    
    return userRecord;
  } catch (err: any) {
    console.error('Auth Error:', err.message);
    throw new Error('Unauthorized');
  }
}

export async function getOptionalAuth(req: any) {
  try {
    return await requireAuth(req);
  } catch (err) {
    return null;
  }
}
