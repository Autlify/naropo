/**
 * @abstraction Address Schema
 *
 * This schema defines the structure for an address object, including fields
 * such as street, city, state, postal code, and country. It ensures that
 * address data adheres to a consistent format across the application.
 *
 * @fields
 * - line1: The first line of the street address (required).
 * - line2: The second line of the street address (optional).
 * - city: The city of the address @requires [stateCode][countryCode]
 * - state: The state or province of the address @requires stateCode
 * - stateCode: The state or province code of the address @requires [countryCode]
 * - postalCode: The postal or ZIP code of the address (required).
 * - country: The full name of the country @requires [countryCode]
 * - countryCode: The country code of the address, represented by its ISO 3166-1 alpha-2 code (required).
 * @usage
 * This schema can be used for validating address data in user profiles,
 * shipping information, billing details, and any other context where an
 * address is required.
 * @example
 * const address: Address = {
 *   line1: "123 Main St",
 *   line2: "Apt 4B",
 *   city: "Kuala Lumpur",
 *   state: "Kuala Lumpur",
 *   stateCode: "14",
 *   postalCode: "55200",
 *   country: "Malaysia",
 *   countryCode: "MY"
 * };
 * @author Autlify Team
 * @date 2024-06-10
 * @license PROPRIETARY
 * @version 1.0.0
 * 
 */

import { z } from 'zod';

export const AddressSchema = z.object({
    line1: z.string().min(1, { message: "Address line 1 is required" }),
    line2: z.string().optional(),
    // Country -> State -> City dependencies can be enforced in application logic if needed
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    stateCode: z.string().min(1, { message: "State code is required" }),
    postalCode: z.string().min(1, { message: "Postal code is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    countryCode: z.string().length(2, { message: "Country code must be 2 characters" }),
})

export type Address = z.infer<typeof AddressSchema>;

export const ContactSchema = z.object({
    name: z.string().min(1, { message: "Contact name is required" }),
    email: z.email({ message: "Invalid email address" }).optional(),
    phone: z.string().optional(),
    dialingCode: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;