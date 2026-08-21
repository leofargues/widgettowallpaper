// ====================================================================
// MODULE GOOGLE AUTHENTICATION (OAuth2)
// ====================================================================

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedAccessToken = null;
let tokenExpirationTime = 0;

/**
 * Génère l'URL d'autorisation pour que l'utilisateur se connecte.
 */
export function getGoogleAuthUrl(origin) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/google/callback`;
  
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID est manquant.');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent', // Force to get a refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Échange un code d'autorisation contre des tokens.
 */
export async function exchangeCodeForTokens(code, origin) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant.');
  }

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur lors de l'échange du code: ${errorText}`);
  }

  return res.json();
}

/**
 * Récupère un token d'accès valide (utilise le cache si possible, sinon rafraîchit).
 */
export async function getValidAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpirationTime) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Identifiants Google (ID, Secret, Refresh Token) manquants.');
  }

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur de rafraîchissement du token: ${errorText}`);
  }

  const data = await res.json();
  
  cachedAccessToken = data.access_token;
  // Expire 5 minutes avant la fin réelle (souvent 3600s)
  tokenExpirationTime = Date.now() + (data.expires_in - 300) * 1000;

  return cachedAccessToken;
}
