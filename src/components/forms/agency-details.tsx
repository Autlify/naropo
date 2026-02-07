'use client'
import { Agency } from '@/generated/prisma/client'
import React, { useEffect, useState } from 'react'
import { NumberInput } from '@tremor/react'
import { v4 } from 'uuid'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  CountrySelector,
  StateSelector,
  CitySelector,
  PostalCodeInput,
  PhoneCodeSelector,
  AddressAutocomplete
} from '@/components/global/location'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import * as z from 'zod'
import FileUpload from '@/components/global/file-upload'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  deleteAgency,
  initUser,
  saveActivityLogsNotification,
  updateAgencyDetails,
  upsertAgency,
} from '@/lib/queries'
import { Button } from '@/components/ui/button'
import Loading from '@/components/global/loading'
import Stripe from 'stripe'
import { StripeCustomerType } from '@/lib/types'
import { Plan } from '@/generated/prisma/client'
import { City, Country, State } from 'country-state-city'

type Props = {
  data?: Partial<Agency>
  selectedPlan?: Plan
}

const FormSchema = z.object({
  name: z.string().min(2, { message: 'Agency name must be atleast 2 chars.' }),
  companyEmail: z.string().min(1),
  companyPhone: z.string().min(1),
  whiteLabel: z.boolean(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  countryCode: z.string().optional(),
  stateCode: z.string().optional(),
  phoneCode: z.string().optional(),
  agencyLogo: z.string().min(1),
})

const AgencyDetails = ({ data, selectedPlan }: Props) => {
  const { toast } = useToast()
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [deletingAgency, setDeletingAgency] = useState(false)
  const [phoneCode, setPhoneCode] = useState(data?.companyPhone || '')
  const [countryCode, setCountryCode] = useState(data?.country || '')
  const [stateCode, setStateCode] = useState(data?.state || '')
  const [city, setCity] = useState(data?.city || '')
  const [phoneNumber, setPhoneNumber] = useState(data?.companyPhone || '')

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: data?.name || '',
      companyEmail: data?.companyEmail || '',
      phoneCode: data?.companyPhone || '',
      companyPhone: data?.companyPhone || '',
      whiteLabel: data?.whiteLabel || false,
      line1: data?.line1 || '',
      line2: data?.line2 || '',
      city: data?.city || '',
      postalCode: data?.postalCode || '',
      state: data?.state,
      country: data?.country || '',
      countryCode: data?.country || '',
      stateCode: data?.state || '',
      agencyLogo: data?.agencyLogo || '',
    },
  })
  const isLoading = form.formState.isSubmitting

  // Auto-detect location on mount (only for new agencies)
  useEffect(() => {
    if (!data?.id && !countryCode) {
      const detectLocation = async () => {
        try {
          // Use ipapi.co for free IP geolocation
          const response = await fetch('https://ipapi.co/json/')
          const locationData = await response.json()

          if (locationData.country_code) {
            const { Country } = await import('country-state-city')
            const countries = Country.getAllCountries()
            const detectedCountry = countries.find(c => c.isoCode === locationData.country_code)

            if (detectedCountry) {
              // Set country
              setCountryCode(detectedCountry.isoCode)
              form.setValue('country', detectedCountry.name)
              form.setValue('countryCode', detectedCountry.isoCode)

              // Set phone code
              const phoneCodeValue = `+${detectedCountry.phonecode}`
              setPhoneCode(phoneCodeValue)
              form.setValue('phoneCode', phoneCodeValue)
            }
          }
        } catch (error) {
          console.log('Location detection failed, using defaults')
        }
      }
      detectLocation()
    }
  }, [data?.id, countryCode, form])


  useEffect(() => {
    if (data) {
      const country = Country.getAllCountries().find(c => c.name === data?.country)
      const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === data?.state)
      const city = City.getCitiesOfState(state?.countryCode || '', state?.isoCode || '').find(c => c.name === data?.city)
      const phoneCodeMatch = data?.companyPhone && country ? data.companyPhone.match(new RegExp(`^(\\+${country.phonecode})(.*)$`)) : null
      const phoneCodeFromMatch = phoneCodeMatch ? phoneCodeMatch[1] : null
      const phoneNumberFromMatch = phoneCodeMatch ? phoneCodeMatch[2].toString().trim() : null

      setCountryCode(country ? country.isoCode : '')
      form.setValue('country', country ? country.name : data.country || '')
      form.setValue('countryCode', country ? country.isoCode : '')
      setStateCode(state ? state.isoCode : '')
      form.setValue('state', state ? state.name : data.state || '')
      form.setValue('stateCode', state ? state.isoCode : '')
      setCity(city ? city.name : '')
      form.setValue('city', city ? city.name : data.city || '')
      form.setValue('postalCode', data.postalCode || '')
      setPhoneCode(phoneCodeFromMatch || '')
      form.setValue('phoneCode', phoneCodeFromMatch || '')
      setPhoneNumber(phoneNumberFromMatch || data.companyPhone || '')
    }
  }, [data, form])

  const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      // Use form.getValues() instead of values parameter to get all form data
      const formData = form.getValues()

      let newUserData
      let custId
      if (!data?.id) {
        const bodyData = {
          email: formData.companyEmail,
          name: formData.name,
          shipping: {
            address: {
              city: formData.city,
              country: formData.country,
              line1: formData.line1,
              line2: formData.line2 || undefined,
              postal_code: formData.postalCode,
              state: formData.state,
            },
            name: formData.name,
          },
          address: {
            city: formData.city,
            country: formData.country,
            line1: formData.line1,
            line2: formData.line2 || undefined,
            postal_code: formData.postalCode,
            state: formData.state,
          },
        } as StripeCustomerType

        const customerResponse = await fetch('/api/stripe/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        })
        const customerData: { customerId: string } =
          await customerResponse.json()
        custId = customerData.customerId
      }

      newUserData = await initUser({})
      if (!data?.customerId && !custId) return

      const response = await upsertAgency({
        id: data?.id ? data.id : v4(),
        customerId: data?.customerId || custId || '',
        line1: formData.line1,
        line2: formData.line2 || '',
        agencyLogo: formData.agencyLogo,
        city: formData.city,
        companyPhone: `${formData.phoneCode} ${formData.companyPhone}`,
        country: formData.country,
        name: formData.name,
        state: formData.state as string,
        whiteLabel: formData.whiteLabel,
        postalCode: formData.postalCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyEmail: formData.companyEmail,
        connectAccountId: '',
        goal: 5,
        taxIdentityId: null,
      })
      toast({
        title: 'Created Agency',
      })
      if (data?.id) return router.refresh()
      if (response) {
        // Force session update to refresh activeRole and activeAgencyId
        await updateSession()

        // If user selected a paid plan, redirect to billing for payment
        if (selectedPlan) {
          window.location.href = `/agency/${response.id}/billing?plan=${selectedPlan}`
          return
        }
        // Otherwise, redirect to agency dashboard
        window.location.href = `/agency/${response.id}`
        return
      }
    } catch (error) {
      console.error('Agency creation error:', error)
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: error instanceof Error ? error.message : 'Could not create your agency',
      })
    }
  }
  const handleDeleteAgency = async () => {
    if (!data?.id) return
    setDeletingAgency(true)
    //WIP: discontinue the subscription
    try {
      const response = await deleteAgency(data.id)
      toast({
        title: 'Deleted Agency',
        description: 'Deleted your agency and all subaccounts',
      })
      router.refresh()
    } catch (error) {
      console.log(error)
      toast({
        variant: 'destructive',
        title: 'Oppse!',
        description: 'could not delete your agency ',
      })
    }
    setDeletingAgency(false)
  }

  return (
    <AlertDialog>
      <Card className="w-full bg-gradient-to-br from-muted/20 to-transparent border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Agency Information</CardTitle>
          <CardDescription className="text-sm">
            Lets create an agency for you business. You can edit agency settings
            later from the agency settings tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                disabled={isLoading}
                control={form.control}
                name="agencyLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Logo</FormLabel>
                    <FormControl>
                      <FileUpload
                        apiEndpoint="agencyLogo"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Agency Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your agency name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Agency Email</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          className="text-gray-500 cursor-not-allowed"
                          placeholder="Email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                disabled={isLoading}
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Phone Number</FormLabel>
                    <FormControl>
                      <PhoneCodeSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        countryCode={countryCode}
                        onCountryCodeChange={(code, countryData) => {
                          setCountryCode(code)
                          form.setValue('phoneCode', countryData?.phonecode || '')
                        }}
                        placeholder="Enter phone number"
                        disabled={isLoading}
                        styleVariant="plain"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isLoading}
                control={form.control}
                name="whiteLabel"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border gap-4 p-4">
                      <div>
                        <FormLabel>Whitelabel Agency</FormLabel>
                        <FormDescription>
                          Turning on whilelabel mode will show your agency logo
                          to all sub accounts by default. You can overwrite this
                          functionality through sub account settings.
                        </FormDescription>
                      </div>

                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )
                }}
              />

              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="line2"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          className="italic text-sm"
                          placeholder="Apartment, suite, unit, building, floor, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem className="w-40">
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <PostalCodeInput
                          value={field.value}
                          onValueChange={field.onChange}
                          countryCode={countryCode}
                          placeholder="Enter postal code"
                          disabled={isLoading}
                          styleVariant="plain"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                disabled={isLoading}
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value}
                        onValueChange={field.onChange}
                        onAddressSelect={async (address) => {
                          // Only auto-fill street and location data
                          form.setValue('line1', address.street);

                          // Auto-fill city if available
                          if (address.city) {
                            form.setValue('city', address.city);
                          }

                          // Auto-fill postal code ONLY if not already filled
                          const currentPostalCode = form.getValues('postalCode');
                          if (address.postalCode && !currentPostalCode) {
                            form.setValue('postalCode', address.postalCode);
                          }

                          // Auto-fill state if available
                          if (address.state && countryCode) {
                            const { State } = await import('country-state-city');
                            const states = State.getStatesOfCountry(countryCode);
                            const matchedState = states.find(
                              s => s.name.toLowerCase() === address.state?.toLowerCase() ||
                                s.isoCode.toLowerCase() === address.state?.toLowerCase()
                            );
                            if (matchedState) {
                              setStateCode(matchedState.isoCode);
                              form.setValue('state', matchedState.name);
                              form.setValue('stateCode', matchedState.isoCode);
                            } else {
                              // Even if no match, clear the state to allow manual selection
                              setStateCode('');
                              form.setValue('state', address.state);
                              form.setValue('stateCode', '');
                            }
                          }
                        }}
                        countryCode={countryCode}
                        placeholder="type to search address"
                        disabled={isLoading}
                        styleVariant="plain"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <CitySelector
                          value={field.value}
                          onValueChange={(cityName) => {
                            form.setValue('city', cityName)
                          }}
                          countryCode={countryCode}
                          stateCode={stateCode}
                          placeholder="Select city"
                          disabled={isLoading}
                          styleVariant="plain"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <StateSelector
                          value={stateCode}
                          onValueChange={(code, stateData) => {
                            setStateCode(code)
                            form.setValue('state', stateData?.name || '')
                            form.setValue('stateCode', code)
                            form.setValue('city', '')
                          }}
                          countryCode={countryCode}
                          placeholder="Select state"
                          disabled={isLoading}
                          styleVariant="plain"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <CountrySelector
                          value={countryCode}
                          onValueChange={(code, countryData) => {
                            setCountryCode(code)
                            setStateCode('') // Reset state when country changes
                            form.setValue('country', countryData?.name || '')
                            form.setValue('countryCode', code)
                            form.setValue('state', '')
                            form.setValue('stateCode', '')
                            form.setValue('city', '')
                          }}
                          placeholder="Select country"
                          disabled={isLoading}
                          styleVariant="plain"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {data?.id && (
                <div className="flex flex-col gap-2">
                  <Label>Create A Goal</Label>
                  <p className="text-muted-foreground text-sm">
                    ✨ Create a goal for your agency. As your business grows
                    your goals grow too so dont forget to set the bar higher!
                  </p>
                  <NumberInput
                    defaultValue={data?.goal}
                    onValueChange={async (val) => {
                      if (!data?.id) return
                      await updateAgencyDetails(data.id, { goal: val })
                      await saveActivityLogsNotification({
                        agencyId: data.id,
                        description: `Updated the agency goal to | ${val} Sub Account`,
                        subaccountId: undefined,
                      })
                      router.refresh()
                    }}
                    min={1}
                    className="bg-background !border !border-input"
                    placeholder="Sub Account Goal"
                  />
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loading /> : 'Save Agency Information'}
              </Button>
            </form>
          </Form>

          {data?.id && (
            <div className="flex flex-row items-center justify-between rounded-lg border border-destructive gap-4 p-4 mt-4">
              <div>
                <div>Danger Zone</div>
              </div>
              <div className="text-muted-foreground">
                Deleting your agency cannpt be undone. This will also delete all
                sub accounts and all data related to your sub accounts. Sub
                accounts will no longer have access to funnels, contacts etc.
              </div>
              <AlertDialogTrigger
                disabled={isLoading || deletingAgency}
                className="text-red-600 p-2 text-center mt-2 rounded-md hove:bg-red-600 hover:text-white whitespace-nowrap"
              >
                {deletingAgency ? 'Deleting...' : 'Delete Agency'}
              </AlertDialogTrigger>
            </div>
          )}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-left">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                This action cannot be undone. This will permanently delete the
                Agency account and all related sub accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex items-center">
              <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deletingAgency}
                className="bg-destructive hover:bg-destructive"
                onClick={handleDeleteAgency}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </CardContent>
      </Card>
    </AlertDialog>
  )
}

export default AgencyDetails
