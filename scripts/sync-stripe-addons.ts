#!/usr/bin/env bun
import { stripe } from '../src/lib/stripe'
import { addOnProducts } from '../src/lib/constants'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

// Convert SVG to PNG using sharp (for local generation)
async function convertSvgToPng(svgPath: string, pngPath: string): Promise<void> {
  const svgBuffer = fs.readFileSync(svgPath)
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath)
}

// Get logo paths for addon product
function getAddonLogoPaths(title: string): { svg: string; png: string } | null {
  // Convert title to kebab-case filename
  const filename = title.toLowerCase().replace(/\s+/g, '-')
  const svgPath = path.join(process.cwd(), `public/assets/addon-${filename}-logo.svg`)
  const pngPath = path.join(process.cwd(), `public/assets/addon-${filename}-logo.png`)
  
  if (fs.existsSync(svgPath)) {
    return { svg: svgPath, png: pngPath }
  }
  return null
}

// Check for --dry-run flag
const isDryRun = process.argv.includes('--dry-run')

interface AddOnProduct {
  title: string
  description?: string
  price?: string
  duration?: string
  id: string // Product ID (will be updated after creation)
  priceId?: string // Price ID (for paid addons)
  taxCode?: string // Stripe tax code
}

// Parse price string to cents (e.g., "RM 49" -> 4900)
function parsePriceToAmount(priceStr: string): number {
  if (!priceStr || priceStr.trim() === '') return 0
  
  const freeTierPattern = /^(free|0|rm\s*0|\$\s*0)$/i
  if (freeTierPattern.test(priceStr.trim())) return 0
  
  const match = priceStr.match(/[\d,]+/)
  if (!match) return 0
  
  const amount = parseInt(match[0].replace(/,/g, ''))
  return amount * 100 // Convert to cents
}

// Check if addon has pricing (is a paid addon)
function isPaidAddon(addon: AddOnProduct): boolean {
  if (!addon.price || !addon.duration) return false
  const amount = parsePriceToAmount(addon.price)
  return amount > 0
}

async function syncStripeAddons() {
  try {
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }
    
    console.log('🚀 Starting Stripe addon products sync...\n')
    
    // Read addon products from constants.ts
    console.log('📖 Reading addon products configuration from constants.ts...')
    console.log(`   Found ${addOnProducts.length} addon product(s) total\n`)
    
    if (addOnProducts.length === 0) {
      console.log('   ⚠️  No addon products found - nothing to sync')
      return
    }
    
    const productMap: Record<string, { productId: string; priceId?: string }> = {}
    
    for (const addon of addOnProducts) {
      console.log(`\n📦 Processing: ${addon.title}`)
      console.log(`   Current Product ID: ${addon.id || 'none'}`)
      
      let product
      
      // Check if product exists
      if (addon.id && addon.id.startsWith('prod_')) {
        try {
          product = await stripe.products.retrieve(addon.id)
          console.log(`  ✅ Found existing product: ${product.id}`)
          
          // Update product if needed
          const needsUpdate = 
            product.name !== addon.title ||
            (addon.description && product.description !== addon.description)
          
          if (needsUpdate && !isDryRun) {
            product = await stripe.products.update(addon.id, {
              name: addon.title,
              description: addon.description,
            })
            console.log(`  🔄 Updated product details`)
          } else if (needsUpdate && isDryRun) {
            console.log(`  [DRY RUN] Would update product details`)
          }
        } catch (error: any) {
          if (error.code === 'resource_missing') {
            console.log(`  ⚠️  Product ${addon.id} not found in Stripe, will create new`)
            product = null
          } else {
            throw error
          }
        }
      }
      
      // Process product logo if available
      const logoPaths = getAddonLogoPaths(addon.title)
      
      if (logoPaths) {
        if (!isDryRun) {
          console.log(`\n  🖼️  Processing addon logo...`)
          console.log(`    📐 Converting SVG to PNG...`)
          await convertSvgToPng(logoPaths.svg, logoPaths.png)
          console.log(`    ✅ Generated PNG: ${path.basename(logoPaths.png)}`)
          console.log(`    💡 Upload to your hosting and add imageUrl to addon config`)
        } else {
          console.log(`\n  🖼️  [DRY RUN] Would convert SVG to PNG`)
        }
      }
      
      // Use image URL from addon config (must be publicly accessible)
      const imageUrl = (addon as any).imageUrl || undefined
      if (imageUrl) {
        console.log(`  ✅ Addon image URL: ${imageUrl}`)
      } else if (logoPaths) {
        console.log(`  ⚠️  No imageUrl in addon config, image will not be attached`)
      }
      
      // Create product if doesn't exist
      if (!product) {
        if (!isDryRun) {
          console.log(`\n  📦 Creating new product...`)
          
          product = await stripe.products.create({
            name: addon.title,
            description: addon.description || `${addon.title} addon for Autlify platform`,
            images: imageUrl ? [imageUrl] : [],
            type: 'service', // Addon products are services
          })
          
          console.log(`  ✅ Created product: ${product.id}`)
          if (imageUrl) console.log(`  ✅ Attached product image`)
        } else {
          console.log(`\n  [DRY RUN] Would create new product`)
          console.log(`    Name: ${addon.title}`)
          console.log(`    Description: ${addon.description || `${addon.title} addon for Autlify platform`}`)
          if (imageUrl) console.log(`    Image URL: ${imageUrl}`)
        }
      } else if (imageUrl && !isDryRun) {
        // Update existing product with image if provided
        product = await stripe.products.update(product.id, {
          images: [imageUrl],
        })
        console.log(`  ✅ Updated product image`)
      }
      
      if (product) {
        productMap[addon.title] = { productId: product.id }
        
        // Handle pricing if addon is paid
        if (isPaidAddon(addon)) {
          console.log(`\n  💰 Processing pricing for ${addon.title}`)
          console.log(`     Price: ${addon.price}`)
          console.log(`     Duration: ${addon.duration}`)
          
          const amount = parsePriceToAmount(addon.price!)
          console.log(`     Amount (cents): ${amount}`)
          
          // Search for existing price
          const existingPrices = await stripe.prices.list({
            product: product.id,
            active: true,
            limit: 100,
          })
          
          let price = existingPrices.data.find(
            p => p.nickname === addon.title && 
                 p.currency === 'myr' &&
                 p.recurring?.interval === addon.duration
          )
          
          if (price) {
            console.log(`    ✅ Found existing price: ${price.id}`)
            
            // Check if amount matches
            if (price.unit_amount !== amount) {
              if (!isDryRun) {
                await stripe.prices.update(price.id, { active: false })
                console.log(`    🔄 Deactivated old price (amount mismatch)`)
                
                price = await stripe.prices.create({
                  product: product.id,
                  currency: 'myr',
                  unit_amount: amount,
                  recurring: {
                    interval: addon.duration as 'month' | 'year',
                  },
                  nickname: addon.title,
                  active: true,
                })
                console.log(`    ✅ Created new price: ${price.id}`)
              } else {
                console.log(`    [DRY RUN] Would create new price (old: ${price.unit_amount} -> new: ${amount})`)
              }
            }
            
            productMap[addon.title].priceId = price.id
          } else {
            if (!isDryRun) {
              console.log(`    📦 Creating new price...`)
              
              price = await stripe.prices.create({
                product: product.id,
                currency: 'myr',
                unit_amount: amount,
                recurring: {
                  interval: addon.duration as 'month' | 'year',
                },
                nickname: addon.title,
                active: true,
              })
              
              console.log(`    ✅ Created price: ${price.id}`)
              productMap[addon.title].priceId = price.id
            } else {
              console.log(`    [DRY RUN] Would create new price`)
              console.log(`      Amount: ${amount} MYR`)
              console.log(`      Interval: ${addon.duration}`)
            }
          }
        }
      }
    }
    
    if (!isDryRun && Object.keys(productMap).length > 0) {
      console.log('\n📝 Updating constants.ts...')
      await updateConstants(productMap)
    } else if (isDryRun) {
      console.log('\n📝 [DRY RUN] Would update constants.ts with:')
      Object.entries(productMap).forEach(([title, { productId, priceId }]) => {
        console.log(`  ${title}:`)
        console.log(`    Product ID: ${productId}`)
        if (priceId) console.log(`    Price ID: ${priceId}`)
      })
    }
    
    if (isDryRun) {
      console.log('\n🎉 DRY RUN completed - no changes were made')
    } else {
      console.log('\n🎉 Addon products sync completed!')
      console.log('\nProduct IDs:')
      Object.entries(productMap).forEach(([title, { productId, priceId }]) => {
        console.log(`  ${title}:`)
        console.log(`    Product: ${productId}`)
        if (priceId) console.log(`    Price: ${priceId}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error syncing addon products:', error)
    process.exit(1)
  }
}

async function updateConstants(productMap: Record<string, { productId: string; priceId?: string }>) {
  const constantsPath = path.join(process.cwd(), 'src/lib/constants.ts')
  let content = fs.readFileSync(constantsPath, 'utf-8')
  
  // Update each addon product's id and priceId
  for (const [title, { productId, priceId }] of Object.entries(productMap)) {
    // Update product ID
    const idRegex = new RegExp(
      `(\\{\\s*title:\\s*'${title}'[\\s\\S]*?id:\\s*')([^']*)(')`,
      'g'
    )
    content = content.replace(idRegex, `$1${productId}$3`)
    
    // Update or add priceId if this is a paid addon
    if (priceId) {
      // Check if priceId field exists
      const hasPriceId = new RegExp(
        `title:\\s*'${title}'[\\s\\S]*?priceId:`,
        'g'
      ).test(content)
      
      if (hasPriceId) {
        // Update existing priceId
        const priceIdRegex = new RegExp(
          `(\\{\\s*title:\\s*'${title}'[\\s\\S]*?priceId:\\s*')([^']*)(')`,
          'g'
        )
        content = content.replace(priceIdRegex, `$1${priceId}$3`)
      } else {
        // Add priceId field after id field
        const addPriceIdRegex = new RegExp(
          `(\\{\\s*title:\\s*'${title}'[\\s\\S]*?id:\\s*'${productId}')`,
          'g'
        )
        content = content.replace(addPriceIdRegex, `$1', priceId: '${priceId}`)
      }
    }
  }
  
  fs.writeFileSync(constantsPath, content)
  console.log(`  ✅ Updated constants.ts with ${Object.keys(productMap).length} addon product(s)`)
}

// Execute if run directly
syncStripeAddons()

export { syncStripeAddons }
