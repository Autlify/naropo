'use client'
import { Agency, SubAccount } from '@/generated/prisma/client'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useState } from 'react'
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import * as z from 'zod'
import FileUpload from '@/components/global/file-upload'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { saveActivityLogsNotification, upsertSubAccount } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import Loading from '@/components/global/loading'
import { useModal } from '@/providers/modal-provider'
import { City, Country, State } from 'country-state-city'

const FormSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  companyEmail: z.string().min(1, 'Email is required'),
  companyPhone: z.string().min(1, 'Phone number is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  subAccountLogo: z.string(),
  postalCode: z.string().min(1, 'Postal code is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  countryCode: z.string().optional(),
  stateCode: z.string().optional(),
  phoneCode: z.string().optional(),
})

//CHALLENGE Give access for Subaccount Guest they should see a different view maybe a form that allows them to create tickets

//CHALLENGE layout.tsx only runs once as a result if you remove permissions for someone and they keep navigating the layout.tsx wont fire again. solution- save the data inside metadata for current user.

interface SubAccountDetailsProps {
  //To add the sub account to the agency
  agencyDetails: Pick<Agency, 'id'>
  details?: Partial<SubAccount>
  userId: string
  userName: string
}

const SubAccountDetails: React.FC<SubAccountDetailsProps> = ({
  details,
  agencyDetails,
  userId,
  userName,
}) => {
  const { toast } = useToast()
  const { setClose } = useModal()
  const router = useRouter()
  const [countryCode, setCountryCode] = useState(details?.country || '')
  const [phoneCode, setPhoneCode] = useState(details?.companyPhone || '')
  const [stateCode, setStateCode] = useState(details?.state || '')
  const [city, setCity] = useState(details?.city || '')
  const [phoneNumber, setPhoneNumber] = useState(details?.companyPhone || '')




  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: details?.name || '',
      companyEmail: details?.companyEmail || '',
      companyPhone: details?.companyPhone || '',
      line1: details?.line1 || '',
      line2: details?.line2 || '',
      city: details?.city || '',
      postalCode: details?.postalCode || '',
      state: details?.state || '',
      country: details?.country || '',
      countryCode: details?.country || '',
      stateCode: details?.state || '',
      phoneCode: details?.companyPhone || '',
      subAccountLogo: details?.subAccountLogo || '',
    },
  })
  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    if (details) {
      const country = Country.getAllCountries().find(c => c.name === details?.country)
      const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === details?.state)
      const city = City.getCitiesOfState(state?.countryCode || '', state?.isoCode || '').find(c => c.name === details?.city)
      const phoneCodeMatch = details?.companyPhone && country ? details.companyPhone.match(new RegExp(`^(\\+${country.phonecode})(.*)$`)) : null
      const phoneCodeFromMatch = phoneCodeMatch ? phoneCodeMatch[1] : null
      const phoneNumberFromMatch = phoneCodeMatch ? phoneCodeMatch[2].toString().trim() : null

      setCountryCode(country ? country.isoCode : '')
      form.setValue('country', country ? country.name : details.country || '')
      form.setValue('countryCode', country ? country.isoCode : '')
      setStateCode(state ? state.isoCode : '')
      form.setValue('state', state ? state.name : details.state || '')
      form.setValue('stateCode', state ? state.isoCode : '')
      setCity(city ? city.name : '')
      form.setValue('city', city ? city.name : details.city || '')
      form.setValue('postalCode', details.postalCode || '')
      setPhoneCode(phoneCodeFromMatch || '')
      form.setValue('phoneCode', phoneCodeFromMatch || '')
      setPhoneNumber(phoneNumberFromMatch || details.companyPhone || '')
    }
  }, [details, form])

  const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      const formData = form.getValues()
      const bodyData = {
        id: details?.id ? details.id : v4(),
        line1: formData.line1,
        line2: formData.line2 || '',
        subAccountLogo: formData.subAccountLogo,
        city: formData.city,
        companyPhone: `${formData.phoneCode} ${formData.companyPhone}`,
        country: formData.country,
        name: formData.name,
        state: formData.state,
        postalCode: formData.postalCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyEmail: formData.companyEmail,
        agencyId: agencyDetails.id,
        connectAccountId: '',
        goal: 5,
        taxIdentityId: null,
      }
      const response = await upsertSubAccount(bodyData)
      if (!response) throw new Error('No response from server')
      await saveActivityLogsNotification({
        agencyId: response.agencyId,
        description: `${userName} | ${details?.id ? 'updated' : 'created'} sub-account | ${response.name}`,
        subaccountId: response.id,
      })
      toast({
        title: `Sub-Account ${details?.id ? 'updated' : 'created'}`,
        description: `Successfully ${details?.id ? 'updated' : 'created'} your sub-account.`,
      })
      setClose()
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oppse!',
        description: 'Could not create sub account.',
      })
    }
  }

  //CHALLENGE Create this form.
  return (
    <Card className="w-full min-w-[400px] h-screen md:h-fit bg-gradient-to-br from-muted/20 to-transparent border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sub-Account Information</CardTitle>
        <CardDescription className="text-sm">Please enter business details</CardDescription>
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
              name="subAccountLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Logo</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="subaccountLogo"
                      value={field.value}
                      onChange={field.onChange}
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
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input
                        required
                        placeholder="Account name"
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
                name="companyEmail"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>CompanyEmail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Phone</FormLabel>
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
                        if (address.state) {
                          setStateCode(address.stateCode || '')
                          form.setValue('state', address.state);
                          form.setValue('stateCode', address.stateCode || '');
                          form.setValue('city', ''); // Reset city when state changes
                        }

                        // Auto-fill country if available
                        if (address.country) {
                          setCountryCode(address.countryCode || '')
                          setStateCode('') // Reset state when country changes
                          form.setValue('country', address.country);
                          form.setValue('countryCode', address.countryCode || '');
                          form.setValue('state', '');
                          form.setValue('stateCode', '');
                          form.setValue('city', '');
                        }
                      }}
                      countryCode={countryCode}
                      placeholder="Enter street address..."
                      disabled={isLoading}
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

            <div className="flex md:flex-row gap-4">
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
            </div>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loading /> : 'Save Account Information'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SubAccountDetails
