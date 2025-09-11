import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { OrderHistory } from '@/components/dashboard/order-history'
import { AdBanner } from '@/components/shared/ad-banner'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdBanner />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <Button asChild>
          <Link href="/order">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Order
          </Link>
        </Button>
      </div>
      <OrderHistory />
    </div>
  )
}
