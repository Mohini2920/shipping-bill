import ListDashboard from '@/dashboard/list-dashboard'
import { ApplicationLayout } from '@/shared/application-layout'
import { Route, RouteObject } from 'core/routing/route-utils'
import { routes } from './route-paths'

const homeWrapper = <ApplicationLayout />

export const routeObjects: RouteObject[] = [
  Route(routes.dashboard, <ListDashboard />, 'Shipping Bills', homeWrapper),
  Route(
    routes.shippingBillNew,
    () => import('@/shipping-bills/pages/shipping-bill-page'),
    'New Shipping Bill',
    homeWrapper
  ),
  Route(
    routes.shippingBillEdit,
    () => import('@/shipping-bills/pages/shipping-bill-page'),
    'Shipping Bill',
    homeWrapper
  ),
  // Misc
  Route('*', () => import('core/components/404-page'), 'Not Found')
]
