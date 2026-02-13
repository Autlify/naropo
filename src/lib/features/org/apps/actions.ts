import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { KEYS } from '../../../registry';
import { requireAgencyAccess, requireSubAccountAccess } from '../../iam/authz/require';
import { installApp, AppServiceError, uninstallApp } from './service';


export async function installAppAgencyAction(formData: FormData) {
  'use server';
  const agencyId = String(formData.get('agencyId') || '');
  const appKey = String(formData.get('appKey') || '');
  if (!agencyId || !appKey) return;

  // License boundary: requires active subscription (handled in requireAgencyAccess) + apps.manage permission.
  await requireAgencyAccess({
    agencyId,
    permissionKeys: [KEYS.org.apps.app.manage],
    requireActiveSubscription: true,
    redirectTo: `/agency/${agencyId}/apps`,
  });

  try {
    await installApp({ appKey, agencyId, subAccountId: null });
  } catch (e: any) {
    if (e instanceof AppServiceError && e.code === 'NOT_ENTITLED') {
      redirect(`/agency/${agencyId}/billing?action=upgrade&app=${encodeURIComponent(appKey)}`);
    }
    throw e;
  }

  revalidatePath(`/agency/${agencyId}/apps`);
  revalidatePath(`/agency/${agencyId}/apps/${appKey}`);
}

export async function uninstallAppAgencyAction(formData: FormData) {
  'use server';
  const agencyId = String(formData.get('agencyId') || '');
  const appKey = String(formData.get('appKey') || '');
  if (!agencyId || !appKey) return;

  await requireAgencyAccess({
    agencyId,
    permissionKeys: [KEYS.org.apps.app.manage],
    requireActiveSubscription: true,
    redirectTo: `/agency/${agencyId}/apps`,
  });

  await uninstallApp({ appKey, agencyId, subAccountId: null });

  revalidatePath(`/agency/${agencyId}/apps`);
  revalidatePath(`/agency/${agencyId}/apps/${appKey}`);
} 

export async function installAppSubAccountAction(formData: FormData) {
  'use server'
  const subAccountId = String(formData.get('subAccountId') || '')
  const appKey = String(formData.get('appKey') || '')
  if (!subAccountId || !appKey) return

  const ctx = await requireSubAccountAccess({
    subAccountId,
    permissionKeys: [KEYS.org.apps.app.manage],
    requireActiveAgencySubscription: true,
    redirectTo: `/subaccount/${subAccountId}/apps`,
  })

  try {
    await installApp({ appKey, agencyId: ctx.agencyId, subAccountId })
  } catch (e: any) {
    if (e instanceof AppServiceError && e.code === 'NOT_ENTITLED') {
      redirect(`/agency/${ctx.agencyId}/billing?action=upgrade&app=${encodeURIComponent(appKey)}`)
    }
    throw e
  }

  revalidatePath(`/subaccount/${subAccountId}/apps`)
  revalidatePath(`/subaccount/${subAccountId}/apps/${appKey}`)
}

export async function uninstallAppSubAccountAction(formData: FormData) {
  'use server'
  const subAccountId = String(formData.get('subAccountId') || '')
  const appKey = String(formData.get('appKey') || '')
  if (!subAccountId || !appKey) return

  const ctx = await requireSubAccountAccess({
    subAccountId,
    permissionKeys: [KEYS.org.apps.app.manage],
    requireActiveAgencySubscription: true,
    redirectTo: `/subaccount/${subAccountId}/apps`,
  })

  await uninstallApp({ appKey, agencyId: ctx.agencyId, subAccountId })

  revalidatePath(`/subaccount/${subAccountId}/apps`)
  revalidatePath(`/subaccount/${subAccountId}/apps/${appKey}`)
}

