// ** React Imports
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'
import moment from 'moment'
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledTooltip, Button } from 'reactstrap'
import { MoreVertical, Edit, FileText, Archive, Trash, Eye, Clock, Package, CheckCircle, Truck, AlertCircle, XCircle, DollarSign, CreditCard, Info } from 'react-feather'

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

// Enhanced order status configuration
const orderStatus = {
	pending: { color: 'light-secondary', icon: <Clock size={12} />, label: 'Pending' },
	processing: { color: 'light-warning', icon: <Package size={12} />, label: 'Processing' },
	ready: { color: 'light-primary', icon: <CheckCircle size={12} />, label: 'Ready' },
	out_for_delivery: { color: 'light-info', icon: <Truck size={12} />, label: 'Out for Delivery' },
	delivered: { color: 'light-info', icon: <Truck size={12} />, label: 'Delivered' },
	completed: { color: 'light-success', icon: <CheckCircle size={12} />, label: 'Completed' },
	cancelled: { color: 'light-danger', icon: <XCircle size={12} />, label: 'Cancelled' },
	failed: { color: 'light-danger', icon: <AlertCircle size={12} />, label: 'Failed' },
	refunded: { color: 'light-dark', icon: <DollarSign size={12} />, label: 'Refunded' },
	on_hold: { color: 'light-warning', icon: <Info size={12} />, label: 'On Hold' }
}

// Payment status configuration
const paymentStatusConfig = {
	pending: { color: 'light-warning', icon: <Clock size={12} />, label: 'Pending' },
	processing: { color: 'light-info', icon: <CreditCard size={12} />, label: 'Processing' },
	paid: { color: 'light-success', icon: <CheckCircle size={12} />, label: 'Paid' },
	partial: { color: 'light-primary', icon: <DollarSign size={12} />, label: 'Partial' },
	success: { color: 'light-success', icon: <CheckCircle size={12} />, label: 'Success' },
	failed: { color: 'light-danger', icon: <XCircle size={12} />, label: 'Failed' },
	cancelled: { color: 'light-secondary', icon: <XCircle size={12} />, label: 'Cancelled' },
	refunded: { color: 'light-dark', icon: <DollarSign size={12} />, label: 'Refunded' }
}

export const columns = [
	{
		name: 'Order ID',
		minWidth: '130px',
		selector: 'orderNumber',
		sortable: true,
		cell: (row) => (
			<div>
				<Link to={`/order/preview/${row.id}`} className="text-primary font-weight-bold">
					#{row.orderNumber}
				</Link>
				<small className="text-muted d-block">{moment(row.createdAt).format('MMM DD')}</small>
			</div>
		),
	},
	{
		name: 'Amount',
		minWidth: '140px',
		selector: 'amount',
		sortable: true,
		cell: (row) => (
			<div>
				<span className="font-weight-bold">
					{row?.amount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
				</span>
				<small className="text-muted d-block">{row.products ? row.products.length : 0} items</small>
			</div>
		),
	},
	{
		name: 'Order Status',
		minWidth: '160px',
		selector: 'status',
		sortable: true,
		cell: (row) => {
			const status = orderStatus[row.status] || orderStatus.pending
			return (
				<Badge color={status.color} pill className="px-2 py-1">
					{status.icon}
					<span className="ml-1">{status.label}</span>
				</Badge>
			)
		}
	},
	{
		name: 'Payment Status',
		minWidth: '140px',
		selector: 'paymentStatus',
		sortable: true,
		cell: (row) => {
			const paymentStatus = paymentStatusConfig[row.paymentStatus] || paymentStatusConfig.pending
			return (
				<Badge color={paymentStatus.color} pill className="px-2 py-1">
					{paymentStatus.icon}
					<span className="ml-1">{paymentStatus.label}</span>
				</Badge>
			)
		}
	},
	{
		name: 'Customer',
		minWidth: '200px',
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
					<small className="text-muted">{row.customer.phone}</small>
				</div>
			</div>
		),
	},
	{
		name: 'Location',
		minWidth: '150px',
		selector: 'location',
		sortable: true,
		cell: (row) => (
			<div>
				<span id={`location-${row.id}`} className="d-inline-block text-truncate" style={{maxWidth: '150px'}}>
					{row.location || 'No location'}
				</span>
				{row.location && row.location.length > 20 && (
					<UncontrolledTooltip placement="top" target={`location-${row.id}`}>
						{row.location}
					</UncontrolledTooltip>
				)}
			</div>
		),
	},
	{
		name: 'Actions',
		minWidth: '100px',
		cell: (row) => (
			<div className="d-flex">
				<Link to={`/order/preview/${row.id}`}>
					<Button.Ripple 
						color="flat-primary" 
						size="sm" 
						id={`view-${row.id}`}
						className="btn-icon"
					>
						<Eye size={14} />
					</Button.Ripple>
				</Link>
				<UncontrolledTooltip placement="top" target={`view-${row.id}`}>
					View Order
				</UncontrolledTooltip>
				<UncontrolledDropdown>
					<DropdownToggle tag="div" className="btn btn-sm">
						<MoreVertical size={14} className="cursor-pointer" />
					</DropdownToggle>
					<DropdownMenu right>
						<DropdownItem
							tag={Link}
							to={`/order/preview/${row.id}`}
							className="w-100"
						>
							<Eye size={14} className="mr-50" />
							<span className="align-middle">View Details</span>
						</DropdownItem>
						<DropdownItem
							tag={Link}
							to={`/order/print/${row.id}`}
							className="w-100"
						>
							<FileText size={14} className="mr-50" />
							<span className="align-middle">Print</span>
						</DropdownItem>
					</DropdownMenu>
				</UncontrolledDropdown>
			</div>
		),
	},
]
