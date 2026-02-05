/**
 *
 * @namespace Autlify.Templates
 * @module Templates
 * @author Autlify Team
 * @created 2026-02-03
 * @version 1.0.0
 * @license PROPRIETARY
 * 
 * @description TypeScript Project Template with Predefined Pricing Plans.
 * 
 * @usage
 * 1. Use this template to quickly set up a TypeScript project with predefined pricing plans.
 * 2. Customize the plans as needed for your application.
 * 
 * @example
 * 1. Import the template in your project setup script.
 * 2. Call the template function to initialize your project with the plans.
 * 
 */


declare module 'autlify' {
    namespace Autlify {
        namespace Pricing {
            export interface PricingPlan {
                id: string;
                name: string;
                priceMonthly: number;
                priceYearly: number;
                features: string[];
                isPopular?: boolean;
            }
        }
    }
}