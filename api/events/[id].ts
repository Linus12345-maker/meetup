import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';
import { events, rsvps } from '../../db/schema';
import { requireAuth } from '../../lib/auth';
import { handleMethodNotAllowed, handleApiError, jsonResponse } from '../../lib/utils';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return jsonResponse(res, 400, { error: 'Invalid event ID' });

  if (req.method === 'GET') {
    try {
      const event = await db.query.events.findFirst({
        where: eq(events.id, id),
        with: {
          host: {
            columns: { id: true, name: true, avatarUrl: true, clerkId: true }
          },
          rsvps: {
            with: {
              user: {
                columns: { id: true, name: true, avatarUrl: true, bio: true, clerkId: true }
              }
            }
          }
        }
      });
      if (!event) return jsonResponse(res, 404, { error: 'Event not found' });
      return jsonResponse(res, 200, event);
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  if (req.method === 'PUT' || req.method === 'DELETE') {
    try {
      const user = await requireAuth(req);
      const event = await db.query.events.findFirst({ where: eq(events.id, id) });
      
      if (!event) return jsonResponse(res, 404, { error: 'Event not found' });
      if (event.hostId !== user.id) return jsonResponse(res, 403, { error: 'Forbidden: You are not the host' });

      if (req.method === 'DELETE') {
        // delete rsvps first to avoid constraint errors
        await db.delete(rsvps).where(eq(rsvps.eventId, id));
        await db.delete(events).where(eq(events.id, id));
        return jsonResponse(res, 200, { success: true });
      }

      if (req.method === 'PUT') {
        const updates = req.body;
        delete updates.id;
        delete updates.hostId;
        delete updates.createdAt;
        if (updates.dateTime) updates.dateTime = new Date(updates.dateTime);
        
        const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
        return jsonResponse(res, 200, updated);
      }
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  return handleMethodNotAllowed(req, res, ['GET', 'PUT', 'DELETE']);
}
