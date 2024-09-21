// ** React Imports
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'
import moment from 'moment'
import { Badge } from 'reactstrap'

// ** Third Party Components

// ** Renders Client Columns
const renderClient = (row) => {
	const stateNum = Math.floor(Math.random() * 6),
		states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
		color = states[stateNum]

	if (row.avatar) {
		return <Avatar className="mr-1" img={row.avatar} width="32" height="32" />
	} else {
		return <Avatar color={color || 'primary'} className="mr-1" content={`${row.fullName}` || 'Customer Name'} initials />
	}
}

const getItemNames = (items) => {
	const arr = []
	console.log(items)
	const _items = process.env.NODE_ENV === 'production' ? JSON.parse(items) : JSON.parse(items)
	_items.forEach((item) => {
		arr.push(item.name)
	})
	const string = arr.join(', ')
	if (string.length < 35) return string
	return `${string.substring(0, 35)}...`
}

const orderStatus = {
	processing: 'light-warning',
	completed: 'light-success',
	cancelled: 'light-danger'
}

export const columns = [
	{
		name: 'Order Id',
		width: '150px',
		selector: 'trans_amount',
		sortable: true,
		cell: (row) => (
			<Link to={`/order/preview/${row.id}`}>
				<span>#{row.orderNumber}</span>
			</Link>
		),
	},
	{
		name: 'Order Amount',
		width: '150px',
		selector: 'amount',
		sortable: true,
		cell: (row) => <span className="text-capitalize">{row?.amount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>,
	},
	{
		name: 'Status ',
		minWidth: '100px',
		selector: 'status',
		sortable: true,
		cell: (row) => <Badge color={orderStatus[row.status]} pill>{row.status.toUpperCase()}</Badge>
	},
	{
		name: 'Customer',
		minWidth: '150px',
		selector: 'customer',
		sortable: true,
		cell: (row) => (
			<div className="d-flex justify-content-left align-items-center">
				{renderClient(row.customer)}
				<div className="d-flex flex-column">
					<Link to={`/customer/view/${row.customer.id}`} className="user-name text-truncate mb-0">
						<span className="font-weight-bold">
							{row.customer.fullName}
						</span>
					</Link>
				</div>
			</div>
		),
	},
	{
		name: 'Order Date',
		minWidth: '150px',
		selector: 'createdAt',
		sortable: true,
		cell: (row) => moment(row.createdAt).format('lll'),
	},
	{
		name: 'Initiated By',
		minWidth: '200px',
		selector: 'admin',
		sortable: true,
		cell: (row) => (
			<span className="font-weight-bold">
				{row.admin.firstName} {row.admin.lastName}
			</span>
		),
	},
]
