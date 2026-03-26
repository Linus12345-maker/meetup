import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';
import { events, rsvps } from '../../db/schema';
import { requireAuth, getOptionalAuth } from '../../lib/auth';
import { handleMethodNotAllowed, handleApiError, jsonResponse } from '../../lib/utils';
import { and, eq, ilike, gte, desc, or } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { category, search, upcoming } = req.query;
      const conditions = [];

      if (category && typeof category === 'string' && category !== 'all') {
        conditions.push(eq(events.categorySlug, category));
      }
      if (search && typeof search === 'string') {
        conditions.push(ilike(events.title, `%${search}%`));
      }
      if (upcoming === 'true') {
        conditions.push(gte(events.dateTime, new Date()));
      }
      
      const user = await getOptionalAuth(req);
      const userId = user?.id;

      // Filter: Show public events OR private events where the user is the host
      if (userId) {
        conditions.push(or(eq(events.isPrivate, false), eq(events.hostId, userId)));
      } else {
        conditions.push(eq(events.isPrivate, false));
      }
      
      let whereClause;
      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }

      const results = await db.query.events.findMany({
        where: whereClause,
        orderBy: [desc(events.dateTime)],
        with: {
          host: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          rsvps: {
            columns: {
              id: true,
              userId: true,
              status: true
            }
          }
        }
      });
      
      return jsonResponse(res, 200, results);
    } catch (error) {
      return handleApiError(res, error);
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await requireAuth(req);
      const { 
        title, 
        description, 
        categorySlug, 
        dateTime, 
        locationName, 
        lat, 
        lng, 
        coverImageUrl, 
        maxAttendees, 
        isPrivate 
      } = req.body;

      if (!title || !description || !categorySlug || !dateTime || !locationName || lat === undefined || lng === undefined) {
        return jsonResponse(res, 400, { error: 'Missing required fields' });
      }

      const [newEvent] = await db.insert(events).values({
        title,
        description,
        hostId: user.id,
        categorySlug,
        dateTime: new Date(dateTime),
        locationName,
        lat: Number(lat),
        lng: Number(lng),
        coverImageUrl,
        maxAttendees: maxAttendees ? Number(maxAttendees) : null,
        isPrivate: Boolean(isPrivate)
      }).returning();

      // Host is automatically RSVP'd as going
      await db.insert(rsvps).values({
        eventId: newEvent.id,
        userId: user.id,
        status: 'going'
      });

      return jsonResponse(res, 201, newEvent);
    } catch (error) {
      return handleApiError(res, error);
    }
  }

  return handleMethodNotAllowed(req, res, ['GET', 'POST']);
}
