import { Truck, Package } from 'react-feather'

export default [
  {
    id: 'suppliers-menu',
    title: 'Suppliers',
    icon: <Truck size={20} />,
    children: [
      {
        id: 'suppliers-list',
        title: 'Suppliers List',
        icon: <Truck size={12} />,
        navLink: '/suppliers/list'
      },
      {
        id: 'supplies-list',
        title: 'Supplies Monitoring',
        icon: <Package size={12} />,
        navLink: '/supplies/list'
      }
    ]
  }
]