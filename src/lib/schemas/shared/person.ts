import { z } from 'zod';

/**
 * Industry-standard-ish schemas for legal parties.
 *
 * - Person: a natural person (human)
 * - NonPerson: a legal entity (company/organization) or other non-human party
 *
 * Notes:
 * - Uses a discriminator `kind` to simplify unions.
 * - All fields are optional unless commonly required across systems.
 */

// ---------- Common primitives ----------

export const IsoDateString = z
	.string()
	// basic YYYY-MM-DD
	.regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected ISO date string (YYYY-MM-DD)');

export const Email = z.email();

// E.164-ish: +15551234567. Keep permissive but useful.
export const PhoneE164 = z
	.string()
	.regex(/^\+?[1-9]\d{6,14}$/u, 'Expected phone number in E.164 format');

// Prisma typically stores phone as a freeform string; keep a loose variant for alignment.
export const PhoneLoose = z.string().min(1);

export const Url = z.url();

export const CountryCodeAlpha2 = z
	.string()
	.length(2)
	.regex(/^[A-Z]{2}$/u, 'Expected ISO 3166-1 alpha-2 country code (e.g., US)');

// Accept lowercase ISO-2 and normalize to uppercase.
export const CountryCodeAlpha2Normalized = z
	.string()
	.length(2)
	.transform((s) => s.toUpperCase())
	.refine((s) => /^[A-Z]{2}$/u.test(s), 'Expected ISO 3166-1 alpha-2 country code (e.g., US)');

export const LanguageTag = z
	.string()
	// Very lightweight BCP 47-ish
	.regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/u, 'Expected BCP 47 language tag');

export const PartyIdentifierSchema = z
	.object({
		/** Identifier namespace/type (e.g., "passport", "nationalId", "taxId", "lei", "duns") */
		type: z.string().min(1),
		/** Identifier value */
		value: z.string().min(1),
		/** Issuer authority (country, agency, registry) */
		issuer: z.string().min(1).optional(),
		/** Country of issuance when applicable */
		country: CountryCodeAlpha2.optional(),
	})
	.strict();

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

// Base canonical address shape (uses locality/region).
const BaseAddressSchema = z
	.object({
		/** e.g., "home", "work", "billing", "shipping", "registered" */
		type: z.string().min(1).optional(),

		line1: z.string().min(1).optional(),
		line2: z.string().min(1).optional(),
		line3: z.string().min(1).optional(),
		locality: z.string().min(1).optional(), // city/town
		region: z.string().min(1).optional(), // state/province
		postalCode: z.string().min(1).optional(),
		country: CountryCodeAlpha2.optional(),
		/** Optional freeform label (building, unit, etc.) */
		label: z.string().min(1).optional(),
	})
	.strict();

/**
 * Address schema with Prisma-friendly aliases.
 *
 * Prisma models in this repo commonly use city/state (e.g., Agency/SubAccount).
 * Accept { city, state } as input aliases and normalize into { locality, region }.
 */
export const AddressSchema = z.preprocess((val) => {
	if (!isRecord(val)) return val;

	const v: Record<string, unknown> = { ...val };

	// Aliases for common DB field names.
	if (typeof v.city === 'string' && (v.locality === undefined || v.locality === null || v.locality === '')) {
		v.locality = v.city;
	}
	if (typeof v.state === 'string' && (v.region === undefined || v.region === null || v.region === '')) {
		v.region = v.state;
	}

	// Normalize ISO-2 country codes if present.
	if (typeof v.country === 'string') {
		v.country = v.country.toUpperCase();
	}

	// Remove alias keys to satisfy .strict() on the base schema.
	delete v.city;
	delete v.state;

	return v;
}, BaseAddressSchema);

export const ContactPointSchema = z
	.object({
		/** e.g., "primary", "support", "billing" */
		type: z.string().min(1).optional(),
		email: Email.optional(),
		phone: PhoneE164.optional(),
		url: Url.optional(),
	})
	.strict()
	.refine((v) => v.email || v.phone || v.url, {
		message: 'At least one of email, phone, or url must be provided',
	});

export const PartyBaseSchema = z
	.object({
		/** Stable internal id (if you have one). */
		id: z.string().min(1).optional(),
		/** External reference (CRM id, etc.). */
		externalId: z.string().min(1).optional(),

		/**
		 * Convenience fields aligned with common Prisma models (e.g., Contact/Agency/SubAccount).
		 * Prefer contacts[] for multi-channel support.
		 */
		email: Email.optional(),
		phone: PhoneLoose.optional(),

		/** Party roles in your system (e.g., customer/vendor/employee). */
		roles: z.array(z.enum(['customer', 'vendor', 'employee'])).optional(),
		/**
		 * Subledger linkage (typically for accounting/ERP).
		 * Use this when the party is mostly a link/reference.
		 */
		subledgerLinks: z
			.array(
				z
					.object({
						/** Subledger role/type (customer/vendor/employee). */
						role: z.enum(['customer', 'vendor', 'employee']),
						/** Identifier in the subledger system. */
						subledgerId: z.string().min(1),
						/** Optional system/instance hint (e.g., "netsuite", "xero", "quickbooks"). */
						system: z.string().min(1).optional(),
						/** Optional control account / account reference in that system. */
						accountId: z.string().min(1).optional(),
					})
					.strict(),
			)
			.optional(),

		/** Human-friendly display name. */
		displayName: z.string().min(1).optional(),
		/** Preferred locale/language. */
		language: LanguageTag.optional(),

		identifiers: z.array(PartyIdentifierSchema).optional(),
		addresses: z.array(AddressSchema).optional(),
		contacts: z.array(ContactPointSchema).optional(),

		/** Tags/labels used by your system */
		tags: z.array(z.string().min(1)).optional(),
		/** Arbitrary metadata for forward compatibility */
		metadata: z.record(z.string(), z.any()).optional(),
	})
	.strict();

// ---------- Person (natural person) ----------

export const PersonNameSchema = z
	.object({
		given: z.string().min(1).optional(),
		middle: z.string().min(1).optional(),
		family: z.string().min(1).optional(),
		/** Prefix (Mr, Ms, Dr, etc.) */
		prefix: z.string().min(1).optional(),
		/** Suffix (Jr, Sr, III, etc.) */
		suffix: z.string().min(1).optional(),
	})
	.strict()
	.refine((n) => n.given || n.family, {
		message: 'At least one of given or family name must be provided',
	});

export const PersonSchema = PartyBaseSchema.extend({
	kind: z.literal('person'),

	/** Prisma/User alignment (optional). */
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	avatarUrl: z.string().min(1).optional(),

	name: PersonNameSchema.optional(),
	/** Convenience full name when structured components are not available */
	fullName: z.string().min(1).optional(),

	/** ISO date string YYYY-MM-DD */
	dateOfBirth: IsoDateString.optional(),
	/** ISO 3166-1 alpha-2 */
	nationality: CountryCodeAlpha2.optional(),

	/** ISO 5218-ish: 0=not known, 1=male, 2=female, 9=not applicable */
	gender: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(9)]).optional(),
})
	.strict()
	.superRefine((v, ctx) => {
		// Allow "link-only" person records when an id/externalId/subledger link exists.
		const hasLink = Boolean(v.id || v.externalId || (v.subledgerLinks && v.subledgerLinks.length > 0));
		const hasNameLike = Boolean(
			v.fullName ||
			v.name ||
			v.firstName ||
			v.lastName ||
			(v.displayName && v.displayName.trim().length > 0),
		);
		if (!hasLink && !hasNameLike) {
			ctx.addIssue({
				code: 'custom',
				message: 'Provide either fullName/name, or firstName/lastName (or displayName)',
				path: ['fullName'],
			});
		}
	});

// ---------- Non-person (legal entity) ----------

export const OrganizationSchema = PartyBaseSchema.extend({
	kind: z.literal('organization'),

	/**
	 * Prisma alignment helpers.
	 * - Agency/SubAccount uses name, companyEmail, companyPhone, and flat address fields.
	 * - Prefer contacts[] / addresses[] for richer representations.
	 */
	name: z.string().min(1).optional(),
	companyEmail: Email.optional(),
	companyPhone: PhoneLoose.optional(),
	line1: z.string().min(1).optional(),
	line2: z.string().min(1).optional(),
	city: z.string().min(1).optional(),
	state: z.string().min(1).optional(),
	postalCode: z.string().min(1).optional(),
	country: CountryCodeAlpha2Normalized.optional(),

	/** Registered/legal name */
	legalName: z.string().min(1).optional(),
	/** Alternate/trading name */
	tradingName: z.string().min(1).optional(),

	/** Company registration / incorporation */
	registrationNumber: z.string().min(1).optional(),
	registrationCountry: CountryCodeAlpha2.optional(),

	/** Incorporated / established date */
	incorporationDate: IsoDateString.optional(),

	/** Optional industry classification codes */
	industryCodes: z
		.array(
			z
				.object({
					/** e.g., "NAICS", "SIC", "NACE" */
					system: z.string().min(1),
					code: z.string().min(1),
				})
				.strict(),
		)
		.optional(),
})
	.strict();

// Require some meaningful organization identity unless this record is "link-only".
export const OrganizationWithIdentitySchema = OrganizationSchema.superRefine((v, ctx) => {
	const hasLink = Boolean(v.id || v.externalId || (v.subledgerLinks && v.subledgerLinks.length > 0));
	if (!hasLink && !v.legalName && !v.name) {
		ctx.addIssue({
			code: 'custom',
			message:
				'Provide legalName (or name), or provide id/externalId/subledgerLinks for link-only records',
			path: ['legalName'],
		});
	}
});

/**
 * Non-person party.
 * Extend this union if you later add other legal entity types (e.g., "trust", "government").
 */
export const NonPersonSchema = z.discriminatedUnion('kind', [OrganizationSchema]);

/** Any party (person or non-person). */
export const PartySchema = z.discriminatedUnion('kind', [PersonSchema, OrganizationWithIdentitySchema]);

// ---------- Types ----------

export type PartyIdentifier = z.infer<typeof PartyIdentifierSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ContactPoint = z.infer<typeof ContactPointSchema>;
export type PersonName = z.infer<typeof PersonNameSchema>;

export type Person = z.infer<typeof PersonSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type NonPerson = z.infer<typeof NonPersonSchema>;
export type Party = z.infer<typeof PartySchema>;

