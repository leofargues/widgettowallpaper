import { getGoogleAuthUrl } from '../../../../../lib/google-auth.js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      'localhost:3000';
      
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return new Response('Erreur: GOOGLE_CLIENT_ID manquant dans les variables d\'environnement.', { status: 400 });
    }

    const authUrl = getGoogleAuthUrl(origin);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('Login route error:', err);
    return new Response(`Erreur: ${err.message}`, { status: 500 });
  }
}
