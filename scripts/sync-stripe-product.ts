#!/usr/bin/env bun
import { stripe } from '../src/lib/stripe'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

const PRODUCT_NAME = 'Autlify Platform'
const PRODUCT_DESCRIPTION = 'Agency management platform and CRM for modern agencies'
const LOGO_SVG_PATH = 'public/assets/product-logo.svg'
const LOGO_PNG_PATH = 'public/assets/product-logo.png'

// Note: Stripe Product images field accepts publicly accessible URLs
// You need to host the PNG on your domain and provide the URL
// Example: 'https://yourdomain.com/assets/product-logo.png'
const PRODUCT_IMAGE_URL = process.env.NEXT_PUBLIC_PRODUCT_LOGO_URL || ''

// Convert SVG to PNG using sharp (for local generation)
async function convertSvgToPng(svgPath: string, pngPath: string): Promise<void> {
  const svgBuffer = fs.readFileSync(svgPath)
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath)
}

// Check for --dry-run flag
const isDryRun = process.argv.includes('--dry-run')

async function syncStripeProduct() {
  try {
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }
    
    console.log('🔍 Searching for existing Autlify product...')
    
    // Search for existing product
    const products = await stripe.products.list({
      limit: 100,
    })
    
    let product = products.data.find(p => p.name === PRODUCT_NAME)
    
    // Prepare product logo
    console.log('\n🖼️  Processing product logo...')
    
    const svgPath = path.join(process.cwd(), LOGO_SVG_PATH)
    const pngPath = path.join(process.cwd(), LOGO_PNG_PATH)
    
    // Generate PNG from SVG for local use
    if (fs.existsSync(svgPath)) {
      if (!isDryRun) {
        console.log('  📐 Converting SVG to PNG...')
        await convertSvgToPng(svgPath, pngPath)
        console.log(`  ✅ Generated PNG: ${LOGO_PNG_PATH}`)
        console.log(`  💡 Upload ${LOGO_PNG_PATH} to your hosting and set NEXT_PUBLIC_PRODUCT_LOGO_URL`)
      } else {
        console.log('  [DRY RUN] Would convert SVG to PNG')
      }
    }
    
    // Use product image URL from environment variable
    const imageUrl = PRODUCT_IMAGE_URL || undefined
    if (imageUrl) {
      console.log(`  ✅ Product image URL: ${imageUrl}`)
    } else {
      console.log(`  ⚠️  No product image URL set (NEXT_PUBLIC_PRODUCT_LOGO_URL)`)
      console.log(`  💡 Set this env var to add product image to Stripe`)
    }
    
    if (product) {
      console.log(`\n✅ Found existing product: ${product.id}`)
      
      if (!isDryRun) {
        // Update product to ensure it's active
        product = await stripe.products.update(product.id, {
          active: true,
          description: PRODUCT_DESCRIPTION,
          images: imageUrl ? [imageUrl] : product.images,
          shippable: false,
          metadata: {
            category: 'software',
            type: 'core_license',
          },
        })
        console.log(`✅ Updated product: ${product.id}`)
        if (imageUrl) console.log(`✅ Updated product image`)
      } else {
        console.log(`   [DRY RUN] Would update product: ${product.id}`)
        console.log(`   [DRY RUN] Would attach product logo`)
      }
    } else {
      if (!isDryRun) {
        console.log('\n📦 Creating new product...')
        
        // Create new product
        product = await stripe.products.create({
          name: PRODUCT_NAME,
          description: PRODUCT_DESCRIPTION,
          images: imageUrl ? [imageUrl] : [],
          type: 'service',
          shippable: false,
          active: true,
          metadata: {
            category: 'software',
            type: 'core_license',
          },
        })
        console.log(`✅ Created product: ${product.id}`)
        if (imageUrl) console.log(`✅ Attached product image`)
      } else {
        console.log('\n📦 [DRY RUN] Would create new product')
        console.log(`   Name: ${PRODUCT_NAME}`)
        console.log(`   Description: ${PRODUCT_DESCRIPTION}`)
        console.log(`   Logo: ${LOGO_SVG_PATH} (converted to PNG)`)
        // Don't return null - we'll show summary below
      }
    }
    
    // Update .env file
    if (!isDryRun && product) {
      const envPath = path.join(process.cwd(), '.env')
      let envContent = ''
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
      }
      
      // Update or add NEXT_AUTLIFY_PRODUCT_ID
      const productIdKey = 'NEXT_AUTLIFY_PRODUCT_ID'
      const productIdLine = `${productIdKey}="${product.id}"`
      
      if (envContent.includes(`${productIdKey}=`)) {
        envContent = envContent.replace(
          new RegExp(`${productIdKey}=.*`, 'g'),
          productIdLine
        )
        console.log(`✅ Updated ${productIdKey} in .env`)
      } else {
        envContent += `\n${productIdLine}\n`
        console.log(`✅ Added ${productIdKey} to .env`)
      }
      
      fs.writeFileSync(envPath, envContent)
    } else if (isDryRun && product) {
      console.log(`\n[DRY RUN] Would update .env with NEXT_AUTLIFY_PRODUCT_ID="${product.id}"`)
    }
    
    if (isDryRun) {
      console.log('\n🎉 DRY RUN completed - no changes were made')
      if (product) {
        console.log(`\n📝 Existing product found:`)
        console.log(`   Product ID: ${product.id}`)
        console.log(`   Product Name: ${product.name}`)
        console.log(`\n💡 Run without --dry-run to update this product`)
      } else {
        console.log(`\n📝 Summary:`)
        console.log(`   No existing product found`)
        console.log(`\n💡 Run without --dry-run to create the product and update .env`)
      }
    } else if (product) {
      console.log('\n🎉 Product sync completed!')
      console.log(`Product ID: ${product.id}`)
      console.log(`Product Name: ${product.name}`)
    } else {
      throw new Error('Product creation failed - no product returned')
    }
    
    return product
  } catch (error) {
    console.error('❌ Error syncing product:', error)
    process.exit(1)
  }
}

// Execute if run directly
syncStripeProduct()

export { syncStripeProduct }
