#!/usr/bin/env node

/**
 * Walrus SDK Test Script
 * Tests uploading files using the official @mysten/walrus SDK
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { WalrusClient, walrus } from '@mysten/walrus';

async function main() {
  console.log('🚀 Walrus SDK Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create Sui client with Walrus extension
    console.log('\n📡 Step 1: Creating Sui client with Walrus extension...');
    
    const suiClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });
    
    // Create walrus client directly
    const walrusClient = new WalrusClient({
      client: suiClient,
      network: 'testnet',
    });
    console.log('✅ Walrus client created');
    
    // Step 2: Create or load keypair (for testing, generate a new one)
    console.log('\n🔑 Step 2: Setting up keypair...');
    const keypair = new Ed25519Keypair();
    const address = keypair.getPublicKey().toSuiAddress();
    console.log(`   Address: ${address}`);
    console.log('   ⚠️  Note: This is a new address with no balance');
    console.log('   For production, you need an address with SUI and WAL tokens');
    
    // Step 3: Create test data
    console.log('\n📝 Step 3: Creating test data...');
    const testContent = `
Test file for WalTune
Generated at: ${new Date().toISOString()}
Random data: ${Math.random().toString(36).substring(7)}
${'='.repeat(80)}
    `.repeat(10);
    
    const blob = new TextEncoder().encode(testContent);
    console.log(`   Size: ${(blob.length / 1024).toFixed(2)} KB`);
    
    // Step 4: Attempt to write blob
    console.log('\n📤 Step 4: Attempting to write blob to Walrus...');
    console.log('   (This will fail without proper balance)');
    
    try {
      const result = await walrusClient.writeBlob({
        blob: blob,
        deletable: true,
        epochs: 3,
        signer: keypair,
      });
      
      console.log('\n✅ SUCCESS! Blob uploaded!');
      console.log(`   Blob ID: ${result.blobId}`);
      console.log(`   Full response:`, JSON.stringify(result, null, 2));
      
      // Test reading the blob
      console.log('\n📥 Testing blob retrieval...');
      const retrievedBlob = await walrusClient.readBlob({ blobId: result.blobId });
      console.log(`✅ Retrieved ${retrievedBlob.length} bytes`);
      
    } catch (uploadError) {
      console.log('\n⚠️  Upload failed (expected without balance):');
      console.log(`   ${uploadError.message}`);
      
      if (uploadError.message.includes('balance') || uploadError.message.includes('insufficient')) {
        console.log('\n💡 This is normal! To use the Walrus SDK you need:');
        console.log('   1. A wallet with SUI tokens (for gas)');
        console.log('   2. WAL tokens (for storage fees)');
        console.log('   3. Request from faucet: https://docs.walrus.site/usage/setup.html');
      }
    }
    
    // Show alternative approach
    console.log('\n' + '='.repeat(60));
    console.log('ALTERNATIVE: HTTP Publisher/Aggregator Approach');
    console.log('='.repeat(60));
    console.log('\nFor backend usage without wallet, use HTTP endpoints:');
    console.log('Publisher: https://publisher.walrus-testnet.walrus.space');
    console.log('Aggregator: https://aggregator.walrus-testnet.walrus.space');
    console.log('\nHowever, these might not be available in all testnet phases.');
    
    // Test HTTP approach as fallback
    console.log('\n📤 Testing HTTP publisher endpoint...');
    try {
      const publisherUrl = 'https://publisher.walrus-testnet.walrus.space';
      const response = await fetch(`${publisherUrl}/v1/store?epochs=5`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const blobId = data.newlyCreated?.blobObject?.blobId || data.alreadyCertified?.blobId;
        console.log(`   ✅ HTTP upload successful! Blob ID: ${blobId}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ HTTP upload failed: ${errorText.substring(0, 200)}`);
      }
    } catch (httpError) {
      console.log(`   ❌ HTTP endpoint not available: ${httpError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(60));
    console.log('For WalTune backend:');
    console.log('1. Use the Walrus SDK approach with a funded wallet');
    console.log('2. Store wallet private key in .env file');
    console.log('3. Fund the wallet with SUI and WAL tokens');
    console.log('4. Use client.writeBlob() for uploads');
    console.log('5. Use aggregator URLs for streaming');
    console.log('\nAlternatively, for frontend-only uploads:');
    console.log('- Users sign transactions with their own wallets');
    console.log('- No backend wallet needed');
    console.log('- Users pay for their own storage');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    console.error('\nStack:', error.stack);
  }
}

main().catch(console.error);
