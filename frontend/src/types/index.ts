export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'artist' | 'admin';
  avatar?: string;
  subscription?: string;
  created_at?: string;
  stats?: {
    favoritesCount: number;
    playlistsCount: number;
  };
}

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  artist_name?: string;
  album_id?: string;
  album_title?: string;
  album_cover?: string;
  genre_id?: string;
  genre_name?: string;
  audio_url: string;
  duration: number;
  cover_art?: string;
  plays_count?: number;
  release_date?: string;
  is_favorite?: boolean;
  added_at?: string;
}

export interface Artist {
  id: string;
  user_id?: string;
  name: string;
  bio?: string;
  image?: string;
  is_verified?: boolean;
  monthly_listeners?: number;
  songs?: Song[];
  albums?: Album[];
}

export interface Album {
  id: string;
  artist_id: string;
  artist_name?: string;
  title: string;
  cover_art?: string;
  release_year?: number;
  genre?: string;
  songs?: Song[];
}

export interface Playlist {
  id: string;
  user_id: string;
  user_name?: string;
  name: string;
  description?: string;
  cover_art?: string;
  is_public?: boolean;
  songs?: Song[];
  created_at?: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  cover_image?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalSongs: number;
  totalPlaylists: number;
  totalPlays: number;
}
