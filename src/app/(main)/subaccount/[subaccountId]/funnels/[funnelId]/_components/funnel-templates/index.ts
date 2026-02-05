import { v4 as uuidv4 } from 'uuid'
import { EditorElement } from '@/providers/editor/editor-provider'
import { FunnelTemplate, StarterKit, TemplateCategory } from './types'
import { landingTemplates } from './landing'
import { checkoutTemplates } from './checkout'
import { thankyouTemplates } from './thankyou'
import { pricingTemplates } from './pricing'
import { starterKits } from './kits'

// Export types
export * from './types'

// Export all templates
export const allTemplates: FunnelTemplate[] = [
  ...landingTemplates,
  ...checkoutTemplates,
  ...thankyouTemplates,
  ...pricingTemplates,
]

// Export starter kits
export { starterKits }

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): FunnelTemplate[] {
  return allTemplates.filter((t) => t.category === category)
}

// Get template by ID
export function getTemplateById(id: string): FunnelTemplate | undefined {
  return allTemplates.find((t) => t.id === id)
}

// Get starter kit by ID
export function getStarterKitById(id: string): StarterKit | undefined {
  return starterKits.find((k) => k.id === id)
}

// Regenerate IDs to ensure uniqueness when template is used
function regenerateIds(elements: EditorElement[]): EditorElement[] {
  return elements.map((element) => {
    const newId = element.id === '__body' ? '__body' : uuidv4()
    
    if (Array.isArray(element.content)) {
      return {
        ...element,
        id: newId,
        content: regenerateIds(element.content),
      }
    }
    
    return {
      ...element,
      id: newId,
    }
  })
}

// Get template elements with fresh IDs
export function getTemplateElements(templateId: string): EditorElement[] | null {
  const template = getTemplateById(templateId)
  if (!template) return null
  
  return regenerateIds(template.elements)
}

// Get blank page template
export function getBlankPageElements(): EditorElement[] {
  return [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: 'white' },
      content: [],
    },
  ]
}

// Template categories for UI display
export const templateCategories: { value: TemplateCategory; label: string; description: string }[] = [
  { value: 'landing', label: 'Landing Pages', description: 'Hero sections with CTAs' },
  { value: 'checkout', label: 'Checkout Pages', description: 'Payment form layouts' },
  { value: 'thankyou', label: 'Thank You Pages', description: 'Post-purchase confirmation' },
  { value: 'pricing', label: 'Pricing Pages', description: 'Pricing tier layouts' },
]
