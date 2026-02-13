import { useState } from 'react'
import { FaTwitter } from 'react-icons/fa'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from './profile-form'
import { SecuritySettings } from './security-settings'
import { PreferencesForm } from './preference-form'
import { AccessibilityForm } from './accessibility-form'
import { AgreementStatus } from './agreement-form'
// import { PermissionViewer } from './PermissionViewer'
// import { PermissionManagementDialog } from './PermissionManagementDialog'
// import { VoiceControlSettings } from '@/components/voice/VoiceControlSettings'
// import { VoiceCommandsDialog } from '@/components/voice/VoiceCommandsDialog'
import { Button } from '@/components/ui/button'
import { FaMicrophone } from 'react-icons/fa'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User, Subscription } from '@/generated/prisma/client'
import { PricingPlan } from '@autlify/billing-sdk'


export interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  keyboardNavigation: boolean
  screenReaderOptimized: boolean
  focusIndicators: boolean
}

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onUpdateProfile: (updates: Partial<User>) => void
  subscription?: PricingPlan
}

export function ProfileModal({ open, onOpenChange, user, onUpdateProfile, subscription }: ProfileModalProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPermissionManagement, setShowPermissionManagement] = useState(false)

//   const handleAccessibilityChange = (preferences: AccessibilityPreferences) => {
//     onUpdateProfile({ accessibilityPreferences: preferences })
//   }

//   const handlePermissionUpdate = (permissions: string[]) => {
//     onUpdateProfile({ permissions })
//   }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-2xl max-h-[90vh] overflow-hidden p-0',
          theme === 'dark' && 'glassmorphic'
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">Profile Settings</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                'rounded-lg p-2 transition-all',
                theme === 'light' && 'hover:shadow-md hover:bg-accent',
                theme === 'dark' && 'hover:bg-accent/10'
              )}
            >
              <FaTwitter className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-auto">
            <TabsTrigger
              value="profile"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="accessibility"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Accessibility
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Permissions
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Voice Control
            </TabsTrigger>
            <TabsTrigger
              value="agreements"
              className={cn(
                'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
                'px-4 py-2.5'
              )}
            >
              Agreements
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <TabsContent value="profile" className="mt-0 p-6">
              <ProfileForm user={user} onSubmit={onUpdateProfile} onClose={() => onOpenChange(false)} />
            </TabsContent>

            <TabsContent value="security" className="mt-0 p-6">
              <SecuritySettings onClose={() => onOpenChange(false)} userId={user.id} />
            </TabsContent>

            <TabsContent value="preferences" className="mt-0 p-6">
              <PreferencesForm onClose={() => onOpenChange(false)} />
            </TabsContent>

            <TabsContent value="accessibility" className="mt-0 p-6">
              {/* <AccessibilityForm 
                preferences={user?.preferences || {
                  highContrast: false,
                  largeText: false,
                  keyboardNavigation: true,
                  screenReaderOptimized: false,
                  focusIndicators: true,
                }}
                onChange={handleAccessibilityChange}
              /> */}
            </TabsContent>

            <TabsContent value="permissions" className="mt-0 p-6">
              {/* <PermissionViewer 
                userPermissions={user.permissions}
                currentApp={currentApplication}
                onManagePermissions={() => setShowPermissionManagement(true)}
              /> */}
            </TabsContent>

            <TabsContent value="voice" className="mt-0 p-6 space-y-6">
              {/* <VoiceControlSettings /> */}
              {/* <div className="flex justify-center">
                <VoiceCommandsDialog>
                  <Button size="lg" className="gap-2">
                    <Microphone size={20} weight="duotone" />
                    View All Voice Commands
                  </Button>
                </VoiceCommandsDialog>
              </div> */}
            </TabsContent>

            <TabsContent value="agreements" className="mt-0 p-6">
              {/* <AgreementStatus user={user!} subscription={subscription} /> */}
            </TabsContent>
          </div>
        </Tabs>

        {/* <PermissionManagementDialog
          open={showPermissionManagement}
          onOpenChange={setShowPermissionManagement}
          userPermissions={user.permissions}
          onUpdatePermissions={handlePermissionUpdate}
          currentApp={currentApplication}
          userName={user.name}
        /> */}
      </DialogContent>
    </Dialog>
  )
}