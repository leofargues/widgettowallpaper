import { exchangeCodeForTokens } from '../../../../../lib/google-auth.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new Response(`Erreur d'autorisation: ${error}`, { status: 400 });
    }

    if (!code) {
      return new Response('Code d\'autorisation manquant.', { status: 400 });
    }

    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      'localhost:3000';
      
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const tokens = await exchangeCodeForTokens(code, origin);

    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return new Response(
        `<html>
          <body style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
            <h2>⚠️ Jeton de rafraîchissement manquant</h2>
            <p>Google n'a pas renvoyé de <code>refresh_token</code>. Cela arrive souvent si vous avez déjà autorisé l'application précédemment.</p>
            <p><strong>Solution :</strong> Allez sur <a href="https://myaccount.google.com/permissions" target="_blank">les paramètres de sécurité de votre compte Google</a>, supprimez l'accès à cette application, puis réessayez de vous connecter via <code>/api/auth/google/login</code>.</p>
          </body>
        </html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response(
      `<html>
        <body style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: auto;">
          <h2 style="color: #0f7b6c;">✅ Authentification réussie !</h2>
          <p>Voici votre <strong>Refresh Token</strong>. Copiez-le et ajoutez-le dans Vercel (ou votre fichier <code>.env</code>) sous le nom <code>GOOGLE_REFRESH_TOKEN</code> :</p>
          
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-top: 20px; word-break: break-all; border: 1px solid #ddd;">
            <code style="font-size: 14px; user-select: all;">${refreshToken}</code>
          </div>
          
          <p style="margin-top: 30px;">
            Vous pouvez maintenant retourner sur <a href="/setup.html">la page de configuration</a> ou tester <a href="/api/wallpaper?theme=light">le fond d'écran</a>.
          </p>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Callback route error:', err);
    return new Response(`Erreur: ${err.message}`, { status: 500 });
  }
}
