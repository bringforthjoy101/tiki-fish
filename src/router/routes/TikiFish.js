import { lazy } from 'react'
import { Redirect } from 'react-router-dom'

const userData = JSON.parse(localStorage.getItem('userData'))


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
        path: '/settlements/list',
        component: lazy(() => import('../../views/tiki-fish/settlement/list'))
      },
      {
        path: '/settings/list',
        component: lazy(() => import('../../views/tiki-fish/settings/list'))
      }
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
    path: '/settlements/list',
    component: lazy(() => import('../../views/tiki-fish/settlement/list'))
  }
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
  // {
  //   path: '/customer/view',
  //   exact: true,
  //   component: () => <Redirect to='/tiki-fish/customer/view/1' />
  // },
  // {
  //   path: '/customer/view/:id',
  //   component: lazy(() => import('../../views/tiki-fish/customer/view')),
  //   meta: {
  //     navLink: '/tiki-fish/customer/view'
  //   }
  // }
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
  }
]

export default userData?.role === 'admin' ? ManagerRoutes : userData?.role === 'store' ? BursaryRoutes : userData?.role === 'sales-rep' ? SalesRepRoutes : StoreRoutes
