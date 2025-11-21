module waltune::artist {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;

    /// Artist profile stored on-chain
    public struct Artist has key, store {
        id: UID,
        wallet_address: address,
        name: String,
        bio: String,
        created_at: u64,
        total_songs: u64,
        total_earnings: u64,
    }

    /// Global registry of all artists
    public struct ArtistRegistry has key {
        id: UID,
        total_artists: u64,
    }

    /// Initialize the artist registry (call once at deployment)
    fun init(ctx: &mut TxContext) {
        let registry = ArtistRegistry {
            id: object::new(ctx),
            total_artists: 0,
        };
        transfer::share_object(registry);
    }

    /// Register a new artist
    public entry fun register(
        registry: &mut ArtistRegistry,
        name: String,
        bio: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let artist = Artist {
            id: object::new(ctx),
            wallet_address: sender,
            name,
            bio,
            created_at: tx_context::epoch(ctx),
            total_songs: 0,
            total_earnings: 0,
        };

        registry.total_artists = registry.total_artists + 1;

        // Transfer artist object to sender
        transfer::transfer(artist, sender);
    }

    /// Update artist bio
    public entry fun update_bio(
        artist: &mut Artist,
        new_bio: String,
        ctx: &mut TxContext
    ) {
        assert!(artist.wallet_address == tx_context::sender(ctx), 1);
        artist.bio = new_bio;
    }

    /// Increment artist song count (called by SongRegistry)
    public(package) fun increment_songs(artist: &mut Artist) {
        artist.total_songs = artist.total_songs + 1;
    }

    /// Add earnings to artist (called by PaymentRouter)
    public(package) fun add_earnings(artist: &mut Artist, amount: u64) {
        artist.total_earnings = artist.total_earnings + amount;
    }

    /// Getters
    public fun get_name(artist: &Artist): String {
        artist.name
    }

    public fun get_total_songs(artist: &Artist): u64 {
        artist.total_songs
    }

    public fun get_total_earnings(artist: &Artist): u64 {
        artist.total_earnings
    }
}
