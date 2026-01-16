import { getAuthUserDetails } from '@/lib/queries'
import { off } from 'process'
import React from 'react'
import MenuOptions from './menu-options'

type Props = {
  id: string
  type: 'agency' | 'subaccount'
}

const Sidebar = async ({ id, type }: Props) => {
  const user = await getAuthUserDetails()
  if (!user) return null

  // Get the agency from memberships
  const agencyMembership = user.AgencyMemberships?.find(
    (membership) =>
      type === 'agency'
        ? membership.agencyId === id
        : membership.Agency.SubAccount.some((sub) => sub.id === id)
  )

  if (!agencyMembership) return null

  const agency = agencyMembership.Agency

  const details =
    type === 'agency'
      ? agency
      : agency.SubAccount.find((subaccount) => subaccount.id === id)

  const isWhiteLabeledAgency = agency.whiteLabel
  if (!details) return

  let sideBarLogo = agency.agencyLogo || '/assets/autlify-logo.svg'

  if (!isWhiteLabeledAgency) {
    if (type === 'subaccount') {
      sideBarLogo =
        agency.SubAccount.find((subaccount) => subaccount.id === id)
          ?.subAccountLogo || agency.agencyLogo
    }
  }

  const sidebarOpt =
    type === 'agency'
      ? agency.SidebarOption || []
      : agency.SubAccount.find((subaccount) => subaccount.id === id)
          ?.SidebarOption || []

  // Get subaccounts user has access to via SubAccountMemberships
  const subaccounts = agency.SubAccount.filter((subaccount) =>
    user.SubAccountMemberships?.some(
      (membership) =>
        membership.subAccountId === subaccount.id && membership.isActive
    )
  )

  return (
    <>
      <MenuOptions
        defaultOpen={true}
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
      />
      <MenuOptions
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
      />
    </>
  )
}

export default Sidebar
