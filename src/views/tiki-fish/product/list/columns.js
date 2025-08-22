// ** React Imports
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'
import moment from 'moment'
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { Package, TrendingUp, AlertTriangle, MoreVertical, FileText, Archive, Trash2 } from 'react-feather'
import { getAllData, deleteProduct } from '../store/action'
import { store } from '@store/storeConfig/store'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// ** Third Party Components

// ** Renders Client Columns
const renderClient = row => {
  const stateNum = Math.floor(Math.random() * 6),
    states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
    color = states[stateNum]

  if (row.image) {
    return <Avatar className='mr-1' img={`${process.env.REACT_APP_IMAGE_PLACEHOLDER}/placeholder.png`} width='32' height='32' />
  } else {
    return <Avatar color={color || 'primary'} className='mr-1' content={`${row.name}` || 'Sample Product'} initials />
  }
}

const handleDelete = async (id) => {
  // const dispatch = useDispatch()
  return MySwal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-outline-danger ml-1'
    },
    buttonsStyling: false
  }).then(async function (result) {
    if (result.value) {
      const deleted = await store.dispatch(deleteProduct(id))
      if (deleted.status) {
        await store.dispatch(getAllData())
          MySwal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Product has been deleted.',
              customClass: {
                confirmButton: 'btn btn-primary'
              }
          })
      }
    }
  })
}

export const columns = [
  {
    name: 'Product Name',
    selector: 'id',
    minWidth: '250px',
    wrap: true,
    sortable: true,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center'>
        {renderClient(row)}
        <div className='d-flex flex-column'>
          <Link
            to={`/product/view/${row.id}`}
            className='user-name text-truncate mb-0'
          >
            <span className='font-weight-bold'>{row.name}</span>
          </Link>
          <small className='text-muted'>{row.description ? `${row.description.slice(0, 50)}...` : 'No description'}</small>
        </div>
      </div>
    )
  },
  {
    name: 'Price',
    selector: 'price',
    minWidth: '200px',
    wrap: true,
    sortable: true,
    cell: row => <span>{(row.price || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
  },
  {
    name: 'Stock',
    selector: 'qty',
    minWidth: '150px',
    sortable: true,
    cell: row => {
      const qty = Number(row.qty)
      let stockStatus = { color: 'success', text: 'In Stock', icon: <Package size={14} /> }
      
      if (qty === 0) {
        stockStatus = { color: 'danger', text: 'Out of Stock', icon: <AlertTriangle size={14} /> }
      } else if (qty < 10) {
        stockStatus = { color: 'warning', text: 'Low Stock', icon: <AlertTriangle size={14} /> }
      }
      
      return (
        <div>
          <Badge color={`light-${stockStatus.color}`} className='mb-1'>
            {stockStatus.icon} {stockStatus.text}
          </Badge>
          <div className='small'>{qty.toLocaleString()} {row.unit}</div>
        </div>
      )
    }
  },
  {
    name: 'Unit',
    selector: 'unit',
    sortable: true,
    cell: row => <span className="text-capitalize">{row.unitValue} {row.unit}</span>
  },
  {
    name: 'Category',
    selector: 'category',
    sortable: true,
    cell: row => <span className="text-capitalize">{row.category}</span>
  },
  {
    name: 'Profit Margin',
    selector: 'profit',
    minWidth: '150px',
    sortable: true,
    cell: row => {
      const totalCost = Number(row.costPrice || 0) + Number(row.smokeHousePrice || 0) + Number(row.packagingPrice || 0)
      const profit = Number(row.price || 0) - totalCost
      const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0
      
      return (
        <div>
          <Badge color={margin > 30 ? 'light-success' : margin > 15 ? 'light-warning' : 'light-danger'}>
            <TrendingUp size={12} /> {margin.toFixed(1)}%
          </Badge>
          <div className='small text-muted'>{profit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</div>
        </div>
      )
    }
  },
  {
    name: 'Created Date',
    selector: 'createdAt',
    sortable: true,
    minWidth: '150px',
    wrap: true,
    cell: row => (
      <div>
        <div>{moment(row.createdAt).format('DD MMM YYYY')}</div>
        <small className='text-muted'>{moment(row.createdAt).format('HH:mm')}</small>
      </div>
    )
  },
  {
    name: 'Actions',
    selector: 'name',
    sortable: true,
    cell: row => (
      <UncontrolledDropdown>
        <DropdownToggle tag='div' className='btn btn-sm'>
          <MoreVertical size={14} className='cursor-pointer' />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem
            tag={Link}
            to={`/product/view/${row.id}`}
            className='w-100'
          >
            <FileText size={14} className='mr-50' />
            <span className='align-middle'>Details</span>
          </DropdownItem>
          <DropdownItem
            tag={Link}
            to={`/product/edit/${row.id}`}
            className='w-100'
            // onClick={() => store.dispatch(getUser(row.id))}
          >
            <Archive size={14} className='mr-50' />
            <span className='align-middle'>Edit</span>
          </DropdownItem>
          <DropdownItem 
            className='w-100' 
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 size={14} className='mr-50' />
            <span className='align-middle'>Delete</span>
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }
]
