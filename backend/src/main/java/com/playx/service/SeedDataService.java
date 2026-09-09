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
        Artist aLuna = Artist.builder().id("art_luna").userId(null).name("Luna Eclipse").bio("Dynamic pop sensation delivering infectious hooks, radiant vocals, and vibrant energy.").image("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(2150000).createdAt(LocalDateTime.now()).build();
        Artist aWolves = Artist.builder().id("art_electric_wolves").userId(null).name("The Electric Wolves").bio("Raw energy, anthemic rock riffs, and pulse-pounding arena overdrive.").image("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(1840000).createdAt(LocalDateTime.now()).build();
        Artist aPixel = Artist.builder().id("art_pixel").userId(null).name("Pixel Pulse").bio("Chiptune and 8-bit electronic synthesist blending arcade nostalgia with modern club grooves.").image("https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80").isVerified(true).monthlyListeners(670000).createdAt(LocalDateTime.now()).build();

        artistRepository.save(aSynth);
        artistRepository.save(aDaft);
        artistRepository.save(aHans);
        artistRepository.save(aLofi);
        artistRepository.save(aLuna);
        artistRepository.save(aWolves);
        artistRepository.save(aPixel);

        // 6. Albums
        Album albNeon = Album.builder().id("alb_neon").artistId("art_synth").title("Neon Highway 1984").coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Synthwave").createdAt(LocalDateTime.now()).build();
        Album albRetroHorizon = Album.builder().id("alb_retro_horizon").artistId("art_synth").title("Laser Horizon 2088").coverArt("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80").releaseYear(2025).genre("Synthwave").createdAt(LocalDateTime.now()).build();
        Album albCyber = Album.builder().id("alb_cyber").artistId("art_daft").title("Digital World").coverArt("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").releaseYear(2023).genre("Electronic").createdAt(LocalDateTime.now()).build();
        Album albInter = Album.builder().id("alb_inter").artistId("art_hans").title("Cosmic Horizons").coverArt("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Classical").createdAt(LocalDateTime.now()).build();
        Album albClassicsReborn = Album.builder().id("alb_classics_reborn").artistId("art_hans").title("Timeless Symphonies").coverArt("https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Classical").createdAt(LocalDateTime.now()).build();
        Album albLofi = Album.builder().id("alb_lofi").artistId("art_lofi").title("Late Night Coffee").coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").releaseYear(2025).genre("Lo-Fi Beats").createdAt(LocalDateTime.now()).build();
        Album albChillCafe = Album.builder().id("alb_chill_cafe").artistId("art_lofi").title("Rainy City Beats").coverArt("https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80").releaseYear(2025).genre("Lo-Fi Beats").createdAt(LocalDateTime.now()).build();
        Album albPopStarlight = Album.builder().id("alb_pop_starlight").artistId("art_luna").title("Starlight Pop").coverArt("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80").releaseYear(2025).genre("Pop").createdAt(LocalDateTime.now()).build();
        Album albRockIgnition = Album.builder().id("alb_rock_ignition").artistId("art_electric_wolves").title("Ignition Overdrive").coverArt("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").releaseYear(2024).genre("Rock").createdAt(LocalDateTime.now()).build();

        albumRepository.save(albNeon);
        albumRepository.save(albRetroHorizon);
        albumRepository.save(albCyber);
        albumRepository.save(albInter);
        albumRepository.save(albClassicsReborn);
        albumRepository.save(albLofi);
        albumRepository.save(albChillCafe);
        albumRepository.save(albPopStarlight);
        albumRepository.save(albRockIgnition);

        // 7. Songs (19 tracks across Synthwave, Pop, Rock, Lo-Fi, Classical, Electronic)
        // Synthwave
        Song s1 = Song.builder().id("sng_neon_drive").title("Midnight Neon Drive").artistId("art_synth").albumId("alb_neon").genreId("gnr_synthwave").audioUrl("/audio/sng_neon_drive.mp3").duration(204).coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").playsCount(48920).releaseDate(LocalDate.parse("2024-01-15")).createdAt(LocalDateTime.now()).build();
        Song s2 = Song.builder().id("sng_retro_sunset").title("Retro Sunset Boulevard").artistId("art_synth").albumId("alb_neon").genreId("gnr_synthwave").audioUrl("/audio/sng_retro_sunset.mp3").duration(268).coverArt("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80").playsCount(31200).releaseDate(LocalDate.parse("2024-02-10")).createdAt(LocalDateTime.now()).build();
        Song s3 = Song.builder().id("sng_miami_nights").title("Miami Nights Outrun").artistId("art_synth").albumId("alb_retro_horizon").genreId("gnr_synthwave").audioUrl("/audio/sng_miami_nights.mp3").duration(180).coverArt("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80").playsCount(54100).releaseDate(LocalDate.parse("2025-01-20")).createdAt(LocalDateTime.now()).build();

        // Pop
        Song s4 = Song.builder().id("sng_summer_breeze").title("Summer Breeze Vibes").artistId("art_luna").albumId("alb_pop_starlight").genreId("gnr_pop").audioUrl("/audio/sng_summer_breeze.mp3").duration(215).coverArt("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80").playsCount(89400).releaseDate(LocalDate.parse("2025-01-10")).createdAt(LocalDateTime.now()).build();
        Song s5 = Song.builder().id("sng_party_lights").title("Party Lights & City Glow").artistId("art_luna").albumId("alb_pop_starlight").genreId("gnr_pop").audioUrl("/audio/sng_party_lights.mp3").duration(245).coverArt("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80").playsCount(112000).releaseDate(LocalDate.parse("2025-02-14")).createdAt(LocalDateTime.now()).build();
        Song s6 = Song.builder().id("sng_golden_hour").title("Golden Hour Melody").artistId("art_luna").albumId("alb_pop_starlight").genreId("gnr_pop").audioUrl("/audio/sng_golden_hour.mp3").duration(212).coverArt("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80").playsCount(64800).releaseDate(LocalDate.parse("2025-03-01")).createdAt(LocalDateTime.now()).build();

        // Rock
        Song s7 = Song.builder().id("sng_thunder_strike").title("Thunder Strike").artistId("art_electric_wolves").albumId("alb_rock_ignition").genreId("gnr_rock").audioUrl("/audio/sng_thunder_strike.mp3").duration(210).coverArt("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").playsCount(78500).releaseDate(LocalDate.parse("2024-04-12")).createdAt(LocalDateTime.now()).build();
        Song s8 = Song.builder().id("sng_rebel_blaze").title("Rebel Road Blaze").artistId("art_electric_wolves").albumId("alb_rock_ignition").genreId("gnr_rock").audioUrl("/audio/sng_rebel_blaze.mp3").duration(226).coverArt("https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=600&q=80").playsCount(62300).releaseDate(LocalDate.parse("2024-06-25")).createdAt(LocalDateTime.now()).build();
        Song s9 = Song.builder().id("sng_sports_anthem").title("High Octane Anthem").artistId("art_electric_wolves").albumId("alb_rock_ignition").genreId("gnr_rock").audioUrl("/audio/sng_sports_anthem.mp3").duration(192).coverArt("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").playsCount(43900).releaseDate(LocalDate.parse("2024-08-30")).createdAt(LocalDateTime.now()).build();

        // Lo-Fi Beats
        Song s10 = Song.builder().id("sng_lofi_rain").title("Rainy Night Study Session").artistId("art_lofi").albumId("alb_lofi").genreId("gnr_lofi").audioUrl("/audio/sng_lofi_rain.mp3").duration(215).coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").playsCount(125300).releaseDate(LocalDate.parse("2025-01-05")).createdAt(LocalDateTime.now()).build();
        Song s11 = Song.builder().id("sng_cozy_coffee").title("Cozy Corner Cafe").artistId("art_lofi").albumId("alb_chill_cafe").genreId("gnr_lofi").audioUrl("/audio/sng_cozy_coffee.mp3").duration(226).coverArt("https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80").playsCount(88400).releaseDate(LocalDate.parse("2025-01-18")).createdAt(LocalDateTime.now()).build();
        Song s12 = Song.builder().id("sng_morning_dew").title("Morning Dew Drops").artistId("art_lofi").albumId("alb_chill_cafe").genreId("gnr_lofi").audioUrl("/audio/sng_morning_dew.mp3").duration(176).coverArt("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80").playsCount(95600).releaseDate(LocalDate.parse("2025-02-01")).createdAt(LocalDateTime.now()).build();

        // Classical
        Song s13 = Song.builder().id("sng_starlight").title("Starlight Odyssey").artistId("art_hans").albumId("alb_inter").genreId("gnr_classical").audioUrl("/audio/sng_starlight.mp3").duration(219).coverArt("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80").playsCount(67100).releaseDate(LocalDate.parse("2024-03-01")).createdAt(LocalDateTime.now()).build();
        Song s14 = Song.builder().id("sng_the_entertainer").title("The Ragtime Classic").artistId("art_hans").albumId("alb_classics_reborn").genreId("gnr_classical").audioUrl("/audio/sng_the_entertainer.mp3").duration(235).coverArt("https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80").playsCount(51200).releaseDate(LocalDate.parse("2024-05-15")).createdAt(LocalDateTime.now()).build();
        Song s15 = Song.builder().id("sng_tiny_fugue").title("Baroque Little Fugue").artistId("art_hans").albumId("alb_classics_reborn").genreId("gnr_classical").audioUrl("/audio/sng_tiny_fugue.mp3").duration(102).coverArt("https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80").playsCount(39800).releaseDate(LocalDate.parse("2024-07-20")).createdAt(LocalDateTime.now()).build();

        // Electronic
        Song s16 = Song.builder().id("sng_cyber_pulse").title("Cybernetic Pulse").artistId("art_daft").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("/audio/sng_cyber_pulse.mp3").duration(228).coverArt("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80").playsCount(98400).releaseDate(LocalDate.parse("2023-11-20")).createdAt(LocalDateTime.now()).build();
        Song s17 = Song.builder().id("sng_electric_dream").title("Electric Dreams").artistId("art_daft").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("/audio/sng_electric_dream.mp3").duration(184).coverArt("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").playsCount(73000).releaseDate(LocalDate.parse("2023-12-01")).createdAt(LocalDateTime.now()).build();
        Song s18 = Song.builder().id("sng_science_beat").title("Deep Space Nebula").artistId("art_daft").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("/audio/sng_science_beat.mp3").duration(215).coverArt("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80").playsCount(81200).releaseDate(LocalDate.parse("2024-04-05")).createdAt(LocalDateTime.now()).build();
        Song s19 = Song.builder().id("sng_pixel_arcade").title("8-Bit Pixel Arena").artistId("art_pixel").albumId("alb_cyber").genreId("gnr_electronic").audioUrl("/audio/sng_pixel_arcade.mp3").duration(198).coverArt("https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80").playsCount(57600).releaseDate(LocalDate.parse("2024-09-15")).createdAt(LocalDateTime.now()).build();

        songRepository.save(s1);
        songRepository.save(s2);
        songRepository.save(s3);
        songRepository.save(s4);
        songRepository.save(s5);
        songRepository.save(s6);
        songRepository.save(s7);
        songRepository.save(s8);
        songRepository.save(s9);
        songRepository.save(s10);
        songRepository.save(s11);
        songRepository.save(s12);
        songRepository.save(s13);
        songRepository.save(s14);
        songRepository.save(s15);
        songRepository.save(s16);
        songRepository.save(s17);
        songRepository.save(s18);
        songRepository.save(s19);

        // 8. Playlists
        Playlist pl1 = Playlist.builder().id("pl_coding").userId("usr_admin").name("Coding & Focus Essentials").description("The ultimate synthwave & lo-fi playlist for deep focus coding sessions.").coverArt("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();
        Playlist pl2 = Playlist.builder().id("pl_retro").userId("usr_user").name("80s Neon Retro Hits").description("Synthwave, outrun, and cyberpunk synth melodies.").coverArt("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();
        Playlist pl3 = Playlist.builder().id("pl_rock_energy").userId("usr_admin").name("Rock & Energy Workout").description("High-voltage guitar anthems and explosive beats to power up your session.").coverArt("https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();
        Playlist pl4 = Playlist.builder().id("pl_pop_hits").userId("usr_premium").name("Pop Euphoria 2025").description("Top charting pop hits, upbeat melodies, and vibrant vibes.").coverArt("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();
        Playlist pl5 = Playlist.builder().id("pl_classical_harmony").userId("usr_admin").name("Classical Masterpieces").description("Timeless piano, baroque fugues, and calming symphonies.").coverArt("https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80").isPublic(true).createdAt(LocalDateTime.now()).build();

        playlistRepository.save(pl1);
        playlistRepository.save(pl2);
        playlistRepository.save(pl3);
        playlistRepository.save(pl4);
        playlistRepository.save(pl5);

        // 9. Playlist Songs
        playlistSongRepository.save(PlaylistSong.builder().id("ps_1").playlistId("pl_coding").songId("sng_neon_drive").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_2").playlistId("pl_coding").songId("sng_lofi_rain").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_3").playlistId("pl_coding").songId("sng_cyber_pulse").position(3).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_4").playlistId("pl_coding").songId("sng_cozy_coffee").position(4).addedAt(LocalDateTime.now()).build());

        playlistSongRepository.save(PlaylistSong.builder().id("ps_5").playlistId("pl_retro").songId("sng_neon_drive").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_6").playlistId("pl_retro").songId("sng_retro_sunset").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_7").playlistId("pl_retro").songId("sng_miami_nights").position(3).addedAt(LocalDateTime.now()).build());

        playlistSongRepository.save(PlaylistSong.builder().id("ps_8").playlistId("pl_rock_energy").songId("sng_thunder_strike").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_9").playlistId("pl_rock_energy").songId("sng_rebel_blaze").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_10").playlistId("pl_rock_energy").songId("sng_sports_anthem").position(3).addedAt(LocalDateTime.now()).build());

        playlistSongRepository.save(PlaylistSong.builder().id("ps_11").playlistId("pl_pop_hits").songId("sng_summer_breeze").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_12").playlistId("pl_pop_hits").songId("sng_party_lights").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_13").playlistId("pl_pop_hits").songId("sng_golden_hour").position(3).addedAt(LocalDateTime.now()).build());

        playlistSongRepository.save(PlaylistSong.builder().id("ps_14").playlistId("pl_classical_harmony").songId("sng_starlight").position(1).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_15").playlistId("pl_classical_harmony").songId("sng_the_entertainer").position(2).addedAt(LocalDateTime.now()).build());
        playlistSongRepository.save(PlaylistSong.builder().id("ps_16").playlistId("pl_classical_harmony").songId("sng_tiny_fugue").position(3).addedAt(LocalDateTime.now()).build());

        // 10. Favorites
        favoriteRepository.save(Favorite.builder().id("fav_1").userId("usr_user").songId("sng_neon_drive").createdAt(LocalDateTime.now()).build());
        favoriteRepository.save(Favorite.builder().id("fav_2").userId("usr_user").songId("sng_lofi_rain").createdAt(LocalDateTime.now()).build());
        favoriteRepository.save(Favorite.builder().id("fav_3").userId("usr_user").songId("sng_summer_breeze").createdAt(LocalDateTime.now()).build());
        favoriteRepository.save(Favorite.builder().id("fav_4").userId("usr_user").songId("sng_thunder_strike").createdAt(LocalDateTime.now()).build());

        // 11. Listening History
        listeningHistoryRepository.save(ListeningHistory.builder().id("hist_1").userId("usr_user").songId("sng_neon_drive").playedAt(LocalDateTime.now()).build());
        listeningHistoryRepository.save(ListeningHistory.builder().id("hist_2").userId("usr_user").songId("sng_party_lights").playedAt(LocalDateTime.now()).build());
        listeningHistoryRepository.save(ListeningHistory.builder().id("hist_3").userId("usr_user").songId("sng_cozy_coffee").playedAt(LocalDateTime.now()).build());

        System.out.println("✅ PLAYX Database seeded successfully!");
    }
}
