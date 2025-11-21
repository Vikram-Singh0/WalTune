#!/bin/bash

# WalTune Walrus Quick Test Script
# Run this anytime to check Walrus status

echo "🔍 WalTune Walrus Quick Check"
echo "=============================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Run this from the backend directory!"
    echo "   cd backend && ./quick-test-walrus.sh"
    exit 1
fi

echo "📦 Checking packages..."
if npm list @mysten/walrus >/dev/null 2>&1; then
    echo "   ✅ @mysten/walrus installed"
else
    echo "   ❌ @mysten/walrus NOT installed"
fi

if npm list @mysten/sui >/dev/null 2>&1; then
    echo "   ✅ @mysten/sui installed"
else
    echo "   ❌ @mysten/sui NOT installed"
fi

echo ""
echo "🌐 Testing endpoints..."

# Test publisher
PUBLISHER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://publisher.walrus-testnet.walrus.space)
if [ "$PUBLISHER_STATUS" = "404" ] || [ "$PUBLISHER_STATUS" = "200" ]; then
    echo "   ✅ Publisher reachable ($PUBLISHER_STATUS)"
else
    echo "   ❌ Publisher unreachable ($PUBLISHER_STATUS)"
fi

# Test aggregator
AGGREGATOR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://aggregator.walrus-testnet.walrus.space)
if [ "$AGGREGATOR_STATUS" = "404" ] || [ "$AGGREGATOR_STATUS" = "200" ]; then
    echo "   ✅ Aggregator reachable ($AGGREGATOR_STATUS)"
else
    echo "   ❌ Aggregator unreachable ($AGGREGATOR_STATUS)"
fi

echo ""
echo "📝 Status:"
echo "   - HTTP Publisher /v1/store: ❌ Returns 404 (not available)"
echo "   - Recommended: Use Walrus SDK with user wallet"
echo ""
echo "📖 Read guides:"
echo "   - WALRUS_FIX_GUIDE.md (implementation steps)"
echo "   - WALRUS_DIAGNOSIS.md (technical details)"
echo ""
echo "🧪 Run detailed tests:"
echo "   node diagnose-walrus.js     (quick check)"
echo "   node test-walrus-sdk.js     (SDK test)"
echo "   node test-walrus.js         (HTTP test)"
echo ""
