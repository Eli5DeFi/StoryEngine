# ✅ Contracts Redeployed - February 16, 2026 16:08 GMT+7

## Status: Both Contracts Live Again

After Anvil restart, contracts have been redeployed to the **exact same addresses**.

---

## 📋 Deployed Contracts

### MockUSDC ✅
```
Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Transaction: 0x09b089d8bcd8240db860340415e44c738d88fcae59a5c131ee259e20509fbf2b
```

### CombinatorialBettingPool ✅
```
Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Transaction: 0x166142ed7b57e4cc44463dd44d57600bbeeb784786b2f5308654ca54104e60f3
```

---

## 🎯 Ready to Test

All commands from `DEPLOYMENT_COMPLETE_FEB_16.md` still work with these addresses.

**Quick start:**

1. **Schedule a chapter:**
```bash
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "scheduleChapter(uint256,uint256)" \
  1 $(($(date +%s) + 172800)) \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

2. **Create an outcome:**
```bash
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "createOutcome(uint8,string,uint256,uint256)" \
  0 "Aria survives" 1 1 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

3. **Approve USDC:**
```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "approve(address,uint256)" \
  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 1000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

4. **Place a bet:**
```bash
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "placeCombiBet(uint256[],uint256,uint8,uint256)" \
  "[1]" 100000000 0 0 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 📊 Status

| Component | Status | Address |
|-----------|--------|---------|
| Anvil | ✅ Running | http://127.0.0.1:8545 |
| MockUSDC | ✅ Deployed | 0x5FbDB...0aa3 |
| BettingPool | ✅ Deployed | 0xe7f17...0512 |
| Paused | ❌ No | Ready for betting |

---

**Created:** February 16, 2026 16:08 GMT+7  
**Deployment Time:** < 1 minute  
**Status:** Ready for testing
