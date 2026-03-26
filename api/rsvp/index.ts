import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';
import { events, rsvps } from '../../db/schema';
import { requireAuth } from '../../lib/auth';
import { handleMethodNotAllowed, handleApiError, jsonResponse } from '../../lib/utils';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const user = await requireAuth(req);
      const { eventId, status = 'going' } = req.body;

      if (!eventId) return jsonResponse(res, 400, { error: 'Missing eventId' });

      // Check if event exists
      const event = await db.query.events.findFirst({
        where: eq(events.id, eventId),
        with: { host: true }
      });

      if (!event) return jsonResponse(res, 404, { error: 'Event not found' });

      // Check if already RSVP'd
      const existingRsvp = await db.query.rsvps.findFirst({
        where: and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id))
      });

      let rsvpRecord;
      if (existingRsvp) {
        [rsvpRecord] = await db.update(rsvps)
          .set({ status })
          .where(eq(rsvps.id, existingRsvp.id))
          .returning();
      } else {
        [rsvpRecord] = await db.insert(rsvps)
          .values({ eventId, userId: user.id, status })
          .returning();

        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: 'Meetdown <onboarding@resend.dev>',
              to: 'delivered@resend.dev', // Use testing address since we don't have user emails parsed
              subject: `RSVP Confirmation: ${event.title}`,
              html: `<p>Hi ${user.name}, you have successfully RSVP'd to <strong>${event.title}</strong> hosted by ${event.host.name}!</p>`
            });
          } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
          }
        }
      }

      return jsonResponse(res, 200, rsvpRecord);
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await requireAuth(req);
      const { eventId } = req.body;

      if (!eventId) return jsonResponse(res, 400, { error: 'Missing eventId' });

      const existingRsvp = await db.query.rsvps.findFirst({
        where: and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id))
      });

      if (!existingRsvp) {
        return jsonResponse(res, 404, { error: 'RSVP not found' });
      }

      await db.delete(rsvps).where(eq(rsvps.id, existingRsvp.id));
      return jsonResponse(res, 200, { success: true });
    } catch (e) {
      return handleApiError(res, e);
    }
  }

  return handleMethodNotAllowed(req, res, ['POST', 'DELETE']);
}
