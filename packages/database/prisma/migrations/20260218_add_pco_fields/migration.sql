-- ============================================================================
-- Migration: add_pco_fields_to_betting_pool
-- Date: 2026-02-18
-- Feature: Psychic Consensus Oracle (PCO) — Innovation Cycle 48
-- ============================================================================
--
-- Adds two optional fields to betting_pools:
--   pcoContractAddress — address of the deployed PsychicConsensusOracle contract
--   pcoPoolId          — on-chain pool ID (BigInt as varchar for precision safety)
--
-- When both fields are set, the UI renders PsychicConsensusPanel instead of
-- the legacy BettingInterface. Existing pools are unaffected (NULL = legacy).

ALTER TABLE "betting_pools"
  ADD COLUMN IF NOT EXISTS "pcoContractAddress" VARCHAR(42),
  ADD COLUMN IF NOT EXISTS "pcoPoolId"          VARCHAR(78);

-- Optional: index for lookups by PCO address
CREATE INDEX IF NOT EXISTS "betting_pools_pco_address_idx"
  ON "betting_pools" ("pcoContractAddress")
  WHERE "pcoContractAddress" IS NOT NULL;

COMMENT ON COLUMN "betting_pools"."pcoContractAddress" IS
  'Address of the PsychicConsensusOracle contract for this pool (Cycle 48). NULL = legacy pool.';

COMMENT ON COLUMN "betting_pools"."pcoPoolId" IS
  'On-chain pool ID as string (BigInt compatible). NULL = legacy pool.';
