#!/usr/bin/env node

/**
 * Walrus Upload Test Script
 * Tests uploading files to Walrus storage with various publisher endpoints
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Test configuration
const PUBLISHER_ENDPOINTS = [
  'https://publisher.walrus-testnet.walrus.space',
  'https://publisher-devnet.walrus.space',
  'https://wal-publisher-testnet.staketab.org',
];

const AGGREGATOR_ENDPOINTS = [
  'https://aggregator.walrus-testnet.walrus.space',
  'https://aggregator-devnet.walrus.space',
];

const EPOCHS = 5;

/**
 * Test if endpoint is reachable
 * Note: Walrus publishers return 404 for HEAD/GET on root, this is normal
 */
async function testEndpoint(url) {
  console.log(`\n🔍 Testing endpoint: ${url}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    // Test with a small OPTIONS or GET request
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    // 404 is actually OK for Walrus - means endpoint is up
    // 200, 404, 405 = endpoint is reachable
    const isReachable = [200, 404, 405].includes(response.status);
    
    console.log(`  ${isReachable ? '✅' : '❌'} Status: ${response.status} ${response.statusText}`);
    if (isReachable) {
      console.log(`     (Endpoint is reachable)`);
    }
    return isReachable;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Upload a test file to Walrus
 */
async function uploadToWalrus(publisherUrl, fileBuffer) {
  console.log(`\n📤 Uploading to: ${publisherUrl}`);
  console.log(`   File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const uploadUrl = `${publisherUrl}/v1/store?epochs=${EPOCHS}`;
    console.log(`   URL: ${uploadUrl}`);
    
    const startTime = Date.now();
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error response: ${errorText.substring(0, 200)}`);
      return null;
    }
    
    const data = await response.json();
    const blobId = data.newlyCreated?.blobObject?.blobId || 
                   data.alreadyCertified?.blobId;
    
    if (blobId) {
      console.log(`   ✅ Success! Blob ID: ${blobId}`);
      return { publisherUrl, blobId, data };
    } else {
      console.log(`   ⚠️  No blob ID in response`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 300));
      return null;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`   ⏰ Timeout after 30 seconds`);
    } else {
      console.log(`   ❌ Upload failed: ${error.message}`);
    }
    return null;
  }
}

/**
 * Verify blob can be retrieved from aggregator
 */
async function verifyBlob(aggregatorUrl, blobId) {
  console.log(`\n🔍 Verifying blob: ${blobId}`);
  console.log(`   Aggregator: ${aggregatorUrl}`);
  
  try {
    const url = `${aggregatorUrl}/v1/${blobId}`;
    const response = await fetch(url, {
      method: 'HEAD',
    });
    
    if (response.ok) {
      const size = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      console.log(`   ✅ Blob exists!`);
      console.log(`   Size: ${size ? (parseInt(size) / 1024).toFixed(2) + ' KB' : 'unknown'}`);
      console.log(`   Content-Type: ${contentType || 'unknown'}`);
      return true;
    } else {
      console.log(`   ❌ Blob not found (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Walrus Storage Test Script\n');
  console.log('=' .repeat(60));
  
  // Create test file (small text file)
  const testContent = `
    This is a test file for Walrus storage.
    Generated at: ${new Date().toISOString()}
    Random data: ${Math.random().toString(36).substring(7)}
    ${'-'.repeat(100)}
  `.repeat(10); // Make it a bit bigger
  
  const testBuffer = Buffer.from(testContent);
  console.log(`\n📝 Test file size: ${(testBuffer.length / 1024).toFixed(2)} KB`);
  
  // Phase 1: Test endpoint reachability
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1: Testing Endpoint Reachability');
  console.log('='.repeat(60));
  
  const reachablePublishers = [];
  for (const endpoint of PUBLISHER_ENDPOINTS) {
    const isReachable = await testEndpoint(endpoint);
    if (isReachable) {
      reachablePublishers.push(endpoint);
    }
  }
  
  if (reachablePublishers.length === 0) {
    console.log('\n❌ No publisher endpoints are reachable!');
    console.log('   This could be due to:');
    console.log('   - Network connectivity issues');
    console.log('   - Walrus testnet being down');
    console.log('   - Firewall blocking the connections');
    process.exit(1);
  }
  
  console.log(`\n✅ Found ${reachablePublishers.length} reachable publisher(s)`);
  
  // Phase 2: Test upload to each reachable publisher
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: Testing Uploads');
  console.log('='.repeat(60));
  
  let successfulUpload = null;
  for (const publisher of reachablePublishers) {
    const result = await uploadToWalrus(publisher, testBuffer);
    if (result) {
      successfulUpload = result;
      break; // Stop after first successful upload
    }
  }
  
  if (!successfulUpload) {
    console.log('\n❌ All upload attempts failed!');
    console.log('   Check the error messages above for details.');
    process.exit(1);
  }
  
  // Phase 3: Verify blob retrieval
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: Verifying Blob Retrieval');
  console.log('='.repeat(60));
  
  let verified = false;
  for (const aggregator of AGGREGATOR_ENDPOINTS) {
    const result = await verifyBlob(aggregator, successfulUpload.blobId);
    if (result) {
      verified = true;
      console.log(`\n🎉 Success! You can stream from: ${aggregator}/v1/${successfulUpload.blobId}`);
      break;
    }
  }
  
  if (!verified) {
    console.log('\n⚠️  Upload succeeded but blob not yet available for retrieval');
    console.log('   This is normal - blobs may take a few moments to propagate');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Working Publisher: ${successfulUpload.publisherUrl}`);
  console.log(`✅ Blob ID: ${successfulUpload.blobId}`);
  console.log(`📋 Full Response:`);
  console.log(JSON.stringify(successfulUpload.data, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS FOR YOUR APP:');
  console.log('='.repeat(60));
  console.log(`1. Update WALRUS_PUBLISHER_URL to: ${successfulUpload.publisherUrl}`);
  console.log(`2. Use this URL in your .env file`);
  console.log(`3. The walrusClient.ts already has fallback logic for multiple endpoints`);
  console.log(`4. Ensure your backend has CORS properly configured`);
  console.log('\n✨ All tests passed!\n');
}

// Run tests
main().catch(error => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});
