// ** React Imports
import { Fragment } from 'react'

// ** Supplier List Component
import Table from './Table'

// ** Breadcrumb
import Breadcrumbs from '@components/breadcrumbs'

// ** Styles
import '@styles/react/apps/app-users.scss'

const SuppliersList = () => {
  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Suppliers' breadCrumbParent='Supplier Management' breadCrumbActive='Suppliers List' />
      <Table />
    </Fragment>
  )
}

export default SuppliersList 