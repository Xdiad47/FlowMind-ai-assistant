import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  )
}
