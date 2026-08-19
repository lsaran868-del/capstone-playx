import React, { useEffect, useState } from 'react';
import { Search as SearchIcon, Music, User, Disc } from 'lucide-react';
import api from '../services/api';
import { Song, Artist, Album, Genre } from '../types';
import { usePlayer } from '../context/PlayerContext';
import Card from '../components/Card';
import SongRow from '../components/SongRow';
import { useNavigate } from 'react-router-dom';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const [results, setResults] = useState<{ songs: Song[]; artists: Artist[]; albums: Album[] }>({ songs: [], artists: [], albums: [] });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  const { playSong } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/genres');
        setGenres(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-8 space-y-8 pb-20 select-none">
      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <SearchIcon className="w-5 h-5 absolute left-4 top-3.5 text-spotify-subtext" />
        <input
          type="text"
          placeholder="Search songs, artists, or albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-spotify-card border border-spotify-hover text-white text-base rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 transition-all shadow-xl"
          autoFocus
        />
      </div>

      {/* Tabs when searching */}
      {query.trim() && (
        <div className="flex items-center gap-3 border-b border-spotify-hover/40 pb-4">
          {(['all', 'songs', 'artists', 'albums'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-colors ${
                activeTab === tab ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search Results */}
      {!loading && query.trim() && (
        <div className="space-y-10">
          {/* Songs section */}
          {(activeTab === 'all' || activeTab === 'songs') && results.songs.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-spotify-green" />
                <span>Songs</span>
              </h2>
              <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
                {results.songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} queue={results.songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists section */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Artists</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {results.artists.map((artist) => (
                  <Card
                    key={artist.id}
                    id={artist.id}
                    title={artist.name}
                    subtitle="Artist"
                    image={artist.image}
                    type="artist"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums section */}
          {(activeTab === 'all' || activeTab === 'albums') && results.albums.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Disc className="w-5 h-5 text-amber-400" />
                <span>Albums</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {results.albums.map((album) => (
                  <Card
                    key={album.id}
                    id={album.id}
                    title={album.title}
                    subtitle={album.artist_name || 'Album'}
                    image={album.cover_art}
                    type="album"
                    onClick={() => navigate(`/album/${album.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Default Browse Genres Grid when not searching */}
      {!query.trim() && (
        <section className="space-y-6">
          <h2 className="text-2xl font-extrabold text-white">Browse All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                onClick={() => setQuery(genre.name)}
                className="h-36 rounded-2xl p-4 relative overflow-hidden cursor-pointer group shadow-xl border border-spotify-hover/30 bg-gradient-to-br from-spotify-card to-black hover:scale-[1.03] transition-transform"
              >
                <span className="font-extrabold text-lg text-white block max-w-[80%] z-10 relative">
                  {genre.name}
                </span>
                <img
                  src={genre.cover_image || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80'}
                  alt={genre.name}
                  className="w-24 h-24 absolute -right-3 -bottom-3 rotate-12 rounded-lg object-cover shadow-2xl group-hover:rotate-0 transition-transform"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchPage;
