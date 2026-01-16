# Stripe Sync Scripts

Scripts to synchronize Stripe products and prices with your codebase.

## Prerequisites

Ensure your `.env` file has:
```bash
STRIPE_SECRET_KEY=sk_test_...
```

## Scripts

### 1. Sync Stripe Product (`sync-stripe-product.ts`)

Creates or updates the Autlify product in Stripe and writes the product ID to `.env`.

**Usage:**
```bash
# Dry run (preview changes without making them)
bun scripts/sync-stripe-product.ts --dry-run

# Execute changes
bun scripts/sync-stripe-product.ts
```

**What it does:**
- Searches for existing "Autlify" product in Stripe
- Creates new product if not found
- Updates product if found
- Writes `NEXT_AUTLIFY_PRODUCT_ID` to `.env`

---

### 2. Sync Stripe Prices (`sync-stripe-prices.ts`)

Reads pricing configuration from `src/lib/constants.ts`, creates/updates prices in Stripe (MYR currency), and writes back price IDs.

**Usage:**
```bash
# Dry run (preview changes without making them)
bun scripts/sync-stripe-prices.ts --dry-run

# Execute changes
bun scripts/sync-stripe-prices.ts
```

**What it does:**
1. Reads `pricingCards` from `src/lib/constants.ts`
2. Filters out free tiers
3. Ensures product exists (calls `sync-stripe-product.ts`)
4. For each paid tier:
   - Searches for existing price in Stripe
   - Creates new price if not found
   - Updates price if amount changed (deactivates old, creates new)
5. Writes price IDs back to:
   - `src/lib/constants.ts` (priceId field)
   - `prisma/schema.prisma` (Plan enum)

**After running:**
```bash
bun prisma generate  # Regenerate Prisma client with updated Plan enum
bun run build       # Verify everything compiles
```

---

## Price Configuration

Prices are configured in `src/lib/constants.ts`:

```typescript
export const pricingCards = [
  {
    title: 'Basic',
    price: 'RM 49',      // Will be converted to 4900 cents
    duration: 'month',   // 'month' or 'year'
    priceId: '',         // Will be populated by sync script
    // ...
  },
  // ...
]
```

**Supported price formats:**
- `RM 49` → 4900 cents (MYR)
- `$99` → 9900 cents
- `RM 1,299` → 129900 cents
- `Free` → Skipped (no Stripe price created)

---

## Workflow

### Initial Setup
```bash
# 1. Create/update product
bun scripts/sync-stripe-product.ts

# 2. Create/update prices based on constants.ts
bun scripts/sync-stripe-prices.ts

# 3. Regenerate Prisma client
bun prisma generate

# 4. Build and test
bun run build
```

### Updating Prices
```bash
# 1. Edit src/lib/constants.ts (change price values)
# 2. Preview changes
bun scripts/sync-stripe-prices.ts --dry-run

# 3. Apply changes
bun scripts/sync-stripe-prices.ts

# 4. Regenerate and rebuild
bun prisma generate
bun run build
```

---

## Dry Run Mode

Use `--dry-run` flag to preview what would happen without making any changes:

- ✅ Reads from Stripe
- ✅ Shows what would be created/updated
- ❌ Does not create/update Stripe resources
- ❌ Does not modify local files (.env, constants.ts, schema.prisma)

**Example output:**
```
🔍 DRY RUN MODE - No changes will be made

📖 Reading pricing configuration from constants.ts...
   Found 2 paid tier(s) to sync

📋 Processing: Basic
   Price: RM 49
   Amount (cents): 4900
  [DRY RUN] Would create new price
    Product: prod_xxx
    Amount: 4900 MYR
    Interval: month

📝 [DRY RUN] Would update:
  - constants.ts (price IDs)
  - schema.prisma (Plan enum)
```

---

## Troubleshooting

**Error: "Could not find pricingCards in constants.ts"**
- Ensure `export const pricingCards = [...]` exists in `src/lib/constants.ts`

**Error: "Failed to parse pricingCards"**
- Check that pricingCards uses proper JavaScript object syntax
- Avoid TypeScript-specific syntax in the array definition

**Price mismatch detected**
- Script will deactivate old price and create new one
- Stripe prices are immutable, so amount changes require new price IDs

**Plan enum errors after sync**
- Run `bun prisma generate` to regenerate Prisma client
- Ensure all price IDs in Plan enum match Stripe price IDs
