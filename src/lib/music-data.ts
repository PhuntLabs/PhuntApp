
import type { Song } from './types';

// You can add your song URLs and details here.
// For album art, you can use a service like https://picsum.photos/ or a direct link.
// For audio, you can use a direct URL to an MP3 file.
export const musicLibrary: Song[] = [
  {
    id: 'lofi-1',
    title: 'Lofi Chill',
    artist: 'Lofi Girl',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273e8a3469085a2e58a74c2e008',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/12/22/audio_49e38e6488.mp3',
  },
  {
    id: 'synthwave-2',
    title: 'Midnight Cruise',
    artist: 'Synthwave Boy',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b2738863fabb64345354e384594c',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_c68a1f6a1c.mp3',
  },
  {
    id: 'ambient-3',
    title: 'Forest Whispers',
    artist: 'Nature Sounds',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27332b53513615ca41e411516e5',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/03/audio_517992a343.mp3',
  },
];

    