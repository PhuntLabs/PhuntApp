
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { NextResponse, type NextRequest } from 'next/server';

const { NEXT_PUBLIC_AGORA_APP_ID, AGORA_APP_CERTIFICATE } = process.env;

export async function GET(req: NextRequest) {
  if (!NEXT_PUBLIC_AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return NextResponse.json({ error: 'Agora credentials are not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const channelName = searchParams.get('channelName');
  const userAccount = searchParams.get('userAccount'); // Changed from 'uid'

  if (!channelName) {
    return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
  }

  if (!userAccount) {
    return NextResponse.json({ error: 'userAccount is required' }, { status: 400 });
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Use buildTokenWithUserAccount for string-based UIDs
  const token = RtcTokenBuilder.buildTokenWithUserAccount(
    NEXT_PUBLIC_AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    userAccount,
    role,
    privilegeExpiredTs
  );

  return NextResponse.json({ token });
}
