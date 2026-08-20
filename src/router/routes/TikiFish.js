import { lazy } from 'react'
import { Redirect } from 'react-router-dom'

const userData = JSON.parse(localStorage.getItem('userData'))

/**
 * The finance screens, available to every `role`.
 *
 * This file picks a route array by `role` - the OPERATIONS axis - but finance access is
 * `accessRole`, a deliberately independent axis (see api/helpers/permissions.js). A clerk
 * hired to key expenses is likely to be role 'store' or 'sales-rep' with accessRole 'clerk';
 * with these routes only in ManagerRoutes, the capability-built menu would show them an
 * Expenses link that lands on the 404 page. The nav decides what is offered and the API
 * enforces what is permitted, so listing the routes for everyone opens nothing.
 */
const FinanceRoutes = [
  {
    path: '/expenses/list',
    component: lazy(() => import('../../views/tiki-fish/expenses/list'))
  },
  {
    path: '/payroll/workers',
    component: lazy(() => import('../../views/tiki-fish/payroll/workers'))
  },
  {
    path: '/payroll/runs',
    exact: true,
    component: lazy(() => import('../../views/tiki-fish/payroll/runs'))
  },
  {
    path: '/payroll/runs/view/:id',
    component: lazy(() => import('../../views/tiki-fish/payroll/runs/view')),
    meta: {
      navLink: '/payroll/runs'
    }
  },
  {
    path: '/payroll/staff-cost',
    component: lazy(() => import('../../views/tiki-fish/payroll/staff-cost'))
  },
  {
    path: '/assets/list',
    component: lazy(() => import('../../views/tiki-fish/assets/list'))
  },
  {
    path: '/reference',
    component: lazy(() => import('../../views/tiki-fish/reference'))
  },
  {
    path: '/procurement/list',
    component: lazy(() => import('../../views/tiki-fish/procurement/list'))
  },
  {
    path: '/procurement/view/:id',
    component: lazy(() => import('../../views/tiki-fish/procurement/view')),
    meta: {
      navLink: '/procurement/list'
    }
  },
  {
    path: '/stock-counts/list',
    component: lazy(() => import('../../views/tiki-fish/stock-count/list'))
  },
  {
    path: '/stock-counts/view/:id',
    component: lazy(() => import('../../views/tiki-fish/stock-count/view')),
    meta: {
      navLink: '/stock-counts/list'
    }
  },
  {
    path: '/inventory/stock-on-hand',
    component: lazy(() => import('../../views/tiki-fish/inventory/list'))
  },
  {
    path: '/production/list',
    component: lazy(() => import('../../views/tiki-fish/production/list'))
  },
  {
    path: '/production/view/:id',
    component: lazy(() => import('../../views/tiki-fish/production/view')),
    meta: {
      navLink: '/production/list'
    }
  }
]

const ManagerRoutes = [
    {
        path: '/apps/ecommerce/shop',
        className: 'ecommerce-application',
        component: lazy(() => import('../../views/tiki-fish/ecommerce/shop'))
    },
    {
        path: '/apps/ecommerce/wishlist',
        className: 'ecommerce-application',
        component: lazy(() => import('../../views/tiki-fish/ecommerce/wishlist'))
    },
    {
        path: '/apps/ecommerce/product-detail',
        exact: true,
        className: 'ecommerce-application',
        component: () => <Redirect to='/apps/tiki-fish/product-detail/apple-i-phone-11-64-gb-black-26' />
    },
    {
        path: '/apps/ecommerce/product-detail/:product',
        exact: true,
        className: 'ecommerce-application',
        component: lazy(() => import('../../views/tiki-fish/ecommerce/detail')),
        meta: {
          navLink: '/apps/ecommerce/product-detail'
        }
    },
    {
        path: '/apps/ecommerce/checkout',
        className: 'ecommerce-application',
        component: lazy(() => import('../../views/tiki-fish/ecommerce/checkout'))
    },
    {
        path: '/admins/list',
        component: lazy(() => import('../../views/tiki-fish/admin/list'))
      },
      {
        path: '/admin/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/admin/view/1' />
      },
      {
        path: '/admin/view/:id',
        component: lazy(() => import('../../views/tiki-fish/admin/view')),
        meta: {
          navLink: '/tiki-fish/admin/view'
        }
      },
      {
        path: '/admin/edit',
        exact: true,
        component: () => <Redirect to='/admin/edit/1' />
      },
      {
        path: '/admin/edit/:id',
        component: lazy(() => import('../../views/tiki-fish/admin/edit')),
        meta: {
          navLink: '/admin/edit'
        }
      },
      {
        path: '/customers/list',
        component: lazy(() => import('../../views/tiki-fish/customer/list'))
      },
      {
        path: '/customer/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/customer/view/1' />
      },
      {
        path: '/customer/view/:id',
        component: lazy(() => import('../../views/tiki-fish/customer/view')),
        meta: {
          navLink: '/tiki-fish/customer/view'
        }
      },
      {
        path: '/products/list',
        component: lazy(() => import('../../views/tiki-fish/product/list'))
      },
      {
        path: '/product/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/product/view/1' />
      },
      {
        path: '/product/view/:id',
        component: lazy(() => import('../../views/tiki-fish/product/view')),
        meta: {
          navLink: '/tiki-fish/product/view'
        }
      },
      {
        path: '/product/edit',
        exact: true,
        component: () => <Redirect to='/product/edit/1' />
      },
      {
        path: '/product/edit/:id',
        component: lazy(() => import('../../views/tiki-fish/product/edit')),
        meta: {
          navLink: '/product/edit'
        }
      },
      {
        path: '/orders/list',
        component: lazy(() => import('../../views/tiki-fish/order/list'))
      },
      {
        path: '/order/preview',
        exact: true,
        component: () => <Redirect to='/tiki-fish/order/preview/1' />
      },
      {
        path: '/order/preview/:id',
        component: lazy(() => import('../../views/tiki-fish/order/preview')),
        meta: {
          navLink: '/tiki-fish/order/preview'
        }
      },
      {
        path: '/order/print/:id',
        layout: 'BlankLayout',
        component: lazy(() => import('../../views/tiki-fish/order/print'))
      },
      {
        path: '/reports/list',
        component: lazy(() => import('../../views/tiki-fish/reports/list')),
      },
      {
        path: '/withdrawals/list',
        component: lazy(() => import('../../views/tiki-fish/withdrawals/list')),
      },
      {
        path: '/settlements/list',
        component: lazy(() => import('../../views/tiki-fish/settlement/list'))
      },
      {
        path: '/settings/list',
        component: lazy(() => import('../../views/tiki-fish/settings/list'))
      },
      {
        path: '/transactions/list',
        component: lazy(() => import('../../views/tiki-fish/transactions/list')),
      },
      {
        path: '/wallets/list',
        component: lazy(() => import('../../views/tiki-fish/wallets/list'))
      },
      {
        path: '/wallets/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/wallets/view/1' />
      },
      {
        path: '/wallets/view/:id',
        component: lazy(() => import('../../views/tiki-fish/wallets/view')),
        meta: {
          navLink: '/tiki-fish/wallets/view'
        }
      },
      {
        path: '/investments/packages/list',
        component: lazy(() => import('../../views/tiki-fish/investment/list'))
      },
      {
        path: '/investments/packages/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/investments/packages/view/1' />
      },
      {
        path: '/investments/packages/view/:id',
        component: lazy(() => import('../../views/tiki-fish/investment/view')),
        meta: {
          navLink: '/tiki-fish/investments/packages/view'
        }
      },
      {
        path: '/investments/investors/list',
        component: lazy(() => import('../../views/tiki-fish/guests/list'))
      },
      {
        path: '/investments/investors/view',
        exact: true,
        component: () => <Redirect to='/tiki-fish/investments/investors/view/1' />
      },
      {
        path: '/investments/investors/view/:id',
        component: lazy(() => import('../../views/tiki-fish/guests/view')),
        meta: {
          navLink: '/tiki-fish/investments/investors/view'
        }
      },
      {
        path: '/suppliers/list',
        component: lazy(() => import('../../views/tiki-fish/supplier/list'))
      },
      {
        path: '/supplies/list',
        component: lazy(() => import('../../views/tiki-fish/supplies/list'))
      },
      {
        path: '/supplier/view',
        exact: true,
        component: () => <Redirect to='/supplier/view/1' />
      },
      {
        path: '/supplier/view/:id',
        component: lazy(() => import('../../views/tiki-fish/supplier/view')),
        meta: {
          navLink: '/supplier/view'
        }
      },
      {
        path: '/supplier/edit',
        exact: true,
        component: () => <Redirect to='/supplier/edit/1' />
      },
      {
        path: '/supplier/edit/:id',
        component: lazy(() => import('../../views/tiki-fish/supplier/edit')),
        meta: {
          navLink: '/supplier/edit'
        }
      },
]

const BursaryRoutes = [
  {
    path: '/apps/ecommerce/shop',
    className: 'ecommerce-application',
    component: lazy(() => import('../../views/tiki-fish/ecommerce/shop'))
  },
  {
      path: '/apps/ecommerce/wishlist',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/wishlist'))
  },
  {
      path: '/apps/ecommerce/product-detail',
      exact: true,
      className: 'ecommerce-application',
      component: () => <Redirect to='/apps/tiki-fish/product-detail/apple-i-phone-11-64-gb-black-26' />
  },
  {
      path: '/apps/ecommerce/product-detail/:product',
      exact: true,
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/detail')),
      meta: {
        navLink: '/apps/ecommerce/product-detail'
      }
  },
  {
      path: '/apps/ecommerce/checkout',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/checkout'))
  },
  {
    path: '/admins/list',
    component: lazy(() => import('../../views/tiki-fish/admin/list'))
  },
  {
    path: '/admin/view',
    exact: true,
    component: () => <Redirect to='/tiki-fish/admin/view/1' />
  },
  {
    path: '/admin/view/:id',
    component: lazy(() => import('../../views/tiki-fish/admin/view')),
    meta: {
      navLink: '/tiki-fish/admin/view'
    }
  },
  {
    path: '/customers/list',
    component: lazy(() => import('../../views/tiki-fish/customer/list'))
  },
  {
    path: '/customer/view',
    exact: true,
    component: () => <Redirect to='/tiki-fish/customer/view/1' />
  },
  {
    path: '/customer/view/:id',
    component: lazy(() => import('../../views/tiki-fish/customer/view')),
    meta: {
      navLink: '/tiki-fish/customer/view'
    }
  },
  {
    path: '/orders/list',
    component: lazy(() => import('../../views/tiki-fish/order/list'))
  },
  {
    path: '/order/view',
    exact: true,
    component: () => <Redirect to='/tiki-fish/order/view/1' />
  },
  {
    path: '/order/view/:id',
    component: lazy(() => import('../../views/tiki-fish/order/view')),
    meta: {
      navLink: '/tiki-fish/order/view'
    }
  },
  {
    path: '/withdrawals/list',
    component: lazy(() => import('../../views/tiki-fish/withdrawals/list')),
  },
  {
    path: '/settlements/list',
    component: lazy(() => import('../../views/tiki-fish/settlement/list'))
  },
  {
    path: '/transactions/list',
    component: lazy(() => import('../../views/tiki-fish/transactions/list')),
  },
]

const SalesRepRoutes = [
  {
    path: '/apps/ecommerce/shop',
    className: 'ecommerce-application',
    component: lazy(() => import('../../views/tiki-fish/ecommerce/shop'))
  },
  {
      path: '/apps/ecommerce/wishlist',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/wishlist'))
  },
  {
      path: '/apps/ecommerce/product-detail',
      exact: true,
      className: 'ecommerce-application',
      component: () => <Redirect to='/apps/tiki-fish/product-detail/apple-i-phone-11-64-gb-black-26' />
  },
  {
      path: '/apps/ecommerce/product-detail/:product',
      exact: true,
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/detail')),
      meta: {
        navLink: '/apps/ecommerce/product-detail'
      }
  },
  {
      path: '/apps/ecommerce/checkout',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/checkout'))
  },
  {
    path: '/customers/list',
    component: lazy(() => import('../../views/tiki-fish/customer/list'))
  },
  {
    path: '/customer/view',
    exact: true,
    component: () => <Redirect to='/tiki-fish/customer/view/1' />
  },
  {
    path: '/customer/view/:id',
    component: lazy(() => import('../../views/tiki-fish/customer/view')),
    meta: {
      navLink: '/tiki-fish/customer/view'
    }
  },
  {
    path: '/orders/list',
    component: lazy(() => import('../../views/tiki-fish/order/list'))
  },
  {
    path: '/order/preview',
    exact: true,
    component: () => <Redirect to='/tiki-fish/order/preview/1' />
  },
  {
    path: '/order/preview/:id',
    component: lazy(() => import('../../views/tiki-fish/order/preview')),
    meta: {
      navLink: '/tiki-fish/order/preview'
    }
  },
  {
    path: '/order/print/:id',
    layout: 'BlankLayout',
    component: lazy(() => import('../../views/tiki-fish/order/print'))
  },
  {
    path: '/reports/list',
    component: lazy(() => import('../../views/tiki-fish/reports/list')),
  },
  {
    path: '/withdrawals/list',
    component: lazy(() => import('../../views/tiki-fish/withdrawals/list')),
  },
  {
    path: '/transactions/list',
    component: lazy(() => import('../../views/tiki-fish/transactions/list')),
  },
]

const StoreRoutes = [
  {
    path: '/apps/ecommerce/shop',
    className: 'ecommerce-application',
    component: lazy(() => import('../../views/tiki-fish/ecommerce/shop'))
  },
  {
      path: '/apps/ecommerce/wishlist',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/wishlist'))
  },
  {
      path: '/apps/ecommerce/product-detail',
      exact: true,
      className: 'ecommerce-application',
      component: () => <Redirect to='/apps/tiki-fish/product-detail/apple-i-phone-11-64-gb-black-26' />
  },
  {
      path: '/apps/ecommerce/product-detail/:product',
      exact: true,
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/detail')),
      meta: {
        navLink: '/apps/ecommerce/product-detail'
      }
  },
  {
      path: '/apps/ecommerce/checkout',
      className: 'ecommerce-application',
      component: lazy(() => import('../../views/tiki-fish/ecommerce/checkout'))
  },
  {
    path: '/withdrawals/list',
    component: lazy(() => import('../../views/tiki-fish/withdrawals/list')),
  },
  {
    path: '/transactions/list',
    component: lazy(() => import('../../views/tiki-fish/transactions/list')),
  }
]

const byRole = {
  admin: ManagerRoutes,
  store: BursaryRoutes,
  'sales-rep': SalesRepRoutes
}

export default [...(byRole[userData?.role] || StoreRoutes), ...FinanceRoutes]
