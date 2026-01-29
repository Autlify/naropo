import { AuthForm } from '@/components/auth/auth-form'

export default function AgencyAuthTestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <AuthForm callbackUrl="/agency/test" />
      </div>
    </div>
  )
}