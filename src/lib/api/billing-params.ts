import { NextRequest } from 'next/server';

export type MeteringScope = 'AGENCY' | 'SUBACCOUNT';
export type UsagePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALLTIME';

export interface BillingParams {
  agencyId: string | null;
  subAccountId: string | null;
  scope: MeteringScope;
  featureKey: string | null;
  period?: UsagePeriod;
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Parses common billing/metering query parameters from request.
 * Used across billing and usage tracking routes.
 * 
 * @param req - The request object
 * @returns Parsed billing parameters
 * 
 * @example
 * const params = parseBillingParams(req);
 * const usage = await getUsageSummary(params.agencyId, params.featureKey);
 */
export function parseBillingParams(req: NextRequest): BillingParams {
  const url = new URL(req.url);
  
  const agencyId = url.searchParams.get('agencyId');
  const subAccountId = url.searchParams.get('subAccountId');
  const featureKey = url.searchParams.get('featureKey');
  const scopeParam = url.searchParams.get('scope') as MeteringScope | null;
  const periodParam = url.searchParams.get('period') as UsagePeriod | null;
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  // Infer scope from subAccountId if not explicitly provided
  const scope: MeteringScope = scopeParam ?? (subAccountId ? 'SUBACCOUNT' : 'AGENCY');
  
  return {
    agencyId,
    subAccountId,
    scope,
    featureKey,
    period: periodParam ?? undefined,
    startDate,
    endDate,
  };
}

/**
 * Validates that required billing params are present.
 * Throws descriptive errors if validation fails.
 * 
 * @param params - Parsed billing parameters
 * @param required - Array of required field names
 * @throws Error if required fields are missing
 */
export function validateBillingParams(
  params: BillingParams,
  required: (keyof BillingParams)[] = ['agencyId']
): void {
  for (const field of required) {
    if (!params[field]) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  }
}
