# Walrus CLI Setup Guide

## ✅ Clean Architecture

```
Frontend → Backend API → Walrus CLI → Walrus Network
                         ↑ Simple & Reliable
```

## 📦 Install Walrus CLI

### macOS (x86_64):
```bash
curl -fLJO https://github.com/MystenLabs/walrus-docs/releases/download/latest/walrus-testnet-latest-macos-x86_64
chmod +x walrus-testnet-latest-macos-x86_64
sudo mv walrus-testnet-latest-macos-x86_64 /usr/local/bin/walrus
```

### macOS (ARM64/M1/M2):
```bash
curl -fLJO https://github.com/MystenLabs/walrus-docs/releases/download/latest/walrus-testnet-latest-macos-arm64
chmod +x walrus-testnet-latest-macos-arm64
sudo mv walrus-testnet-latest-macos-arm64 /usr/local/bin/walrus
```

### Linux:
```bash
curl -fLJO https://github.com/MystenLabs/walrus-docs/releases/download/latest/walrus-testnet-latest-ubuntu-x86_64
chmod +x walrus-testnet-latest-ubuntu-x86_64
sudo mv walrus-testnet-latest-ubuntu-x86_64 /usr/local/bin/walrus
```

## 🔧 Configure Walrus

```bash
# Initialize Walrus config
walrus --network testnet

# Test upload
echo "test" > test.txt
walrus store test.txt --epochs 5
rm test.txt
```

## ✅ Verify Installation

```bash
# Should show version
walrus --version

# Should show help
walrus --help
```

## 🚀 How It Works

1. **Frontend uploads file** → Sends to backend API
2. **Backend receives file** → Saves to temp location
3. **Backend calls Walrus CLI** → `walrus store file.mp3 --epochs 5`
4. **Walrus returns blob ID** → Backend parses and returns to frontend
5. **Frontend registers on Sui** → Uses blob ID in smart contract

## 📋 Backend Implementation

The backend now uses:
- `walrusClient.uploadFile()` - Calls Walrus CLI via `child_process`
- Clean temp file management
- Proper error handling
- Simple and reliable!

## 🔍 Troubleshooting

### "walrus: command not found"
- CLI not installed or not in PATH
- Run installation steps above

### "Failed to upload"
- Check Walrus CLI works: `walrus store test.txt`
- Check network: `walrus --network testnet`
- Check Walrus testnet status

### "Permission denied"
- Make CLI executable: `chmod +x /usr/local/bin/walrus`
- Or use `sudo` for moving to `/usr/local/bin`

## 🎯 Advantages of CLI Approach

✅ **Simple** - Just exec CLI command  
✅ **Reliable** - Official tool from Mysten Labs  
✅ **No SDK issues** - No complex wallet integration  
✅ **Clean** - No HTTP endpoint dependencies  
✅ **Tested** - CLI is well-tested by community  

## 📝 Notes

- Backend needs Walrus CLI installed
- CLI handles all Walrus complexity
- No wallet/WAL tokens needed on backend
- Only user needs wallet for Sui transactions
