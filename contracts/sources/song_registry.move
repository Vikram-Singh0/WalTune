module waltune::song_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::String;

    /// Song metadata stored on-chain
    /// The actual audio file is stored on Walrus, referenced by walrus_blob_id
    public struct Song has key, store {
        id: UID,
        title: String,
        artist_id: address,
        artist_name: String,
        walrus_blob_id: String,  // ✅ Critical: Link to Walrus storage
        price_per_play: u64,
        duration: u64,
        genre: String,
        cover_image: String,
        total_plays: u64,
        uploaded_at: u64,
    }

    /// Global registry of all songs
    public struct SongRegistry has key {
        id: UID,
        total_songs: u64,
    }

    /// Event emitted when a new song is registered
    public struct SongRegistered has copy, drop {
        song_id: address,
        title: String,
        artist_id: address,
        artist_name: String,
        walrus_blob_id: String,
        price_per_play: u64,
        duration: u64,
        genre: String,
        uploaded_at: u64,
    }

    /// Initialize the song registry (call once at deployment)
    fun init(ctx: &mut TxContext) {
        let registry = SongRegistry {
            id: object::new(ctx),
            total_songs: 0,
        };
        transfer::share_object(registry);
    }

    /// Register a new song on-chain
    /// This stores the metadata + Walrus blob ID
    public entry fun register_song(
        registry: &mut SongRegistry,
        title: String,
        artist_id: address,
        artist_name: String,
        walrus_blob_id: String,  // ✅ blobId from Walrus upload
        price_per_play: u64,
        duration: u64,
        genre: String,
        cover_image: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == artist_id, 0); // Only artist can upload their songs

        let song_uid = object::new(ctx);
        let song_id = object::uid_to_address(&song_uid);
        let uploaded_at = tx_context::epoch(ctx);

        let song = Song {
            id: song_uid,
            title,
            artist_id,
            artist_name,
            walrus_blob_id,
            price_per_play,
            duration,
            genre,
            cover_image,
            total_plays: 0,
            uploaded_at,
        };

        registry.total_songs = registry.total_songs + 1;

        // Emit event so the song can be discovered
        event::emit(SongRegistered {
            song_id,
            title: song.title,
            artist_id: song.artist_id,
            artist_name: song.artist_name,
            walrus_blob_id: song.walrus_blob_id,
            price_per_play: song.price_per_play,
            duration: song.duration,
            genre: song.genre,
            uploaded_at: song.uploaded_at,
        });

        // 🔥 KEY CHANGE: Make song publicly accessible (like Spotify)
        // Songs are now shared objects that everyone can read and play
        transfer::share_object(song);
    }

    /// Record a play (increment play count)
    public entry fun record_play(
        song: &mut Song,
        _ctx: &mut TxContext
    ) {
        song.total_plays = song.total_plays + 1;
    }

    /// Getters
    public fun get_title(song: &Song): String {
        song.title
    }

    public fun get_walrus_blob_id(song: &Song): String {
        song.walrus_blob_id
    }

    public fun get_price_per_play(song: &Song): u64 {
        song.price_per_play
    }

    public fun get_total_plays(song: &Song): u64 {
        song.total_plays
    }

    public fun get_artist_id(song: &Song): address {
        song.artist_id
    }
}
