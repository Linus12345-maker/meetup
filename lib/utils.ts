import type { VercelRequest, VercelResponse } from '@vercel/node';

export function jsonResponse(res: VercelResponse, status: number, data: any) {
  return res.status(status).json(data);
}

export function handleMethodNotAllowed(req: VercelRequest, res: VercelResponse, allowedMethods: string[]) {
  res.setHeader('Allow', allowedMethods.join(', '));
  return jsonResponse(res, 405, { error: `Method ${req.method} Not Allowed` });
}

export function handleApiError(res: VercelResponse, error: any) {
  console.error('API Error:', error);
  if (error.message === 'Unauthorized' || error.message.startsWith('Unauthorized:')) {
    return jsonResponse(res, 401, { error: error.message });
  }
  return jsonResponse(res, 500, { error: 'Internal Server Error' });
}
