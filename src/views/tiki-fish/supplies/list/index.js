// ** React Imports
import { Fragment } from 'react'

// ** Supplies List Component
import Table from './Table'

// ** Breadcrumb
import Breadcrumbs from '@components/breadcrumbs'

// ** Styles
import '@styles/react/apps/app-users.scss'

const SuppliesList = () => {
  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Supplies Monitoring' breadCrumbParent='Supplier Management' breadCrumbActive='Supplies Monitoring' />
      <Table />
    </Fragment>
  )
}

export default SuppliesList
