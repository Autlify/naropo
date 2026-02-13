import { EditorElement } from '@/providers/editor/editor-provider'

export type TemplateCategory = 
  | 'landing' 
  | 'checkout' 
  | 'thankyou' 
  | 'pricing'

export interface FunnelTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnail: string
  elements: EditorElement[]
}

export interface StarterKit {
  id: string
  name: string
  description: string
  thumbnail: string
  pages: {
    name: string
    pathName: string
    templateId: string
  }[]
}
