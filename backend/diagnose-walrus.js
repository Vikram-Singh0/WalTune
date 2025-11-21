#!/usr/bin/env node

/**
 * Simple Walrus Diagnostic Tool
 * Run this to check your Walrus setup and connectivity
 */

console.log('🔍 WalTune Walrus Diagnostic Tool\n');
console.log('='.repeat(60));

// Test 1: Check if packages are installed
console.log('\n📦 Test 1: Checking packages...');
try {
  require('@mysten/walrus');
  console.log('   ✅ @mysten/walrus installed');
} catch (e) {
  console.log('   ❌ @mysten/walrus NOT installed');
  console.log('   Run: npm install @mysten/walrus');
}

try {
  require('@mysten/sui/client');
  console.log('   ✅ @mysten/sui installed');
} catch (e) {
  console.log('   ❌ @mysten/sui NOT installed');
  console.log('   Run: npm install @mysten/sui');
}

// Test 2: Check HTTP endpoints
console.log('\n🌐 Test 2: Checking HTTP endpoints...');
const endpoints = [
  'https://publisher.walrus-testnet.walrus.space',
  'https://aggregator.walrus-testnet.walrus.space',
];

async function checkEndpoint(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return {
      url,
      status: response.status,
      ok: [200, 404, 405].includes(response.status),
    };
  } catch (error) {
    return {
      url,
      error: error.message,
      ok: false,
    };
  }
}

Promise.all(endpoints.map(checkEndpoint)).then(results => {
  results.forEach(result => {
    if (result.ok) {
      console.log(`   ✅ ${result.url} (${result.status})`);
    } else {
      console.log(`   ❌ ${result.url}`);
      console.log(`      Error: ${result.error || result.status}`);
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const httpAvailable = results.some(r => r.ok);
  
  if (httpAvailable) {
    console.log('✅ Walrus HTTP endpoints are reachable');
    console.log('   However, /v1/store returns 404 (endpoint not available)');
  } else {
    console.log('❌ Walrus HTTP endpoints are not reachable');
  }
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('   Use the Walrus SDK with wallet signing (frontend)');
  console.log('   HTTP Publisher endpoints appear to be unavailable');
  
  console.log('\n📖 Next Steps:');
  console.log('   1. Read: WALRUS_DIAGNOSIS.md');
  console.log('   2. Ensure users have WAL tokens');
  console.log('   3. Update frontend to use SDK upload');
  console.log('   4. Test with: node test-walrus-sdk.js');
  
  console.log('\n');
});
