module waltune::payment {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use waltune::song_registry::{Self, Song};

    /// Record a play and handle payment
    /// Transfers SUI from listener to artist
    public entry fun pay_for_play(
        song: &mut Song,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let price = song_registry::get_price_per_play(song);
        
        // Verify payment amount
        assert!(coin::value(&payment) >= price, 0);

        // Increment play count
        song_registry::record_play(song, ctx);

        // Transfer payment to artist
        let artist_address = song_registry::get_artist_id(song);
        transfer::public_transfer(payment, artist_address);

        // TODO: Add event emission for play tracking
        // TODO: Integrate with x402 for micropayments
    }

    /// Split payment for future revenue sharing
    /// (e.g., platform fee, artist share)
    public fun split_payment(
        mut payment: Coin<SUI>,
        artist_share_percentage: u64,
        artist_address: address,
        platform_address: address,
        ctx: &mut TxContext
    ) {
        let total_amount = coin::value(&payment);
        let artist_amount = (total_amount * artist_share_percentage) / 100;

        // Split the coin
        let artist_coin = coin::split(&mut payment, artist_amount, ctx);
        
        // Transfer to artist
        transfer::public_transfer(artist_coin, artist_address);
        
        // Transfer remainder to platform
        transfer::public_transfer(payment, platform_address);
    }
}
