import { KEYS } from "@/lib/entitlement/constants";


type LeafValues<T> = T extends string
    ? T
    : T extends Record<string, any>
    ? { [K in keyof T]: LeafValues<T[K]> }[keyof T]
    : never;


export type ModuleKey = keyof typeof KEYS;
export type SubModuleKey = { [M in ModuleKey]: keyof (typeof KEYS)[M] }[ModuleKey];
export type FeatureKey = {
  [M in ModuleKey]: {
    [SM in keyof (typeof KEYS)[M]]: `${M}.${Extract<SM, string>}.${Extract<keyof (typeof KEYS)[M][SM], string>}`
  }[keyof (typeof KEYS)[M]]
}[ModuleKey]; 
export type PermissionKey = LeafValues<typeof KEYS>;
