#!/usr/bin/env bun
import { stripe } from '../src/lib/stripe'
import { syncStripeProduct } from './sync-stripe-product'
import { pricingCards } from '../src/lib/constants'
import * as fs from 'fs'
import * as path from 'path'

// Check for --dry-run flag
const isDryRun = process.argv.includes('--dry-run')

// Generate plan name from title (e.g., "Starter" -> "STARTER")
function generatePlanName(title: string): string {
  return title.toUpperCase()
}

interface PricingCard {
  title: string
  description: string
  price: string
  duration: string
  highlight: string
  features: string[]
  priceId: string
}

// Parse price string to cents (e.g., "RM 49" -> 4900, "Free" -> 0)
function parsePriceToAmount(priceStr: string): number {
  if (!priceStr || priceStr.trim() === '') return 0
  
  // Check for free tier keywords (case insensitive)
  const freeTierPattern = /^(free|0|rm\s*0|\$\s*0)$/i
  if (freeTierPattern.test(priceStr.trim())) return 0
  
  // Remove currency symbols and extract number
  const match = priceStr.match(/[\d,]+/)
  if (!match) return 0
  
  const amount = parseInt(match[0].replace(/,/g, ''))
  return amount * 100 // Convert to cents
}

// Check if a pricing card represents a valid paid tier
function isPaidTier(card: PricingCard): boolean {
  // Must have duration (monthly/yearly billing)
  if (!card.duration || card.duration.trim() === '') return false
  
  // Must have a valid price > 0
  const amount = parsePriceToAmount(card.price)
  return amount > 0
}

async function syncStripePrices() {
  try {
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }
    
    console.log('🚀 Starting Stripe prices sync...\n')
    
    // Read pricing cards from constants.ts
    console.log('📖 Reading pricing configuration from constants.ts...')
    console.log(`   Found ${pricingCards.length} pricing tier(s) total`)
    
    // Dynamically filter paid tiers
    const paidTiers = pricingCards.filter(isPaidTier)
    
    console.log(`   Detected ${paidTiers.length} paid tier(s) to sync`)
    if (paidTiers.length === 0) {
      console.log('   ⚠️  No paid tiers found - nothing to sync')
      return
    }
    
    // Show which tiers will be synced
    paidTiers.forEach(card => {
      const amount = parsePriceToAmount(card.price)
      console.log(`   - ${card.title}: ${amount/100} MYR/${card.duration}`)
    })
    console.log()
    
    // First ensure product exists
    const product = await syncStripeProduct()
    
    if (!product && isDryRun) {
      console.log('\n⚠️  Cannot continue price sync in dry-run mode without existing product')
      console.log('💡 Run without --dry-run to create the product first, or create it manually in Stripe')
      console.log('\n🎉 DRY RUN completed')
      console.log('\n📝 Summary of what would happen:')
      console.log('  1. Create Autlify product in Stripe')
      console.log('  2. Write product ID to .env')
      paidTiers.forEach(card => {
        const amount = parsePriceToAmount(card.price)
        console.log(`  3. Create price for "${card.title}": ${amount/100} MYR/${card.duration}`)
      })
      console.log('  4. Update constants.ts with price IDs')
      console.log('  5. Update schema.prisma Plan enum')
      return
    }
    
    if (!product) {
      throw new Error('Product is required to sync prices')
    }
    
    console.log('\n💰 Syncing prices...')
    
    const priceMap: Record<string, { priceId: string; planName: string }> = {}
    
    for (const card of paidTiers) {
      console.log(`\n📋 Processing: ${card.title}`)
      console.log(`   Price: ${card.price}`)
      console.log(`   Duration: ${card.duration}`)
      
      const amount = parsePriceToAmount(card.price)
      console.log(`   Amount (cents): ${amount}`)
      
      // Search for existing price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      })
      
      let price = existingPrices.data.find(
        p => p.nickname === card.title && 
             p.currency === 'myr' &&
             p.recurring?.interval === card.duration
      )
      
      if (price) {
        console.log(`  ✅ Found existing price: ${price.id}`)
        
        // Check if amount matches
        if (price.unit_amount !== amount) {
          if (!isDryRun) {
            // Deactivate old price
            await stripe.prices.update(price.id, { active: false })
            console.log(`  🔄 Deactivated old price (amount mismatch)`)
            
            // Create new price with updated amount
            price = await stripe.prices.create({
              product: product.id,
              currency: 'myr',
              unit_amount: amount,
              recurring: {
                interval: card.duration as 'month' | 'year',
              },
              nickname: card.title,
              active: true,
            })
            console.log(`  ✅ Created new price: ${price.id}`)
          } else {
            console.log(`  [DRY RUN] Would create new price (old: ${price.unit_amount} -> new: ${amount})`)
          }
        }
        
        const planName = generatePlanName(card.title)
        priceMap[card.title] = { priceId: price.id, planName }
      } else {
        if (!isDryRun) {
          console.log(`  📦 Creating new price...`)
          
          price = await stripe.prices.create({
            product: product.id,
            currency: 'myr',
            unit_amount: amount,
            recurring: {
              interval: card.duration as 'month' | 'year',
            },
            nickname: card.title,
            active: true,
          })
          
          console.log(`  ✅ Created price: ${price.id}`)
          const planName = generatePlanName(card.title)
          priceMap[card.title] = { priceId: price.id, planName }
        } else {
          console.log(`  [DRY RUN] Would create new price`)
          console.log(`    Product: ${product.id}`)
          console.log(`    Amount: ${amount} MYR`)
          console.log(`    Interval: ${card.duration}`)
        }
      }
    }
    
    if (!isDryRun && Object.keys(priceMap).length > 0) {
      console.log('\n📝 Updating code files...')
      
      // Update constants.ts
      await updateConstants(priceMap, pricingCards)
      
      // Update schema.prisma
      await updateSchema(priceMap)
    } else if (isDryRun) {
      console.log('\n📝 [DRY RUN] Would update:')
      console.log('  - constants.ts (price IDs)')
      console.log('  - schema.prisma (Plan enum)')
    }
    
    if (isDryRun) {
      console.log('\n🎉 DRY RUN completed - no changes were made')
    } else {
      console.log('\n🎉 Price sync completed!')
      console.log('\nPrice IDs:')
      Object.entries(priceMap).forEach(([title, { priceId, planName }]) => {
        console.log(`  ${title} (${planName}): ${priceId}`)
      })
      
      console.log('\n⚠️  Next steps:')
      console.log('  1. Run: bun prisma generate')
      console.log('  2. Run: bun run build')
    }
    
  } catch (error) {
    console.error('❌ Error syncing prices:', error)
    process.exit(1)
  }
}

async function updateConstants(priceMap: Record<string, { priceId: string; planName: string }>, pricingCards: PricingCard[]) {
  const constantsPath = path.join(process.cwd(), 'src/lib/constants.ts')
  let content = fs.readFileSync(constantsPath, 'utf-8')
  
  // Update each pricing card's priceId
  for (const [title, { priceId }] of Object.entries(priceMap)) {
    // Find the card in the array and update its priceId
    const regex = new RegExp(
      `(title: '${title}'[\\s\\S]*?priceId: ')([^']*)(')`,
      'g'
    )
    content = content.replace(regex, `$1${priceId}$3`)
  }
  
  // Update PRICE_ID_TO_PLAN mapping
  const mappingEntries = Object.entries(priceMap)
    .map(([_, { priceId, planName }]) => `  '${priceId}': '${planName}',`)
    .join('\n')
  
  const mappingContent = `export const PRICE_ID_TO_PLAN: Record<string, string> = {\n${mappingEntries}\n}`
  
  content = content.replace(
    /export const PRICE_ID_TO_PLAN: Record<string, string> = \{[\s\S]*?\n\}/,
    mappingContent
  )
  
  fs.writeFileSync(constantsPath, content)
  console.log('  ✅ Updated constants.ts with new price IDs and PRICE_ID_TO_PLAN mapping')
}

async function updateSchema(priceMap: Record<string, { priceId: string; planName: string }>) {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')
  let content = fs.readFileSync(schemaPath, 'utf-8')
  
  // Update Plan enum with actual Stripe price IDs (not plan names)
  const planValues = Object.values(priceMap)
  if (planValues.length > 0) {
    // Use actual price IDs as enum values to match Stripe prices directly
    const enumEntries = planValues.map(({ priceId }) => priceId)
    const enumContent = `enum Plan {\n  ${enumEntries.join('\n  ')}\n}`
    
    content = content.replace(
      /enum Plan \{[\s\S]*?\}/,
      enumContent
    )
    
    fs.writeFileSync(schemaPath, content)
    console.log(`  ✅ Updated schema.prisma with ${planValues.length} price ID(s) in Plan enum`)
  }
}

// Execute if run directly
syncStripePrices()

export { syncStripePrices }
