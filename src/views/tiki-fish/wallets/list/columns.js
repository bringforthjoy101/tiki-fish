// ** React Imports
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'

import { getAllData, deleteWallet } from '../store/action'
import { store } from '@store/storeConfig/store'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// ** Third Party Components
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { MoreVertical, FileText, Trash2, Slack, User, Settings } from 'react-feather'

// ** Renders Client Columns
const renderClient = row => {
  const stateNum = Math.floor(Math.random() * 6),
    states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
    color = states[stateNum]

  if (row.avatar) {
    return <Avatar className='mr-1' img={row.avatar} width='32' height='32' />
  } else {
    return <Avatar color={color || 'primary'} className='mr-1' content={`${row.fullName}` || 'John Doe'} initials />
  }
}

// ** Renders Role Columns
const renderRole = row => {
  
  const roleObj = {
    subscriber: {
      class: 'text-primary',
      icon: User
    },
    maintainer: {
      class: 'text-success',
      icon: Database
    },
    editor: {
      class: 'text-info',
      icon: Edit
    },
    author: {
      class: 'text-warning',
      icon: Settings
    },
    admin: {
      class: 'text-danger',
      icon: Slack
    }
  }

  const Icon = roleObj[row.role] ? roleObj[row.role].icon : User

  return (
    <span className='text-truncate text-capitalize align-middle'>
      <Icon size={18} className={`${roleObj[row.role] ? roleObj[row.role].class : 'text-primary'} mr-50`} />
      {row.role_name || 'User'}
    </span>
  )
}

const statusObj = {
  active: 'light-success',
  suspended: 'light-warning'
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
      const deleted = await store.dispatch(deleteWallet(id))
      if (deleted.status) {
        await store.dispatch(getAllData())
          MySwal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Customer record has been deleted.',
              customClass: {
                confirmButton: 'btn btn-primary'
              }
          })
      }
    }
  })
}

const userData = JSON.parse(localStorage.getItem('userData'))

export const columns = [
  {
    name: 'Wallet Name',
    minWidth: '297px',
    selector: 'name',
    sortable: true,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center'>
        {/* {renderClient(row)} */}
        <div className='d-flex flex-column'>
          <Link
            to={`/wallets/view/${row.id}`}
            className='user-name text-truncate mb-0'
          >
            <span className='font-weight-bold'>{row.name}</span>
          </Link> 
        </div>
      </div>
    )
  },
  {
    name: 'Wallet Balance',
    minWidth: '150px',
    selector: 'balance',
    sortable: true,
    cell: row => <span className="text-capitalize"> {row.balance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
  },
  {
    name: 'Wallet Overdraft',
    minWidth: '150px',
    selector: 'overdraft',
    sortable: true,
    cell: row => <span className="text-capitalize">{row.overdraft.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
  },
  // {
  //   name: 'Status',
  //   minWidth: '80px',
  //   selector: 'status',
  //   sortable: true,
  //   cell: row => (
  //     <Badge className='text-capitalize' color={statusObj[row.status]} pill>
  //       {row.status}
  //     </Badge>
  //   )
  // },
  {
    name: 'Actions',
    minWidth: '100px',
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
            to={`/wallets/view/${row.id}`}
            className='w-100'
          >
            <FileText size={14} className='mr-50' />
            <span className='align-middle'>Details</span>
          </DropdownItem>
          {/* <DropdownItem
            tag={Link}
            to={`/customer/edit/${row.id}`}
            className='w-100'
            // onClick={() => store.dispatch(getUser(row.id))}
          >
            <Archive size={14} className='mr-50' />
            <span className='align-middle'>Edit</span>
          </DropdownItem> */}
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
