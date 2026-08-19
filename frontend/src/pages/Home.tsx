import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Flame, 
  Sparkles, 
  Clock, 
  Compass, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Wand2, 
  Mic, 
  Sliders, 
  Layers, 
  Radio, 
  Loader2 
} from 'lucide-react';
import api from '../services/api';
import { Song, Album, Artist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import Card from '../components/Card';
import SongRow from '../components/SongRow';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [popular, setPopular] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive AI Music Generation Prompt State
  const [promptText, setPromptText] = useState('');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const { playSong } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, popRes, newRes, artRes, albRes] = await Promise.all([
          api.get('/songs/recommended'),
          api.get('/songs/popular'),
          api.get('/songs/new-releases'),
          api.get('/artists'),
          api.get('/albums')
        ]);
        setRecommended(recRes.data);
        setPopular(popRes.data);
        setNewReleases(newRes.data);
        setArtists(artRes.data);
        setAlbums(albRes.data);
      } catch (err) {
        console.error('Failed to fetch home dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateMusic = () => {
    if (!promptText.trim()) {
      setPromptText('Synthwave lo-fi beat with ambient bass');
    }
    setIsGenerating(true);
    setGeneratedSuccess(false);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSuccess(true);
      if (popular.length > 0) {
        playSong(popular[0], popular);
      }
      setTimeout(() => setGeneratedSuccess(false), 4000);
    }, 2200);
  };

  const studioTools = [
    {
      id: 'loop-studio',
      title: 'Loop Studio',
      subtitle: 'Pick a genre and BPM, get a track...',
      badge: 'STUDIO',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      glowColor: 'from-purple-600/40 via-pink-600/30 to-blue-900/60'
    },
    {
      id: 'voice-to-song',
      title: 'Voice to Song',
      subtitle: 'Record a rough vocal idea and remix...',
      badge: 'STUDIO',
      image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      glowColor: 'from-blue-600/40 via-indigo-600/30 to-purple-900/60'
    },
    {
      id: 'genreshift',
      title: 'Genreshift',
      subtitle: 'Same voice and melody, converted...',
      badge: 'STUDIO',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
      glowColor: 'from-emerald-500/40 via-amber-500/30 to-pink-900/60'
    },
    {
      id: 'sample-to-song',
      title: 'Sample to Song',
      subtitle: 'Turn a sample, drum loop, synth...',
      badge: 'STUDIO',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
      glowColor: 'from-rose-600/40 via-orange-600/30 to-purple-900/60'
    },
    {
      id: 'unplugged',
      title: 'Unplugged',
      subtitle: 'Turn any song into an acoustic...',
      badge: 'STUDIO',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      glowColor: 'from-indigo-600/40 via-pink-600/30 to-purple-950/60'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="muse-orb animate-pulse"></div>
        <p className="text-xs text-muse-subtext font-medium tracking-wider">Loading ElevMuse Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-12 pb-24 select-none max-w-7xl mx-auto">
      {/* Hero Sound Generator Section */}
      <section className="text-center space-y-5 pt-4 relative">
        {/* Glowing 3D Orb Icon */}
        <div 
          onClick={handleCreateMusic}
          title="Click to randomize AI prompt"
          className="muse-orb mx-auto cursor-pointer hover:scale-110 transition-transform shadow-2xl"
        ></div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Generate New Music
          </h1>
          <p className="text-xs md:text-sm text-muse-subtext max-w-lg mx-auto leading-relaxed">
            Describe a sound, remix what's playing, or start from a track below to create music instantly effortlessly.
          </p>
        </div>

        {/* ElevMuse AI Prompt Card */}
        <div className="max-w-2xl mx-auto glass-panel p-4 md:p-5 rounded-3xl border border-pink-500/30 shadow-2xl relative text-left backdrop-blur-2xl">
          <Sparkles className="w-4 h-4 text-pink-400 absolute top-4 right-5 opacity-80" />
          
          <div className="space-y-3">
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type To Create Music..."
              className="w-full bg-transparent text-white text-sm focus:outline-none resize-none placeholder:text-muse-subtext/60 placeholder:font-normal font-medium"
            />

            {/* Input Controls & Filter Capsules */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-muse-border/20">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setPromptText('Deep synthwave drive with saxophone solo')}
                  className="w-7 h-7 rounded-full bg-muse-hover/80 border border-muse-border/40 flex items-center justify-center text-muse-subtext hover:text-white transition-colors"
                  title="Add tag"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => setSelectedStyle(selectedStyle === 'Styles' ? 'Auto' : 'Styles')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedStyle === 'Styles'
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'bg-muse-hover/50 border-muse-border/30 text-muse-subtext hover:text-white'
                  }`}
                >
                  Styles
                </button>

                <button 
                  onClick={() => setSelectedStyle('Auto')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedStyle === 'Auto'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-muse-hover/50 border-muse-border/30 text-muse-subtext hover:text-white'
                  }`}
                >
                  Auto
                </button>

                <button 
                  onClick={() => setSelectedStyle('Cumbia')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedStyle === 'Cumbia'
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'bg-muse-hover/50 border-muse-border/30 text-muse-subtext hover:text-white'
                  }`}
                >
                  Cumbia
                </button>

                {/* Instrumental Toggle Switch */}
                <div 
                  onClick={() => setIsInstrumental(!isInstrumental)}
                  className="flex items-center gap-2 pl-2 cursor-pointer group"
                >
                  <span className="text-xs text-muse-subtext group-hover:text-white transition-colors font-medium">Instrumental</span>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isInstrumental ? 'bg-pink-500' : 'bg-muse-hover'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isInstrumental ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </div>

              {/* Create Pink Gradient Button */}
              <button
                onClick={handleCreateMusic}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 text-white" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generation Feedback Toast */}
        {generatedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-bounce shadow-lg">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Sound generated & playing now!</span>
          </div>
        )}
      </section>

      {/* Start With a Tool Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Start With a Tool
          </h2>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-muse-card/80 border border-muse-border/40 flex items-center justify-center text-muse-subtext hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full bg-muse-card/80 border border-muse-border/40 flex items-center justify-center text-muse-subtext hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal ElevMuse Tool Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {studioTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => popular.length > 0 && playSong(popular[Math.floor(Math.random() * popular.length)], popular)}
              className="relative h-64 rounded-3xl overflow-hidden glass-panel group cursor-pointer border border-muse-border/40 hover:border-pink-500/60 transition-all duration-300 hover:scale-[1.03] shadow-xl flex flex-col justify-between p-4"
            >
              {/* Background Cover Image with Gradient Glow Overlay */}
              <img
                src={tool.image}
                alt={tool.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${tool.glowColor} opacity-70 group-hover:opacity-85 transition-opacity`}></div>

              {/* STUDIO Capsule Badge */}
              <div className="relative z-10">
                <span className="px-2.5 py-1 rounded-full bg-muse-dark/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-white uppercase tracking-wider">
                  {tool.badge}
                </span>
              </div>

              {/* Title & Description Overlay */}
              <div className="relative z-10 space-y-1">
                <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[11px] text-muse-subtext/90 line-clamp-2 leading-tight">
                  {tool.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Songs */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Recommended for You</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {recommended.slice(0, 5).map((song) => (
            <Card
              key={song.id}
              id={song.id}
              title={song.title}
              subtitle={song.artist_name || 'Artist'}
              image={song.cover_art || song.album_cover}
              type="song"
              onPlay={() => playSong(song, recommended)}
            />
          ))}
        </div>
      </section>

      {/* Popular Songs List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-pink-500" />
          <span>Popular Songs</span>
        </h2>
        <div className="glass-panel rounded-2xl p-4 divide-y divide-muse-border/20 border border-muse-border/40">
          {popular.slice(0, 5).map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={popular} />
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-purple-400" />
          <span>Featured Artists</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              id={artist.id}
              title={artist.name}
              subtitle={`${(artist.monthly_listeners || 0).toLocaleString()} monthly listeners`}
              image={artist.image}
              type="artist"
              onClick={() => navigate(`/artist/${artist.id}`)}
            />
          ))}
        </div>
      </section>

      {/* New Releases Albums */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-pink-400" />
          <span>New Releases</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {albums.map((album) => (
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
    </div>
  );
};

export default Home;
