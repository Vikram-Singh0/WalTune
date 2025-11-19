module waltune::song_registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use std::string::String;

    /// Song metadata stored on-chain
    /// The actual audio file is stored on Walrus, referenced by walrus_blob_id
    struct Song has key, store {
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
    struct SongRegistry has key {
        id: UID,
        songs: Table<address, vector<address>>, // artist_address -> [song_ids]
        total_songs: u64,
    }

    /// Initialize the song registry (call once at deployment)
    fun init(ctx: &mut TxContext) {
        let registry = SongRegistry {
            id: object::new(ctx),
            songs: table::new(ctx),
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

        let song = Song {
            id: object::new(ctx),
            title,
            artist_id,
            artist_name,
            walrus_blob_id,
            price_per_play,
            duration,
            genre,
            cover_image,
            total_plays: 0,
            uploaded_at: tx_context::epoch(ctx),
        };

        let song_address = object::uid_to_address(&song.id);

        // Add to registry
        if (!table::contains(&registry.songs, artist_id)) {
            table::add(&mut registry.songs, artist_id, vector::empty<address>());
        };
        
        let artist_songs = table::borrow_mut(&mut registry.songs, artist_id);
        vector::push_back(artist_songs, song_address);
        
        registry.total_songs = registry.total_songs + 1;

        // Transfer song object to artist
        transfer::transfer(song, artist_id);
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
