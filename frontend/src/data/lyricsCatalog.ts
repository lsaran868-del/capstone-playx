import { Song } from '../types';

export const LYRICS_CATALOG: Record<string, string[]> = {
  // Matching user's reference screenshot: Azhagiye from Kaatru Veliyidai
  'azhagiye': [
    "Azhagiye... Marry Me, Marry Me...",
    "Azhagiye... Marry Me, Marry Me...",
    "Kadhalae... Kadhalae... En Kadhalae...",
    "En Aasai Kadhalae...",
    "Nee Thotta Idamellam Thitithaikudhae",
    "Un Paarvai Patta Idam Minnumae",
    "Azhagiye... Marry Me, Marry Me...",
    "Kooda Vanthu Nee Vazhum Kaalam Varai",
    "Nenjukkul Un Paadal Thaalaattuthey",
    "Un Siripil En Ulagam Thadumaaruthey",
    "Azhagiye... Marry Me..."
  ],

  // Matching user's current player screenshot: Verappa by Sai Abhayankkar
  'verappa': [
    "Verappa... Nadanthu Poran...",
    "Kaattukkulla Simmam Pola Thimiru Kaaturan...",
    "Parakkura Paravai Pole En Manasu",
    "Vaanatha Thottu Paarkka Pogudhu",
    "Verappa... Verappa... Adi Aatha...",
    "Un Paarvai Enna Maayam Pannudho",
    "Adi Raasaathi Un Mele Aasai Vachiten",
    "Kaalam Poora Un Kooda Vazha Vanthen",
    "Verappa... Nadanthu Poran..."
  ],

  // Synthwave & Electronic Demo tracks
  'midnight neon drive': [
    "Cruising down the electric boulevard tonight",
    "Neon shadows chasing the morning light",
    "Synthesizers humming in the midnight air",
    "Feel the retro pulse running through your hair",
    "We don't need a destination in mind",
    "Leaving all our worried thoughts behind",
    "Drive into the future, bathed in neon glow",
    "Where the rhythm takes us, that's where we go"
  ],

  'retro sunset boulevard': [
    "Sunset colors painting across the sky",
    "Purple and crimson waving goodbye",
    "Analog dreams on a magnetic tape",
    "Music is our greatest escape",
    "Feel the 80s beat under the stars",
    "Speeding past the silhouette of cars",
    "Forever in the glow of the twilight zone"
  ],

  'summer breeze vibes': [
    "Golden sunshine breaking through the trees",
    "Dancing to the melody of summer breeze",
    "Carefree moments spinning all around",
    "Lost inside this vibrant pop sound",
    "Take my hand, don't let it slip away",
    "We've got the music to light up the day"
  ],

  'party lights & city glow': [
    "Bass drops and the room begins to shake",
    "These are the memories we're meant to make",
    "Strobe lights flashing through the crowd tonight",
    "Everything is glowing in ultraviolet light",
    "Sing along with the chorus high",
    "We're gonna touch the midnight sky"
  ],

  'late night coffee': [
    "Raindrops tapping on the window glass",
    "Watching silent city shadows pass",
    "Warm mug in hand, lo-fi on the track",
    "No looking forward, no looking back",
    "Gentle chords drifting into space",
    "Finding peace inside this quiet place"
  ],

  'ignition overdrive': [
    "Guitars screeching like a thunder roll",
    "Rock and roll taking full control",
    "Amp turned to eleven, feel the power rise",
    "Sparks flying beneath the arena skies",
    "We won't back down, we won't compromise",
    "Ignition overdrive!"
  ]
};

/**
 * Returns formatted lyrics lines for a given song.
 */
export const getSongLyrics = (song: Song | null): string[] => {
  if (!song) return ["No song currently playing."];

  // 1. Direct song lyrics from database if present
  if (song.lyrics && song.lyrics.trim()) {
    return song.lyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  // 2. Lookup in curated catalog by normalized title
  const cleanTitle = song.title.toLowerCase().trim();
  for (const [key, lines] of Object.entries(LYRICS_CATALOG)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return lines;
    }
  }

  // 3. Elegant lyrical visualizer fallback matching the song's artist & genre
  const artistName = song.artist_name || 'PlayX Artist';
  const genre = song.genre_name || 'Music';

  return [
    `♪ ${song.title} ♪`,
    `Performed by ${artistName}`,
    `Genre: ${genre}`,
    "",
    "Feel the immersive soundscape of PlayX",
    "Let the rhythm take over your senses",
    "Every beat resonating through the air",
    "Basslines echoing deep in your soul",
    "",
    `"${song.title}" streaming in high definition`,
    "Lost in the euphoria of pure sound",
    `Thank you for listening with ${artistName}`
  ];
};
