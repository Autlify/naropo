"use client";

import * as React from "react";
import { Check, ChevronDown, Search, MapPin, Globe, Building2, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { postcodeValidator, type CountryCode } from "postcode-validator";
import { Country as ICountry, State as IState, City as ICity } from "country-state-city";
import getSymbolFromCurrency from 'currency-symbol-map';

// Dynamic imports for heavy dependencies
let countries: any;
let Country: any;
let State: any;
let City: any;

// Lazy load the dependencies
const loadDependencies = async () => {
  if (!countries) {
    const [isoCountries, csc] = await Promise.all([
      import("i18n-iso-countries"),
      import("country-state-city")
    ]);
    countries = isoCountries.default;
    Country = csc.Country;
    State = csc.State;
    City = csc.City;

    // Register English locale
    const en = await import("i18n-iso-countries/langs/en.json");
    countries.registerLocale(en);
  }
};

// Add utility function for phone number formatting
const formatPhoneNumber = (phoneNumber: string) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Format based on length (basic formatting)
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

export const getCountries = async () => {
  await loadDependencies();
  const allCountries = Country.getAllCountries();
  const countries = allCountries.map((country: any) => ({
    name: country.name,
    isoCode: country.isoCode,
    phonecode: country.phonecode,
    currency: country.currency,
    currencySymbol: getSymbolFromCurrency(country.currency),
    flag: country.flag,
  }));
  return countries;

}


const formatPhoneNumberByCountryFormat = (phoneNumber: string, countryCode: string): string => {
    const country = Country.getAllCountries().find((c: any) => c.isoCode === countryCode);
    if (!country) return phoneNumber;
    const format = country.phoneNumberFormat || "###-###-####";
    let cleaned = phoneNumber.replace(/\D/g, "");
    let formatted = "";
    let formatIndex = 0;
    for (let i = 0; i < format.length; i++) {
      if (format[i] === "#") {
        if (formatIndex < cleaned.length) {
          formatted += cleaned[formatIndex];
          formatIndex++;
        } else {
          break;
        }
      } else {
        formatted += format[i];
      }
    }
    return formatted;
  }




// Add utility function for validating postal code
const validatePostalCode = (postalCode: string, countryCode: CountryCode) => {
  return postcodeValidator(postalCode, countryCode);
};

const getLocationCodes = (countryName: string, stateName: string) => {
  const country = ICountry.getAllCountries().find((c) => c.name === countryName);
  const countryCode = country ? country.isoCode : null;
  let stateCode = null;
  if (countryCode) {
    const state = IState.getStatesOfCountry(country?.isoCode).find(s => s.name === stateName);
    stateCode = state ? state.isoCode : null;
  }
  return { countryCode, stateCode };
};

const getCountryCodeByName = (countryName: string): string | null => {
  const country = ICountry.getAllCountries().find((c) => c.name === countryName);
  return country ? country.isoCode : null;
};



abstract class LocationUtils {
  static getCountryCodeByName(countryName: string): string | null {
    const country = Country.getAllCountries().find((c: any) => c.name === countryName);
    return country ? country.isoCode : null;
  }

  static getCountryNameByCode(countryCode: string): string | null {
    const country = Country.getAllCountries().find((c: any) => c.isoCode === countryCode);
    return country ? country.name : null;
  }

  static formatPhoneNumberByCountryFormat(phoneNumber: string, countryCode: string): string {
    const country = Country.getAllCountries().find((c: any) => c.isoCode === countryCode);
    if (!country) return phoneNumber;
    const format = country.phoneNumberFormat || "###-###-####";
    let cleaned = phoneNumber.replace(/\D/g, "");
    let formatted = "";
    let formatIndex = 0;
    for (let i = 0; i < format.length; i++) {
      if (format[i] === "#") {
        if (formatIndex < cleaned.length) {
          formatted += cleaned[formatIndex];
          formatIndex++;
        } else {
          break;
        }
      } else {
        formatted += format[i];
      }
    }
    return formatted;
  }

  static getStateCodeByName(countryCode: string, stateName: string): string | null {
    const state = State.getStatesOfCountry(countryCode).find((s: any) => s.name === stateName);
    return state ? state.isoCode : null;
  }

  static getOrMatchPhoneCode(phoneNumber: string, countryCode: string): { phoneCode: string | null; phoneNumber: string | null } {
    const country = Country.getAllCountries().find((c: any) => c.isoCode === countryCode);
    let phoneCodeMatch;
    phoneCodeMatch = phoneNumber.match(new RegExp(`^(\\+${country.phonecode})(.*)$`));
    if (phoneCodeMatch) {
      const phoneCodeFromMatch = phoneCodeMatch[1];
      const phoneNumberFromMatch = phoneCodeMatch[2].toString().trim();
      return { phoneCode: phoneCodeFromMatch, phoneNumber: phoneNumberFromMatch };
    }
    return {
      phoneCode: null, phoneNumber: null
    };
  }
}

interface LocationData {
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  phoneCode?: string;
}

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (value: string, countryData?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  styleVariant?: 'default' | 'plain';
}

// Phone Code Input cross-filter with Country Selected value 
interface PhoneSelectorProps {
  value?: string;
  onValueChange?: (value: string, phoneCodeData?: any) => void;
  onCountryCodeChange?: (countryCode: string, countryData?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  countryCode?: string;
  styleVariant?: 'default' | 'plain';
}

interface StateSelectorProps {
  value?: string;
  onValueChange?: (value: string, stateData?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  countryCode?: string;
  styleVariant?: 'default' | 'plain';
}

interface CitySelectorProps {
  value?: string;
  onValueChange?: (value: string, cityData?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  countryCode?: string;
  stateCode?: string;
  styleVariant?: 'default' | 'plain';
}

interface PostalCodeInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  countryCode?: string;
  onValidate?: (isValid: boolean) => void;
  styleVariant?: 'default' | 'plain';
}

interface AddressAutocompleteProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
    stateCode?: string;
  }) => void;
  countryCode?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  styleVariant?: 'default' | 'plain';
}

const CountrySelector = React.forwardRef<HTMLButtonElement, CountrySelectorProps>(
  ({ value, onValueChange, placeholder = "Select country...", className, disabled, readonly, styleVariant = 'default', ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [allCountries, setAllCountries] = React.useState<any[]>([]);

    React.useEffect(() => {
      loadDependencies().then(() => {
        setAllCountries(Country.getAllCountries());
        setIsLoading(false);
      });
    }, []);

    const filteredCountries = allCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        country.isoCode.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const selectedCountry = allCountries.find((country) => country.isoCode === value);

    if (isLoading) {
      return (
        <Button variant="outline" disabled className="w-full justify-between h-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading countries...</span>
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-10 px-4 py-2 rounded-md border-2 bg-background hover:bg-secondary hover:text-secondary-foreground border-line-secondary text-sm transition-all duration-200",
              styleVariant === 'default' ? "bg-background border-line-secondary hover:border-line-primary hover:bg-surface-secondary" : "",
              "text-fg-primary",
              styleVariant === 'default' ? "focus:ring-1 focus:ring-accent-base/20 focus:border-accent-base" : "",
              disabled && "opacity-50 bg-bg-secondary/50 cursor-not-allowed",
              !selectedCountry && "text-fg-tertiary",
              readonly && "cursor-not-allowed focus-visible:ring-0 bg-bg-secondary/50 text-fg-tertiary",
              className,
            )}
            {...props}
          >
            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 opacity-60" />
              {selectedCountry ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="truncate">{selectedCountry.name}</span>
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 border bg-surface-primary border-line-secondary"
          align="start"
          role="dialog"
          aria-label="Select country"
        >
          <Command>
            <div className="flex items-center border-b border-line-secondary">
              {/* <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
              <CommandInput
                placeholder="Search countries..."
                value={searchValue}
                onValueChange={setSearchValue}

                className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none text-fg-primary placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                aria-label="Search countries"
              />
            </div>
            <CommandList
              className="max-h-[240px] overflow-y-auto overflow-x-hidden"
            >
              <CommandEmpty className="py-6 text-center text-sm text-fg-tertiary">
                No country found.
              </CommandEmpty>
              <CommandGroup className="p-1">
                {filteredCountries.map((country) => (
                  <CommandItem
                    key={country.isoCode}
                    value={country.name}
                    onSelect={() => {
                      onValueChange?.(country.isoCode === value ? "" : country.isoCode, country);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors text-fg-primary hover:bg-accent aria-selected:bg-accent focus:bg-surface-secondary focus:outline-none"
                    role="option"
                    aria-selected={value === country.isoCode}
                  >
                    {/* <div className="flex items-center space-x-3"> */}

                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-lg" aria-hidden="true">{country.flag}</span>
                      <span className="font-medium">{country.name}</span>
                      {/* <span className="text-xs text-slate-500 dark:text-slate-400">{country.isoCode}</span> */}
                    </div>
                    {/* </div> */}
                    <Check className={cn("h-4 w-4", value === country.isoCode ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
CountrySelector.displayName = "CountrySelector";

const PhoneCodeSelector = React.forwardRef<HTMLButtonElement, PhoneSelectorProps>(
  ({ value, onValueChange, onCountryCodeChange, placeholder = "Enter phone number", className, disabled, readonly, countryCode, styleVariant = "default", ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [allPhoneCodes, setAllPhoneCodes] = React.useState<any[]>([]);

    React.useEffect(() => {
      loadDependencies().then(() => {
        setAllPhoneCodes(Country.getAllCountries());
        setIsLoading(false);
      });
    }, []);

    // Initialize phone number from value prop
    const phoneNumber = value || "";

    const filteredPhoneCodes = allPhoneCodes.filter(
      (phoneCode) =>
        phoneCode.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        phoneCode.isoCode.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/\D/g, "");
      // Pass the phone number back to parent
      onValueChange?.(inputValue);
    };

    const handleCountryCodeChange = (selectedCountryCode: string) => {
      onCountryCodeChange?.(selectedCountryCode, allPhoneCodes.find((phoneCode) => phoneCode.isoCode === selectedCountryCode));
    };

    // Use countryCode prop to determine selected country, not value
    const selectedPhoneCode = allPhoneCodes.find((phoneCode) => phoneCode.isoCode === countryCode);
    const selectedCountry = allPhoneCodes.find((phoneCode) => phoneCode.isoCode === countryCode);

    if (isLoading) {
      return (
        <div className="flex items-stretch">
          <Button variant="outline" disabled className="h-10 px-3 rounded-r-none border-r-0">
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
          <Input disabled className="rounded-l-none border-l-0" />
        </div>
      );
    }

    return (
      <div className={cn("flex", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn( 
                "min-w-[155px] cursor-pointer focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary focus-visible:border-primary border-2 border-r-1  h-10 px-4 py-2 rounded-r-none ml-2 py-2 bg-background",
              styleVariant === 'default' ? "bg-background border-line-secondary hover:border-line-primary hover:bg-surface-secondary" : "",
              "text-fg-primary",
              styleVariant === 'default' ? "focus:ring-1 focus:ring-primary focus:border-primary" : "",
              disabled && "opacity-50 bg-bg-secondary/50 cursor-not-allowed",
              !selectedPhoneCode && "text-fg-tertiary",
              readonly && "cursor-not-allowed focus-visible:ring-0 bg-bg-secondary/50 text-fg-tertiary",
              className,
              )}
              {...props}
            >
              {/* {selectedCountry ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="truncate">{selectedCountry.name}</span>
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )} */}


              <div className="flex items-center space-x-3 min-w-0">
                <Phone className="h-4 w-4 opacity-60" />
                {selectedPhoneCode ? (
                  <div className="flex items-center space-x-2">
                    <span className="truncate">{`+${selectedPhoneCode.phonecode}`}</span>
                  </div>
                ) : (
                  <span className="truncate">Dial Code</span>
                )}
                {/* 

                <span className="text-lg">
                  {selectedPhoneCode ? ( selectedPhoneCode.flag ) : ("🌐")}
                </span>
                <span className="text-sm font-mono truncate">
                  {selectedPhoneCode ? (`+${selectedPhoneCode.phonecode}`) : ("+1")}
                </span> */}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[200px]  p-0 border bg-surface-primary border-line-secondary"
            // className="w-[calc(var(--radix-popover-trigger-width)+50px)] p-0 border bg-surface-primary border-line-secondary"
            align="start"
            role="dialog"
            aria-label="Select country code"
          >
            <Command>
              <div className="flex items-center border-b border-line-secondary w-full">
                {/* <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
                <CommandInput
                  placeholder="Search Calling Code..."
                  value={searchValue}
                  onValueChange={setSearchValue}

                  className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none text-fg-primary placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                  aria-label="Search Phone Codes"
                />
              </div>
              <CommandList
                className="max-h-[240px] overflow-y-auto overflow-x-hidden"
              >
                <CommandEmpty className="py-6 text-center text-sm text-fg-tertiary">
                  No country found.
                </CommandEmpty>
                <CommandGroup className="p-1">
                  {filteredPhoneCodes.map((phoneCode) => (
                    <CommandItem
                      key={phoneCode.isoCode}
                      value={phoneCode.name}
                      onSelect={() => {
                        handleCountryCodeChange(phoneCode.isoCode);
                        setOpen(false);
                        setSearchValue("");
                      }}
                      className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors hover:bg-surface-secondary aria-selected:bg-surface-secondary focus:bg-surface-secondary focus:outline-none"
                      role="option"
                      aria-selected={countryCode === phoneCode.isoCode}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-lg flex-shrink-0" aria-hidden="true">{phoneCode.flag}</span>

                        <span className="font-medium truncate">{phoneCode.name}</span>
                        <span className="text-xs text-fg-tertiary font-mono">
                          +{phoneCode.phonecode}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          countryCode === phoneCode.isoCode ? "opacity-100" : "opacity-0"
                        )}
                        aria-hidden="true"
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Input
            type="tel"
            placeholder={placeholder}
            value={formatPhoneNumber(phoneNumber)}
            onChange={handlePhoneChange}
            disabled={disabled}
            className={cn(
              "pl-2 rounded-l-none border-l-0 focus:border-l-0",
            )}
          />
        </div>
      </div>
    );
  },
);
PhoneCodeSelector.displayName = "PhoneCodeSelector";

const StateSelector = React.forwardRef<HTMLButtonElement, StateSelectorProps>(
  ({ value, onValueChange, placeholder = "Select state...", className, disabled, readonly, countryCode, styleVariant = 'default', ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [allStates, setAllStates] = React.useState<any[]>([]);

    React.useEffect(() => {
      loadDependencies().then(() => {
        if (countryCode) {
          setAllStates(State.getStatesOfCountry(countryCode));
        } else {
          setAllStates([]);
        }
        setIsLoading(false);
      });
    }, [countryCode]);

    const filteredStates = allStates.filter(
      (state) =>
        state.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        state.isoCode.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const selectedState = allStates.find((state) => state.isoCode === value);

    if (isLoading && countryCode) {
      return (
        <Button variant="outline" disabled className="w-full justify-between h-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading states...</span>
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-readonly={readonly}
            disabled={disabled || !countryCode}
            className={cn(
              "w-full justify-between h-10 px-4 py-2 rounded-md border-2 border-line-secondary text-sm transition-all duration-200",
              styleVariant === 'default' ? "bg-background border-line-secondary hover:border-line-primary hover:bg-surface-secondary" : "",
              "text-fg-primary",
              styleVariant === 'default' ? "focus:ring-1 focus:ring-accent-base/20 focus:border-accent-base" : "",
              disabled && readonly && "opacity-50 cursor-not-allowed",
              countryCode && 'bg-background hover:bg-secondary hover:text-secondary-foreground',
              !countryCode && "opacity-50 cursor-not-allowed",
              !selectedState && "text-fg-tertiary",
              className,
            )}
            {...props}
          >
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 opacity-60" />
              <span className="truncate">
                {selectedState ? selectedState.name : countryCode ? placeholder : "Select country first"}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 border bg-surface-primary border-line-secondary"
          align="start"
          role="dialog"
          aria-label="Select state"
        >
          <Command className="text-fg-primary">
            <div className="flex items-center border-b border-line-secondary">
              {/* <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
              <CommandInput
                placeholder="Search states..."
                value={searchValue}
                onValueChange={setSearchValue}

                className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none text-fg-primary placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                aria-label="Search states"
              />
            </div>
            <CommandList
              className="max-h-[240px] overflow-y-auto overflow-x-hidden"
            >
              <CommandEmpty className="py-6 text-center text-sm text-fg-tertiary">
                No state found.
              </CommandEmpty>
              <CommandGroup className="p-1">
                {filteredStates.map((state) => (
                  <CommandItem
                    key={state.isoCode}
                    value={state.name}
                    onSelect={() => {
                      onValueChange?.(state.isoCode === value ? "" : state.isoCode, state);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors text-fg-primary hover:bg-accent aria-selected:bg-accent focus:bg-surface-secondary focus:outline-none"
                    role="option"
                    aria-selected={value === state.isoCode}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{state.name}</span>
                      <span className="text-xs text-fg-tertiary">{state.isoCode}</span>
                    </div>
                    <Check className={cn("h-4 w-4", value === state.isoCode ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
StateSelector.displayName = "StateSelector";

const CitySelector = React.forwardRef<HTMLButtonElement, CitySelectorProps>(
  (
    { value, onValueChange, placeholder = "Select city...", className, disabled, readonly, countryCode, stateCode, styleVariant = 'default', ...props },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [allCities, setAllCities] = React.useState<any[]>([]);

    React.useEffect(() => {
      loadDependencies().then(() => {
        if (countryCode && stateCode) {
          setAllCities(City.getCitiesOfState(countryCode, stateCode));
        } else {
          setAllCities([]);
        }
        setIsLoading(false);
      });
    }, [countryCode, stateCode]);

    const filteredCities = allCities.filter((city) => city.name.toLowerCase().includes(searchValue.toLowerCase()));

    const selectedCity = allCities.find((city) => city.name === value);

    if (isLoading && countryCode && stateCode) {
      return (
        <Button variant="outline" disabled className="w-full justify-between h-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading cities...</span>
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !countryCode || !stateCode}
            className={cn(
              "w-full justify-between h-10 px-4 py-2 rounded-md border-2 border-line-secondary text-sm transition-all duration-200",
              styleVariant === 'default' ? "bg-background border-line-secondary hover:border-line-primary hover:bg-surface-secondary" : "",
              "text-fg-primary",
              styleVariant === 'default' ? "focus:ring-1 focus:ring-accent-base/20 focus:border-accent-base" : "",
              (readonly || disabled || !countryCode || !stateCode) && "opacity-50 cursor-not-allowed",
              countryCode && stateCode && 'bg-background hover:bg-secondary hover:text-secondary-foreground',
              !selectedCity && "text-fg-tertiary",
              className,
            )}
            {...props}

          >
            <div className="flex items-center space-x-3">
              <Building2 className="h-4 w-4 opacity-60" />
              <span className="truncate">
                {selectedCity ? selectedCity.name : countryCode && stateCode ? placeholder : "Select state first"}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 border bg-surface-primary border-line-secondary"
          align="start"
          role="dialog"
          aria-label="Select city"
        >
          <Command className="text-fg-primary">
            <div className="flex items-center border-b border-line-secondary">
              {/* <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
              <CommandInput
                placeholder="Search cities..."
                value={searchValue}
                onValueChange={setSearchValue}

                className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none text-fg-primary placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                aria-label="Search cities"
              />
            </div>
            <CommandList
              className="max-h-[240px] overflow-y-auto overflow-x-hidden"
            >
              <CommandEmpty className="py-6 text-center text-sm text-fg-tertiary">
                No city found.
              </CommandEmpty>
              <CommandGroup className="p-1">
                {filteredCities.map((city) => (
                  <CommandItem
                    key={`${city.name}-${city.stateCode}`}
                    value={city.name}
                    onSelect={() => {
                      onValueChange?.(city.name === value ? "" : city.name, city);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors text-fg-primary hover:bg-accent aria-selected:bg-accent focus:bg-surface-secondary focus:outline-none"
                    role="option"
                    aria-selected={value === city.name}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{city.name}</span>
                      {city.latitude && city.longitude && (
                        <span className="text-xs text-fg-tertiary">
                          {city.latitude}, {city.longitude}
                        </span>
                      )}
                    </div>
                    <Check className={cn("h-4 w-4", value === city.name ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
CitySelector.displayName = "CitySelector";

const PostalCodeInput = React.forwardRef<HTMLInputElement, PostalCodeInputProps>(
  (
    {
      value,
      onValueChange,
      placeholder = "Enter postal code...",
      className,
      disabled,
      countryCode,
      onValidate,
      styleVariant = 'default',
      ...props
    },
    ref,
  ) => {
    const [isValid, setIsValid] = React.useState(true);
    const [showError, setShowError] = React.useState(false);

    const validatePostalCode = (code: string, country: string) => {
      if (!code) return true;

      // Use postcode-validator package for comprehensive validation
      try {
        // return postcodeValidator.validate(code, country);
        return postcodeValidator(code, country);
      } catch (error) {
        // If country not supported, return true (don't block)
        return true;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onValueChange?.(newValue);

      // Clear error while typing
      if (showError) {
        setShowError(false);
      }
    };

    const handleBlur = () => {
      // Only validate if there's a value - don't show error for empty field
      if (value && value.trim() && countryCode) {
        const valid = validatePostalCode(value, countryCode);
        setIsValid(valid);
        setShowError(!valid);
        onValidate?.(valid);
      } else {
        // Clear validation state when field is empty
        setIsValid(true);
        setShowError(false);
        onValidate?.(true);
      }
    };

    return (
      <div className="relative flex-1">
        <Input
          ref={ref}
          type="text"
          value={value || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={!isValid ? "postal-code-error" : undefined}
          aria-label="Postal code"
          aria-description="Enter your postal code"
          className={cn(
            "flex items-center justify-between h-10 px-3 text-sm transition-all duration-200",
            styleVariant === 'default' ? "bg-surface-primary border-line-secondary" : "",
            "text-fg-primary",
            styleVariant === 'default' ? "focus:ring-1 focus:ring-accent-base/20 focus:border-accent-base" : "",
            !disabled && "hover:bg-surface-secondary hover:border-line-primary",
            disabled && "opacity-50 cursor-not-allowed",
            !isValid && "text-fg-tertiary",
            className,
          )}
          {...props}
        />
        {showError && !isValid && (
          <p id="postal-code-error" className="mt-1 text-xs text-destructive" role="alert">
            Please enter a valid postal code for the selected country
          </p>
        )}
      </div>
    );
  },
);
PostalCodeInput.displayName = "PostalCodeInput";

const AddressAutocomplete = React.forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  (
    {
      value,
      onValueChange,
      onAddressSelect,
      countryCode,
      placeholder = "Enter street address...",
      className,
      disabled,
      styleVariant = 'default',
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState(value || "");
    const [suggestions, setSuggestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const searchAddress = async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          addressdetails: '1',
          limit: '5',
        });

        if (countryCode) {
          params.append('countrycodes', countryCode.toLowerCase());
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              'User-Agent': 'AutlifyApp/1.0',
            },
          }
        );

        const data = await response.json();

        // Deduplicate suggestions based on unique address combinations
        const uniqueSuggestions = data.reduce((acc: any[], current: any) => {
          const addr = current.address;
          const street = addr.road || addr.neighbourhood || current.display_name.split(',')[0];
          const key = `${addr.house_number || ''}-${street}-${addr.postcode || ''}-${addr.city || addr.town || ''}`;

          // Only add if this combination doesn't exist yet
          if (!acc.find(item => {
            const itemAddr = item.address;
            const itemStreet = itemAddr.road || itemAddr.neighbourhood || item.display_name.split(',')[0];
            const itemKey = `${itemAddr.house_number || ''}-${itemStreet}-${itemAddr.postcode || ''}-${itemAddr.city || itemAddr.town || ''}`;
            return itemKey === key;
          })) {
            acc.push(current);
          }
          return acc;
        }, []);

        setSuggestions(uniqueSuggestions);
        // Auto-open dropdown when suggestions are loaded
        if (uniqueSuggestions.length > 0) {
          setOpen(true);
        }
      } catch (error) {
        console.error('Address search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
      onValueChange?.(newValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        searchAddress(newValue);
      }, 500);
    };

    const handleInputFocus = () => {
      if (suggestions.length > 0) {
        setOpen(true);
      }
    };

    const handleSelectAddress = (suggestion: any) => {
      const addr = suggestion.address;

      // Build street from road + house_number
      let street: string;
      if (addr.road) {
        const streetComponents = [];
        if (addr.house_number) streetComponents.push(addr.house_number);
        streetComponents.push(addr.road);
        street = streetComponents.join(' ');
      } else {
        // No road - use neighbourhood or first part of display name
        street = addr.neighbourhood || suggestion.display_name.split(',')[0].trim();
      }


      const iLocationCodes = getLocationCodes(addr.country, addr.state) || undefined;

      setSearchValue(street);
      onValueChange?.(street);

      onAddressSelect?.({
        street,
        city: addr.city || addr.town || addr.village || addr.municipality,
        state: addr.state,
        stateCode: iLocationCodes.stateCode || '',
        postalCode: addr.postcode,
        country: addr.country,
        countryCode: addr.country_code ? addr.country_code.toUpperCase() : iLocationCodes.countryCode || '',
      });

      setOpen(false);
      setSuggestions([]);
    };

    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    React.useEffect(() => {
      setSearchValue(value || "");
    }, [value]);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(className)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-fg-tertiary" />
          </div>
        )}
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 p-0 border rounded-lg bg-surface-primary border-line-secondary shadow-lg">
            <Command>
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandGroup>
                  {suggestions.map((suggestion, index) => {
                    const addr = suggestion.address;
                    // Format: "Street, Postcode, City, State"
                    const street = addr.road || addr.neighbourhood || suggestion.display_name.split(',')[0];
                    const parts = [];

                    if (addr.house_number) parts.push(addr.house_number);
                    parts.push(street);

                    const location = [];
                    if (addr.postcode) location.push(addr.postcode);
                    if (addr.city) location.push(addr.city);
                    else if (addr.town) location.push(addr.town);
                    if (addr.state) location.push(addr.state);

                    const displayText = `${parts.join(' ')}, ${location.join(', ')}`;

                    // Get building name for reference (first part of display_name if different from road)
                    const firstPart = suggestion.display_name.split(',')[0].trim();
                    const buildingName = (firstPart !== street && firstPart !== addr.road)
                      ? firstPart
                      : addr.commercial || addr.railway || addr.building || addr.amenity;

                    return (
                      <CommandItem
                        key={`${suggestion.place_id}-${index}`}
                        value={suggestion.display_name}
                        onSelect={() => handleSelectAddress(suggestion)}
                        className="flex flex-col items-start px-3 py-2 text-sm cursor-pointer transition-colors text-fg-primary hover:bg-surface-secondary"
                      >
                        <span className="font-medium">{displayText}</span>
                        {buildingName && (
                          <span className="text-xs text-fg-tertiary">
                            {buildingName}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    );
  },
);
AddressAutocomplete.displayName = "AddressAutocomplete";

export {
  CountrySelector,
  StateSelector,
  CitySelector,
  PostalCodeInput,
  PhoneCodeSelector,
  AddressAutocomplete,
  formatPhoneNumberByCountryFormat,
  type LocationData,
  LocationUtils,
}
