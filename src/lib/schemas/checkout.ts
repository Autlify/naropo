import { z } from 'zod' 

export const checkoutFormSchema = z.object({
  // User details
  userName: z.string().min(2, 'Name must be at least 2 characters'),
  userEmail: z.string().email('Invalid email address'),
  
  // Agency details
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters'),
  agencyEmail: z.string().email('Invalid agency email'),
  agencyLogo: z.string().optional(),
  
  // Address details
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  companyPhone: z.string().min(1, 'Phone number is required'),
  
  // Trial acceptance (only shown if eligible)
  acceptTrial: z.boolean().optional(),
  
  // Payment method (handled by Stripe Elements)
  paymentMethodId: z.string().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
