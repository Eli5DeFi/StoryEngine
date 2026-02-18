# Prophecy NFT System — Documentation

**Innovation Cycle #49 — "The Living Cosmos"**  
**Implemented:** February 18, 2026  
**Status:** ✅ Production-Ready (PR pending review)

---

## Overview

The Prophecy NFT system transforms story participation from ephemeral betting into **collectible on-chain history**. The AI generates cryptic prophecies before each chapter resolves. Readers mint them as NFTs. After the chapter concludes, each prophecy transforms based on how accurately it foretold the narrative.

```
Pre-chapter                 During chapter              Post-resolution
────────────                ──────────────              ───────────────
AI generates                Readers mint:               Oracle evaluates:
10-20 cryptic               5 $FORGE each               
prophecies                  (4.5 with pack)             ★ Fulfilled → Golden (10×)
                            Max 100/prophecy            ◈ Echoed → Silver (3×)
Sealed on-chain                                         ▪ Void Relic → Still cool
```

---

## Architecture

### Database Models

```prisma
model Prophecy {
  id              String         // CUID
  chapterId       String         // Chapter reference
  contentHash     String         // keccak256(text) — sealed commitment
  text            String?        // Revealed after minting window closes
  teaser          String         // 2-4 words shown pre-reveal
  status          ProphecyStatus // PENDING | FULFILLED | ECHOED | UNFULFILLED
  mintedCount     Int            // Current mint count
  maxSupply       Int            // Always 100
  // ...
  mints           ProphecyMint[]
}

model ProphecyMint {
  id            String
  prophecyId    String
  userId        String
  walletAddress String
  mintOrder     Int         // 1-100 (lower = more prestige)
  forgePaid     Float       // 5.0 single / 4.5 oracle pack
}
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/prophecies` | GET | All prophecies (filterable by status) |
| `/api/prophecies` | POST | Seed prophecies for a chapter (oracle only) |
| `/api/prophecies/[chapterId]` | GET | Chapter-specific gallery + summary |
| `/api/prophecies/[chapterId]` | PATCH | Fulfill prophecies after chapter resolution |
| `/api/prophecies/mint` | POST | Mint single or oracle pack |
| `/api/prophecies/mint` | GET | User's mint history by wallet |
| `/api/prophecies/leaderboard` | GET | Oracle leaderboard |

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProphecyCard` | `components/prophecy/` | Individual NFT display with transform animation |
| `ProphecyGallery` | `components/prophecy/` | Chapter gallery with filter/sort |
| `ProphecyMintModal` | `components/prophecy/` | Mint flow (single + oracle pack) |
| `ProphecyRarityBadge` | `components/prophecy/` | Rarity tier indicator |
| `ProphecyBanner` | `components/prophecy/` | Compact teaser for story sidebar |
| `OracleLeaderboard` | `components/prophecy/` | Top collectors ranked by fulfilled count |

### Pages

| Route | Description |
|-------|-------------|
| `/prophecies` | Global gallery with leaderboard sidebar |
| `/prophecies/[chapterId]` | Chapter-specific gallery with "My Mints" |

---

## Rarity System

| Status | Mint Order | Rarity | Value Multiplier |
|--------|-----------|--------|-----------------|
| FULFILLED | 1-5 | MYTHIC | 20× |
| FULFILLED | 6-100 | LEGENDARY | 10× |
| ECHOED | 1-10 | RARE | 4× |
| ECHOED | 11-100 | UNCOMMON | 3× |
| UNFULFILLED | any | COMMON | 1× (face value) |
| PENDING | any | SEALED | — |

---

## Oracle Ranks (Leaderboard)

| Fulfilled Prophecies | Rank |
|---------------------|------|
| 0-2 | Novice |
| 3-9 | Seer |
| 10-24 | Oracle |
| 25-49 | Prophet |
| 50+ | Void Eye |

---

## Oracle Pack Discount

Mint 2-20 prophecies at once for a **10% discount** (4.5 $FORGE each).
- Triggered in the `ProphecyMintModal` when `relatedProphecies.length >= 1`
- API automatically applies discount when `prophecyIds[]` has length > 1

---

## Seeding Prophecies (Admin)

```bash
# Seed 15 prophecies for chapter XYZ
curl -X POST /api/prophecies \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "chapter-xyz-id",
    "prophecies": [
      {
        "teaser": "When two suns align...",
        "contentHash": "0xabc123...",
        "pendingURI": "ipfs://QmPending...",
        "targetEvent": "House Valdris betrayal",
        "relevanceScore": 0.85,
        "artTheme": "shadow"
      }
    ]
  }'
```

---

## Fulfillment (Post-Chapter)

```bash
# After chapter resolves, set outcomes for all prophecies
PATCH /api/prophecies/[chapterId]
{
  "outcomes": [
    { "prophecyId": "...", "status": "FULFILLED", "metadataURI": "ipfs://..." },
    { "prophecyId": "...", "status": "ECHOED",    "metadataURI": "ipfs://..." },
    { "prophecyId": "...", "status": "UNFULFILLED" }
  ]
}
```

---

## Database Migration

```bash
cd packages/database

# Apply migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name prophecy_nft
```

---

## Revenue Model (from Innovation Cycle #49)

| Period | Revenue |
|--------|---------|
| Year 1 | $61K |
| Year 5 | $1.82M |

**Sources:**
- Primary mint fees (5 $FORGE × volume)
- Oracle Pack premium (discount drives volume)
- 5% royalty on all secondary sales (OpenSea/Blur)
- Leaderboard prestige → organic word-of-mouth

---

## Future Enhancements (Roadmap)

1. **On-chain ERC-721 deployment** — `packages/prophecy-nft/src/ProphecyNFT.sol` ready for Base Sepolia
2. **IPFS art generation** — DALL-E generated art per prophecy + fulfillment state
3. **Secondary market** — OpenSea/Blur listing integration
4. **Cross-story prophecies** — Prophecies that reference events across multiple story arcs
5. **Prophecy trading** — In-app P2P marketplace before chapter resolution
