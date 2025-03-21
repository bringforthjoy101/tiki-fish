// ** React Imports
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { getSupplier, deleteSupplier } from '../store/action'
import { store } from '@store/storeConfig/store'

// ** Third Party Components
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { Slack, User, Settings, Database, Edit2, MoreVertical, FileText, Trash2, Archive } from 'react-feather'
import moment from 'moment'
import { apiRequest, swal } from '@utils'

// ** Renders Client Columns
const renderClient = row => {
  const stateNum = Math.floor(Math.random() * 6),
    states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
    color = states[stateNum]

  if (row.avatar) {
    return <Avatar className='mr-1' img={row.avatar} width='32' height='32' />
  } else {
    return <Avatar color={color || 'primary'} className='mr-1' content={row.name || 'John Doe'} initials />
  }
}

// ** Renders Status Columns
const renderStatus = row => {
  const statusObj = {
    active: {
      color: 'light-success',
      value: 'Active'
    },
    inactive: {
      color: 'light-secondary',
      value: 'Inactive'
    },
    pending: {
      color: 'light-warning',
      value: 'Pending'
    }
  }

  return <Badge className='text-capitalize' color={statusObj[row.status].color} pill>
    {statusObj[row.status].value}
  </Badge>
}

export const columns = (totalOwed = 0) => [
  {
    name: 'Supplier',
    minWidth: '297px',
    selector: 'name',
    sortable: true,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center'>
        {renderClient(row)}
        <div className='d-flex flex-column'>
          <Link
            to={`/supplier/view/${row.id}`}
            className='user-name text-truncate mb-0'
            onClick={() => store.dispatch(getSupplier(row.id))}
          >
            <span className='font-weight-bold'>{row.name}</span>
          </Link>
          <small className='text-truncate text-muted mb-0'>{row.phone}</small>
        </div>
      </div>
    )
  },
  {
    name: (
      <div>
        Total Owed{' '}
        <Badge color={totalOwed > 0 ? 'light-danger' : 'light-success'} pill>
          {totalOwed.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
        </Badge>
      </div>
    ),
    minWidth: '250px',
    selector: 'totalOwed',
    sortable: true,
    cell: row => <span className={row.statistics.totalOwed > 0 ? 'text-danger' : 'text-success'}>
      {(row.statistics.totalOwed || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
    </span>
  },
  {
    name: 'Total Paid',
    minWidth: '150px',
    selector: 'totalPaid',
    sortable: true,
    cell: row => <span>{(row.statistics.totalPaid || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
  },
  {
    name: 'Supplies',
    minWidth: '150px',
    selector: 'productsCount',
    sortable: true,
    cell: row => <span>{row.statistics.totalSupplies || 0}</span>
  },
  {
    name: 'Last Supply',
    minWidth: '150px',
    selector: 'lastSupplyDate',
    sortable: true,
    cell: row => <span>{row.statistics.lastSupplyDate ? moment(row.statistics.lastSupplyDate).format('ll') : '-'}</span>
  },
  {
    name: 'Status',
    minWidth: '100px',
    selector: 'status',
    sortable: true,
    cell: row => renderStatus(row)
  },
  {
    name: 'Actions',
    minWidth: '100px',
    cell: row => (
      <UncontrolledDropdown>
        <DropdownToggle tag='div' className='btn btn-sm'>
          <MoreVertical size={14} className='cursor-pointer' />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem
            tag={Link}
            to={`/supplier/view/${row.id}`}
            className='w-100'
            onClick={() => store.dispatch(getSupplier(row.id))}
          >
            <FileText size={14} className='mr-50' />
            <span className='align-middle'>Details</span>
          </DropdownItem>
          <DropdownItem
            tag={Link}
            to={`/supplier/edit/${row.id}`}
            className='w-100'
            onClick={() => store.dispatch(getSupplier(row.id))}
          >
            <Edit2 size={14} className='mr-50' />
            <span className='align-middle'>Edit</span>
          </DropdownItem>
          <DropdownItem className='w-100' onClick={() => store.dispatch(deleteSupplier(row.id))}>
            <Trash2 size={14} className='mr-50' />
            <span className='align-middle'>Delete</span>
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }
] 