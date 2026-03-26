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
        const rsvpRes = await db.delete(rsvps).where(eq(rsvps.eventId, id));
        const eventRes = await db.delete(events).where(eq(events.id, id));
        return jsonResponse(res, 200, { success: true });
      }

      if (req.method === 'PUT') {
        const body = req.body;
        const updates: any = {};
        
        // Explicitly map fields to avoid accidental overwrites of system fields
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.categorySlug !== undefined) updates.categorySlug = body.categorySlug;
        if (body.locationName !== undefined) updates.locationName = body.locationName;
        if (body.lat !== undefined) updates.lat = body.lat;
        if (body.lng !== undefined) updates.lng = body.lng;
        if (body.coverImageUrl !== undefined) updates.coverImageUrl = body.coverImageUrl;
        if (body.isPrivate !== undefined) updates.isPrivate = body.isPrivate;
        
        // Map capacity to maxAttendees
        if (body.maxAttendees !== undefined) updates.maxAttendees = body.maxAttendees;
        else if (body.capacity !== undefined) updates.maxAttendees = parseInt(body.capacity);

        if (body.dateTime) {
          updates.dateTime = new Date(body.dateTime);
        }
        
        const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
        return jsonResponse(res, 200, updated);
      }
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  return handleMethodNotAllowed(req, res, ['GET', 'PUT', 'DELETE']);
}
