
import { NextResponse } from 'next/server';
import querystring from 'querystring';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI
} = process.env;

const scope = [
  'user-read-private',
  'user-read-email',
  'user-read-currently-playing',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

const generateRandomString = (length: number) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export async function GET() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_REDIRECT_URI) {
    return NextResponse.json({ error: 'Spotify environment variables are not set.' }, { status: 500 });
  }

  const state = generateRandomString(16);
  // In a real app, you would save this state to the user's session or a temporary cookie
  // to verify it on the callback.

  const authUrl = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state,
    });

  return NextResponse.redirect(authUrl);
}
