// ** React Imports
import { Link } from 'react-router-dom'
import moment from 'moment'

// ** Third Party Components
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { MoreVertical, Eye, CreditCard } from 'react-feather'

// ** Get Due Date Badge
const getDueDateBadge = (supply) => {
  // If paid, show paid badge
  if (supply.paymentStatus === 'paid') {
    return <Badge color='light-success' pill>Paid</Badge>
  }

  // If no due date
  if (!supply.paymentDueDate) {
    return <Badge color='light-secondary' pill>No Due Date</Badge>
  }

  const daysUntilDue = supply.daysUntilDue

  // If overdue
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue)
    return (
      <Badge color='light-danger' pill>
        {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
      </Badge>
    )
  }

  // If due today
  if (daysUntilDue === 0) {
    return <Badge color='light-danger' pill>Due today</Badge>
  }

  // If due within 7 days
  if (daysUntilDue <= 7) {
    return (
      <Badge color='light-warning' pill>
        Due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}
      </Badge>
    )
  }

  // If due within 30 days
  if (daysUntilDue <= 30) {
    return (
      <Badge color='light-info' pill>
        Due in {daysUntilDue} days
      </Badge>
    )
  }

  // Due more than 30 days
  return (
    <Badge color='light-success' pill>
      Due in {daysUntilDue} days
    </Badge>
  )
}

// ** Get Payment Status Badge
const getPaymentStatusBadge = (status) => {
  const statusColors = {
    paid: 'light-success',
    partial: 'light-warning',
    unpaid: 'light-danger'
  }

  return (
    <Badge color={statusColors[status] || 'light-secondary'} pill>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  )
}

// ** Get Supply Status Badge
const getSupplyStatusBadge = (status) => {
  const statusColors = {
    received: 'light-success',
    pending: 'light-warning',
    cancelled: 'light-danger'
  }

  return (
    <Badge color={statusColors[status] || 'light-secondary'} pill>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  )
}

// ** Format currency
const formatCurrency = (amount) => {
  return (amount || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
}

export const columns = (handlePaymentClick) => [
  {
    name: 'Supply Name',
    minWidth: '200px',
    selector: 'name',
    sortable: true,
    cell: row => (
      <div className='d-flex align-items-center'>
        <div className='d-flex flex-column'>
          <span className='font-weight-bold'>{row.name}</span>
          <small className='text-muted'>{moment(row.createdAt).format('ll')}</small>
        </div>
      </div>
    )
  },
  {
    name: 'Supplier',
    minWidth: '150px',
    selector: 'supplier',
    sortable: true,
    cell: row => (
      <Link
        to={`/supplier/view/${row.supplierId}`}
        className='font-weight-bold text-primary'
      >
        {row.supplier?.name || 'N/A'}
      </Link>
    )
  },
  {
    name: 'Total Amount',
    minWidth: '130px',
    selector: 'totalAmount',
    sortable: true,
    cell: row => <span className='font-weight-bold'>{formatCurrency(row.totalAmount)}</span>
  },
  {
    name: 'Amount Paid',
    minWidth: '130px',
    selector: 'amountPaid',
    sortable: true,
    cell: row => <span className='text-success'>{formatCurrency(row.amountPaid)}</span>
  },
  {
    name: 'Balance Due',
    minWidth: '130px',
    selector: 'amountDue',
    sortable: true,
    cell: row => (
      <span className={row.amountDue > 0 ? 'text-danger font-weight-bold' : 'text-success'}>
        {formatCurrency(row.amountDue)}
      </span>
    )
  },
  {
    name: 'Due Date',
    minWidth: '180px',
    selector: 'paymentDueDate',
    sortable: true,
    cell: row => (
      <div className='d-flex flex-column'>
        <span className='text-truncate mb-25'>
          {row.paymentDueDate ? moment(row.paymentDueDate).format('ll') : 'Not set'}
        </span>
        {getDueDateBadge(row)}
      </div>
    )
  },
  {
    name: 'Payment',
    minWidth: '100px',
    selector: 'paymentStatus',
    sortable: true,
    cell: row => getPaymentStatusBadge(row.paymentStatus)
  },
  {
    name: 'Status',
    minWidth: '100px',
    selector: 'status',
    sortable: true,
    cell: row => getSupplyStatusBadge(row.status)
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
            to={`/supplier/view/${row.supplierId}`}
            className='w-100'
          >
            <Eye size={14} className='mr-50' />
            <span className='align-middle'>View Supplier</span>
          </DropdownItem>
          {row.paymentStatus !== 'paid' && row.status !== 'cancelled' && (
            <DropdownItem
              className='w-100'
              onClick={() => handlePaymentClick(row)}
            >
              <CreditCard size={14} className='mr-50' />
              <span className='align-middle'>Make Payment</span>
            </DropdownItem>
          )}
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }
]
