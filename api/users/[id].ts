import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';
import { users, events } from '../../db/schema';
import { handleMethodNotAllowed, handleApiError, jsonResponse } from '../../lib/utils';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query; // this will be clerkId or db user id
  if (!id || typeof id !== 'string') return jsonResponse(res, 400, { error: 'Invalid user ID' });

  if (req.method === 'GET') {
    try {
      // Allow fetching by clerkId or DB uuid
      let user = await db.query.users.findFirst({
        where: eq(users.clerkId, id),
        with: {
          hostedEvents: {
            with: { rsvps: true }
          },
          rsvps: {
            with: { event: true }
          }
        }
      });
      
      if (!user) {
        // Try UUID
        try {
          user = await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
              hostedEvents: {
                with: { rsvps: true }
              },
              rsvps: {
                with: { event: true }
              }
            }
          });
        } catch (e) {
          // UUID parse error, just ignore and 404
        }
      }

      if (!user) return jsonResponse(res, 404, { error: 'User not found' });

      const { getOptionalAuth } = await import('../../lib/auth');
      const viewer = await getOptionalAuth(req);
      const viewerId = viewer?.id;
      const viewerClerkId = viewer?.clerkId;
      
      const isViewerHost = !!viewer && (viewerId === user.id || viewerClerkId === user.clerkId);
      
      if (!isViewerHost) {
        user.hostedEvents = user.hostedEvents.filter((e: any) => !e.isPrivate);
      }
      
      return jsonResponse(res, 200, user);
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  return handleMethodNotAllowed(req, res, ['GET']);
}
