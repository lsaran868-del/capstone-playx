package com.playx.service;

import com.playx.model.*;
import com.playx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;

@Service
public class SeedDataService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private GenreRepository genreRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ListeningHistoryRepository listeningHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (subscriptionRepository.count() > 0) {
            System.out.println("🌱 Database already seeded.");
            return;
        }

        System.out.println("🌱 Seeding PLAYX database with demo data...");

        // 1. Subscriptions
        Subscription subFree = Subscription.builder()
                .id("sub_free")
                .name("Free")
                .price(0.00)
                .description("Standard ad-supported listening")
                .features(Arrays.asList("Standard audio quality", "Shuffle play", "Basic playlists"))
                .createdAt(LocalDateTime.now())
                .build();

        Subscription subPremium = Subscription.builder()
                .id("sub_premium")
                .name("Premium")
                .price(9.99)
                .description("Unlimited ad-free music & HD streaming")
                .features(Arrays.asList("High Fidelity audio", "Unlimited skips", "Offline downloads", "Artist support"))
                .createdAt(LocalDateTime.now())
                .build();

        subscriptionRepository.save(subFree);
        subscriptionRepository.save(subPremium);

        // 2. Demo Users
        User admin = User.builder()
                .id("usr_admin")
                .name("Alex Admin")
                .email("admin@example.com")
                .password(passwordEncoder.encode("AdminPass123"))
                .role("admin")
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80")
                .createdAt(LocalDateTime.now())
                .build();

        User artistUser = User.builder()
                .id("usr_artist")
                .name("Synthwave Neo")
                .email("artist@example.com")
                .password(passwordEncoder.encode("ArtistPass123"))
                .role("artist")
                .avatar("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80")
                .createdAt(LocalDateTime.now())
                .build();

        User user = User.builder()
                .id("usr_user")
                .name("Chris Listener")
                .email("user@example.com")
                .password(passwordEncoder.encode("UserPass123"))
                .role("user")
                .avatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80")
                .createdAt(LocalDateTime.now())
                .build();

        User premiumUser = User.builder()
                .id("usr_premium")
                .name("Sophia Premium")
                .email("premium@example.com")
                .password(passwordEncoder.encode("PremiumPass123"))
                .role("user")
                .avatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80")
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(admin);
        userRepository.save(artistUser);
        userRepository.save(user);
        userRepository.save(premiumUser);

        // 3. User Subscriptions
        userSubscriptionRepository.save(UserSubscription.builder().id("usub_1").userId("usr_admin").subscriptionId("sub_premium").status("active").startsAt(LocalDateTime.now()).build());
        userSubscriptionRepository.save(UserSubscription.builder().id("usub_2").userId("usr_artist").subscriptionId("sub_premium").status("active").startsAt(LocalDateTime.now()).build());
        userSubscriptionRepository.save(UserSubscription.builder().id("usub_3").userId("usr_user").subscriptionId("sub_free").status("active").startsAt(LocalDateTime.now()).build());
        userSubscriptionRepository.save(UserSubscription.builder().id("usub_4").userId("usr_premium").subscriptionId("sub_premium").status("active").startsAt(LocalDateTime.now()).build());

        // 4. Genres
        Genre gSynthwave = Genre.builder().id("gnr_synthwave").name("Synthwave").slug("synthwave").coverImage("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();
        Genre gPop = Genre.builder().id("gnr_pop").name("Pop").slug("pop").coverImage("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();
        Genre gLofi = Genre.builder().id("gnr_lofi").name("Lo-Fi Beats").slug("lofi").coverImage("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();
        Genre gRock = Genre.builder().id("gnr_rock").name("Rock").slug("rock").coverImage("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();
        Genre gElectronic = Genre.builder().id("gnr_electronic").name("Electronic").slug("electronic").coverImage("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();
        Genre gClassical = Genre.builder().id("gnr_classical").name("Classical").slug("classical").coverImage("https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80").createdAt(LocalDateTime.now()).build();

        genreRepository.save(gSynthwave);
        genreRepository.save(gPop);
        genreRepository.save(gLofi);
        genreRepository.save(gRock);
        genreRepository.save(gElectronic);
        genreRepository.save(gClassical);

        // 5. Artists
        Artist aSynth = Artist.builder().id("art_synth").userId("usr_artist").name("Synthwave Neo").bio("Pioneer of retro-futuristic electronic soundscapes and neon synth rhythms.").image("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(1420500).createdAt(LocalDateTime.now()).build();
        Artist aDaft = Artist.builder().id("art_daft").userId(null).name("Cyber Robots").bio("Legendary French electronic duo crafting timeless dance anthems.").image("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(3250000).createdAt(LocalDateTime.now()).build();
        Artist aHans = Artist.builder().id("art_hans").userId(null).name("Orchestral Dreams").bio("World-renowned cinematic composer behind epic movie soundtracks.").image("https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(2890000).createdAt(LocalDateTime.now()).build();
        Artist aLofi = Artist.builder().id("art_lofi").userId(null).name("Midnight Chill").bio("Cozy lo-fi beats for late night coding and study sessions.").image("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(980000).createdAt(LocalDateTime.now()).build();

        artistRepository.save(aSynth);
        artistRepository.save(aDaft);
        artistRepository.save(aHans);
        artistRepository.save(aLofi);

        // 6. Albums
        Album albNeon = Album.builder().id("alb_neon").artistId("art_synth").title("Neon Highway 1984").coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Synthwave").createdAt(LocalDateTime.now()).build();
        Album albCyber = Album.builder().id("alb_cyber").artistId("art_daft").title("Digital World").coverArt("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").releaseYear(2023).genre("Electronic").createdAt(LocalDateTime.now()).build();
        Album albInter = Album.builder().id("alb_inter").artistId("art_hans").title("Cosmic Horizons").coverArt("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Classical").createdAt(LocalDateTime.now()).build();
        Album albLofi = Album.builder().id("alb_lofi").artistId("art_lofi").title("Late Night Coffee").coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").releaseYear(2025).genre("Lo-Fi Beats").createdAt(LocalDateTime.now()).build();

        albumRepository.save(albNeon);
        albumRepository.save(albCyber);
        albumRepository.save(albInter);
        albumRepository.save(albLofi);

        // 7. Songs
        Song s1 = Song.builder().id("sng_neon_drive").title("Midnight Neon Drive").artistId("art_synth").albumId("alb_neon").genreId("gnr_synthwave").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3").duration(372).coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").playsCount(48920).releaseDate(LocalDate.parse("2024-01-15")).createdAt(LocalDateTime.now()).build();
        Song s2 = Song.builder().id("sng_retro_sunset").title("Retro Sunset Boulevard").artistId("art_synth").albumId("alb_neon").genreId("gnr_synthwave").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3").duration(423).coverArt("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80").playsCount(31200).releaseDate(LocalDate.parse("2024-02-10")).createdAt(LocalDateTime.now()).build();
        Song s3 = Song.builder().id("sng_cyber_pulse").title("Cybernetic Pulse").artistId("art_daft").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3").duration(344).coverArt("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").playsCount(98400).releaseDate(LocalDate.parse("2023-11-20")).createdAt(LocalDateTime.now()).build();
        Song s4 = Song.builder().id("sng_starlight").title("Starlight Odyssey").artistId("art_hans").albumId("alb_inter").genreId("gnr_classical").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3").duration(512).coverArt("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80").playsCount(67100).releaseDate(LocalDate.parse("2024-03-01")).createdAt(LocalDateTime.now()).build();
        Song s5 = Song.builder().id("sng_lofi_rain").title("Rainy Night Study Session").artistId("art_lofi").albumId("alb_lofi").genreId("gnr_lofi").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3").duration(215).coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").playsCount(125300).releaseDate(LocalDate.parse("2025-01-05")).createdAt(LocalDateTime.now()).build();
        Song s6 = Song.builder().id("sng_electric_dream").title("Electric Dreams").artistId("art_daft").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3").duration(388).coverArt("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").playsCount(73000).releaseDate(LocalDate.parse("2023-12-01")).createdAt(LocalDateTime.now()).build();

        songRepository.save(s1);
        songRepository.save(s2);
        songRepository.save(s3);
        songRepository.save(s4);
        songRepository.save(s5);
        songRepository.save(s6);

        // 8. Playlists
        Playlist pl1 = Playlist.builder().id("pl_coding").userId("usr_admin").name("Coding & Focus Essentials").description("The ultimate synthwave & lo-fi playlist for deep focus coding sessions.").coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();
        Playlist pl2 = Playlist.builder().id("pl_retro").userId("usr_user").name("80s Neon Retro Hits").description("Synthwave, outrun, and cyberpunk synth melodies.").coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();

        playlistRepository.save(pl1);
        playlistRepository.save(pl2);

        // 9. Playlist Songs
        playlistSongRepository.save(PlaylistSong.builder().id("ps_1").playlistId("pl_coding").songId("sng_neon_drive").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_2").playlistId("pl_coding").songId("sng_lofi_rain").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_3").playlistId("pl_coding").songId("sng_cyber_pulse").position(3).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_4").playlistId("pl_retro").songId("sng_neon_drive").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_5").playlistId("pl_retro").songId("sng_retro_sunset").position(2).addedAt(LocalDateTime.now()).build());

        // 10. Favorites
        favoriteRepository.save(Favorite.builder().id("fav_1").userId("usr_user").songId("sng_neon_drive").createdAt(LocalDateTime.now()).build());
        favoriteRepository.save(Favorite.builder().id("fav_2").userId("usr_user").songId("sng_lofi_rain").createdAt(LocalDateTime.now()).build());

        // 11. Listening History
        listeningHistoryRepository.save(ListeningHistory.builder().id("hist_1").userId("usr_user").songId("sng_neon_drive").playedAt(LocalDateTime.now()).build());

        System.out.println("✅ PLAYX Database seeded successfully!");
    }
}
