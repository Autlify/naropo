import { z } from 'zod'

export const checkoutFormSchema = z.object({
  // User Details
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  userEmail: z.string().email('Invalid email address'),

  // Agency Details
  agencyName: z.string().min(2, 'D.B.A. is required for your agency'),
  agencyEmail: z.string().email('Invalid email address'),
  companyPhone: z.string().min(1, 'Phone number is required'),
  phoneCode: z.string().optional(),

  // Billing Address 
  companyName: z.string().optional(),
  tinNumber: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  countryCode: z.string().optional(),
  stateCode: z.string().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
