import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { PACKAGE_ID, ARTIST_REGISTRY_ID, SONG_REGISTRY_ID } from "./sui-config";

export interface RegisterArtistParams {
  name: string;
  bio: string;
}

export interface RegisterSongParams {
  title: string;
  artistId: string;
  artistName: string;
  walrusBlobId: string;
  pricePerPlay: number;
  duration: number;
  genre: string;
  coverImage: string;
}

/**
 * Create transaction to register a new artist on Sui blockchain
 */
export function createRegisterArtistTx(
  params: RegisterArtistParams
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::artist::register`,
    arguments: [
      tx.object(ARTIST_REGISTRY_ID),
      tx.pure.string(params.name),
      tx.pure.string(params.bio),
    ],
  });

  return tx;
}

/**
 * Create transaction to register a new song on Sui blockchain
 */
export function createRegisterSongTx(params: RegisterSongParams): Transaction {
  const tx = new Transaction();

  // Convert price from SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const priceInMist = Math.floor(params.pricePerPlay * 1_000_000_000);

  tx.moveCall({
    target: `${PACKAGE_ID}::song_registry::register_song`,
    arguments: [
      tx.object(SONG_REGISTRY_ID),
      tx.pure.string(params.title),
      tx.pure.address(params.artistId),
      tx.pure.string(params.artistName),
      tx.pure.string(params.walrusBlobId),
      tx.pure.u64(priceInMist),
      tx.pure.u64(params.duration),
      tx.pure.string(params.genre || "Unknown"),
      tx.pure.string(params.coverImage || ""),
    ],
  });

  return tx;
}

/**
 * Create transaction to record a song play
 */
export function createRecordPlayTx(songObjectId: string): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::song_registry::record_play`,
    arguments: [tx.object(songObjectId)],
  });

  return tx;
}

/**
 * Create transaction to pay for playing a song
 */
export function createPayForPlayTx(
  songObjectId: string,
  paymentCoinId: string
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::payment::pay_for_play`,
    arguments: [tx.object(songObjectId), tx.object(paymentCoinId)],
  });

  return tx;
}

/**
 * Query artist registry to get artist info
 */
export async function getArtistRegistry(client: SuiClient) {
  try {
    const result = await client.getObject({
      id: ARTIST_REGISTRY_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Failed to fetch artist registry:", error);
    throw error;
  }
}

/**
 * Query song registry to get song info
 */
export async function getSongRegistry(client: SuiClient) {
  try {
    const result = await client.getObject({
      id: SONG_REGISTRY_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Failed to fetch song registry:", error);
    throw error;
  }
}

/**
 * Get all objects owned by an address (e.g., artist's songs)
 */
export async function getOwnedObjects(client: SuiClient, owner: string) {
  try {
    const result = await client.getOwnedObjects({
      owner,
      options: {
        showContent: true,
        showType: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Failed to fetch owned objects:", error);
    throw error;
  }
}
