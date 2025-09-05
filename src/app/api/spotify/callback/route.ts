
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { doc, updateDoc } from 'firebase/firestore';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

// This is a simplified function to get the current user ID.
// In a production app, you would use a more robust session management library like NextAuth.js
// or verify a Firebase Auth ID token passed from the client.
async function getUserIdFromSession(): Promise<string | null> {
  const session = cookies().get('__session')?.value || '';

  if (!session) {
    return null;
  }

  try {
    const decodedIdToken = await getAuth().verifySessionCookie(session, true);
    return decodedIdToken.uid;
  } catch (error) {
    console.error("Failed to verify session cookie:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  // In a real app, you would also verify the 'state' parameter against the one you saved.

  if (!code || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    return NextResponse.redirect(new URL('/settings?error=spotify_missing_params', req.nextUrl.origin));
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify Token Error:', data);
      throw new Error(data.error_description || 'Failed to fetch Spotify tokens.');
    }
    
    // For this prototype, we'll redirect back with a success message.
    // In a real app, you would get the current user's ID and save the access_token and refresh_token
    // to their profile in Firestore.
    
    // Example of saving to Firestore (requires robust user session management):
    // const userId = await getUserIdFromSession();
    // if (userId) {
    //   const userRef = doc(adminDb, 'users', userId);
    //   await updateDoc(userRef, {
    //     'connections.spotify': {
    //       accessToken: data.access_token,
    //       refreshToken: data.refresh_token,
    //       expiresIn: data.expires_in,
    //       connectedAt: new Date().toISOString()
    //     }
    //   });
    // }

    return NextResponse.redirect(new URL('/?spotify_connected=true', req.nextUrl.origin));

  } catch (error: any) {
    console.error('Spotify Callback Error:', error);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error.message)}`, req.nextUrl.origin));
  }
}
