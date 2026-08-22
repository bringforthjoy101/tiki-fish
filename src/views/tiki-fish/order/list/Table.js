// ** React Imports
import { Fragment, useState, useEffect, useContext, useRef } from 'react'

// ** Columns
import { columns } from './columns'
import moment from 'moment'

// ** Store & Actions
import { searchOrders, fetchOrdersForExport } from '../store/action'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import { ChevronDown, Share, Printer, FileText, Search, Calendar, Filter, TrendingUp, Package, Clock, CheckCircle, XCircle, DollarSign, ShoppingBag, AlertCircle } from 'react-feather'
import Flatpickr from 'react-flatpickr'
import DataTable from 'react-data-table-component'
import { selectThemeColors, swal, toLocalDate, todayLocal } from '@utils'
import { useBreakpoint } from '@src/utility/hooks/useBreakpoint'
import { AbilityContext } from '@src/utility/context/Can'
import OrderCards from './OrderCards'
import PickerRange from '../../../forms/form-elements/datepicker/PickerRange'
import '@styles/react/libs/flatpickr/flatpickr.scss'
import {
	Card,
	CardHeader,
	CardTitle,
	CardBody,
	UncontrolledButtonDropdown,
	DropdownMenu,
	DropdownItem,
	DropdownToggle,
	Input,
	Row,
	Col,
	Label,
	CustomInput,
	Button,
} from 'reactstrap'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import FormGroup from 'reactstrap/lib/FormGroup'

// Ranges as day OFFSETS, resolved against a fresh Date each time they are applied. A module-level
// array of Date objects would freeze the day the tab was opened — a phone left open overnight
// would keep showing yesterday as "Today".
const QUICK_RANGES = [
	{ key: 'today', label: 'Today', from: 0 },
	{ key: 'week', label: '7 days', from: 6 },
	{ key: 'month', label: '30 days', from: 29 },
	{ key: 'all', label: 'All', from: null }
]

const TransactionTable = () => {
	// ** Store Vars
	const dispatch = useDispatch()
	const store = useSelector((state) => state.orders)
	const breakpoint = useBreakpoint()
	const ability = useContext(AbilityContext)
	// 'orders.advanceStatus' -> { action: 'advanceStatus', subject: 'orders' }. The grammar is
	// resource.action; writing resource:'orders.advanceStatus' would never match and the button
	// would be invisible to everyone with no error.
	const canAdvance = ability.can('advanceStatus', 'orders')
	const isDesktop = breakpoint === 'desktop'

	// ** States
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	// 25, not 100. On a phone this renders as 25 cards; 100 was a very long scroll and, before
	// server paging, 100 slices of a 2,500-row download.
	const [rowsPerPage, setRowsPerPage] = useState(25)
	const [picker, setPicker] = useState([new Date(), new Date()])
	const [statusFilter, setStatusFilter] = useState('')
	const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [filtersOpen, setFiltersOpen] = useState(false)
	const [activeRange, setActiveRange] = useState('today')
	// Bumped on every dispatch; a reply whose number is stale is discarded.
	const requestSeq = useRef(0)

	useEffect(() => {
		dispatch({ type: 'RESET_ORDER_NOTIFICATIONS' })
	}, [dispatch])

	// ** Everything the server needs, in one place. The date range comes from the picker, which
	// defaults to today — the view a storekeeper wants when they open this on their phone.
	const query = () => ({
		perPage: rowsPerPage,
		q: searchTerm,
		status: statusFilter,
		paymentStatus: paymentStatusFilter,
		startDate: picker?.[0] ? toLocalDate(new Date(picker[0])) : '',
		endDate: picker?.[1] ? toLocalDate(new Date(picker[1])) : ''
	})

	// ** One debounced effect. 350ms after the last keystroke or filter change, one request goes
	// out. Firing per keystroke against a database with a ~280ms round-trip means the reply that
	// arrives last wins rather than the one sent last, so the rows can belong to a prefix of
	// what is in the box.
	useEffect(() => {
		setIsLoading(true)
		const timer = setTimeout(async () => {
			// A sequence number, because clearTimeout only cancels a request that has not STARTED.
			// Once a dispatch is in flight nothing aborts it, and the reducer is unconditional
			// last-write-wins — so with a ~280ms round-trip, a slow early query can land after a
			// fast later one and leave the table showing results for a filter that is no longer
			// set. handlePagination bypasses the debounce entirely, so a page tap and a filter
			// change race directly.
			const seq = ++requestSeq.current
			await dispatch(searchOrders({ ...query(), page: 1 }))
			if (seq !== requestSeq.current) return
			setCurrentPage(1)
			setIsLoading(false)
		}, 350)
		return () => clearTimeout(timer)
	}, [searchTerm, statusFilter, paymentStatusFilter, rowsPerPage, JSON.stringify(picker)])

	// ** Function in get data on page change
	const handlePagination = async (page) => {
		setIsLoading(true)
		const seq = ++requestSeq.current
		await dispatch(searchOrders({ ...query(), page: page.selected + 1 }))
		if (seq !== requestSeq.current) return
		setCurrentPage(page.selected + 1)
		setIsLoading(false)
	}

	// ** Function in get data on rows per page
	// Sets state only; the effect above re-queries and resets to page 1.
	const handlePerPage = (e) => setRowsPerPage(parseInt(e.currentTarget.value))

	// ** Function in get data on search query change
	const handleFilter = (val) => setSearchTerm(val)

	// The picker holds Dates; the effect converts them to local YYYY-MM-DD for the API. NOT
	// toISOString — in West Africa that returns the previous day. See @utils/toLocalDate.
	const handleRangeSearch = (date) => {
		setPicker(date)
		setActiveRange(null)
	}

	const applyQuickRange = (range) => {
		setActiveRange(range.key)
		if (range.from === null) return setPicker([])
		const end = new Date()
		const start = new Date()
		start.setDate(start.getDate() - range.from)
		setPicker([start, end])
	}

	// ** Custom Pagination
	const CustomPagination = () => {
		const count = Math.ceil(store.total / rowsPerPage)

		return (
			<ReactPaginate
				previousLabel={''}
				nextLabel={''}
				pageCount={count || 1}
				activeClassName="active"
				forcePage={currentPage !== 0 ? currentPage - 1 : 0}
				onPageChange={(page) => handlePagination(page)}
				pageClassName={'page-item'}
				nextLinkClassName={'page-link'}
				nextClassName={'page-item next'}
				previousClassName={'page-item prev'}
				previousLinkClassName={'page-link'}
				pageLinkClassName={'page-link'}
				containerClassName={'pagination react-paginate justify-content-end my-2 pr-1'}
			/>
		)
	}

	// ** Converts table to CSV
	// ** CSV export
	//
	// Columns are named explicitly. The old version took its headers from
	// Object.keys(store.allData[0]) — which throws on an empty list, and store.allData is no
	// longer preloaded — and quoted nothing, so any customer name or location containing a comma
	// shifted every column after it by one on that line.
	//
	// It also exports everything matching the current filters rather than the 25 rows on screen.
	const CSV_COLUMNS = [
		{ label: 'Order No', get: (o) => o.orderNumber },
		{ label: 'Customer', get: (o) => o.customer?.fullName },
		{ label: 'Phone', get: (o) => o.customer?.phone },
		{ label: 'Amount', get: (o) => o.amount },
		{ label: 'Status', get: (o) => o.status },
		{ label: 'Payment', get: (o) => o.paymentStatus },
		{ label: 'Location', get: (o) => o.location },
		{ label: 'Date', get: (o) => moment(o.createdAt).format('YYYY-MM-DD HH:mm') }
	]

	const csvCell = (value) => {
		if (value === null || value === undefined) return '""'
		return `"${String(value).replace(/"/g, '""')}"`
	}

	const handleExportCSV = async () => {
		const { rows, truncated } = await dispatch(fetchOrdersForExport(query()))
		if (!rows.length) return swal('Nothing to export', 'No orders matched the current filters.', 'info')
		if (truncated) swal('Partial export', 'Only the first 2,500 matching orders are included. Narrow the date range for a complete file.', 'warning')
		const header = CSV_COLUMNS.map((c) => c.label).join(',')
		const body = rows.map((o) => CSV_COLUMNS.map((c) => csvCell(c.get(o))).join(',')).join('\n')
		const link = document.createElement('a')
		link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${header}\n${body}`))
		link.setAttribute('download', `orders-${todayLocal()}.csv`)
		link.click()
	}

	const downloadPDF = async () => {
		const { rows: exportRows, truncated } = await dispatch(fetchOrdersForExport(query()))
		if (!exportRows.length) return swal('Nothing to export', 'No orders matched the current filters.', 'info')
		if (truncated) swal('Partial export', 'Only the first 2,500 matching orders are included.', 'warning')
		const doc = new jsPDF({
			orientation: 'landscape',
		})

		// Add title
		doc.setFontSize(18)
		doc.text('TIKI FISH FARM - Orders Report', 14, 20)
		doc.setFontSize(11)
		doc.text(`Generated: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 28)
		
		// Create summary table
		doc.autoTable({
			startY: 35,
			styles: { halign: 'left', fontSize: 10 },
			headStyles: { fillColor: [41, 128, 185] },
			columnStyles: {
				0: { cellWidth: 25 },
				1: { cellWidth: 35 },
				2: { cellWidth: 30 },
				3: { cellWidth: 25 },
				4: { cellWidth: 40 },
				5: { cellWidth: 35 },
				6: { cellWidth: 35 },
				7: { cellWidth: 35 }
			},
			head: [['Order No', 'Customer', 'Amount', 'Status', 'Payment', 'Location', 'Date', 'Attendant']],
			body: exportRows.map((order) => [
				`#${order.orderNumber}`,
				order.customer?.fullName || 'N/A',
				`₦${order.amount?.toLocaleString() || '0'}`,
				order.status?.toUpperCase() || 'N/A',
				order.paymentMode?.toUpperCase() || 'N/A',
				order.location ? (order.location.length > 20 ? `${order.location.substring(0, 20)}...` : order.location) : 'N/A',
				moment(order.createdAt).format('DD/MM/YY HH:mm'),
				`${order.admin?.firstName || ''} ${order.admin?.lastName || ''}`
			])
		})
		
		// Add summary statistics
		const finalY = doc.lastAutoTable.finalY || 50
		doc.setFontSize(12)
		doc.setFont(undefined, 'bold')
		doc.text('Summary Statistics', 14, finalY + 15)
		doc.setFont(undefined, 'normal')
		doc.setFontSize(10)
		
		// exportRows, NOT store.data. The table above is built from the full filtered fetch (up to
		// 2,500 orders) while this block counted the 25 rows on screen — so the two halves of the
		// same document described different sets and nothing said so. Before the export changed,
		// both came from store.data and agreed.
		//
		// Revenue here means completed + delivered, matching helpers/reporting.js. Summing every
		// status would call cancelled orders revenue, the same fault the summary cards had.
		const REVENUE = ['completed', 'delivered']
		const totalRevenue = exportRows.filter((o) => REVENUE.includes(o.status)).reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
		const completedOrders = exportRows.filter((o) => o.status === 'completed').length
		const pendingOrders = exportRows.filter((o) => o.status === 'pending').length
		
		doc.text(`Total Orders: ${exportRows.length}`, 14, finalY + 23)
		doc.text(`Revenue (completed + delivered): ₦${totalRevenue.toLocaleString()}`, 14, finalY + 30)
		doc.text(`Completed Orders: ${completedOrders}`, 14, finalY + 37)
		doc.text(`Pending Orders: ${pendingOrders}`, 14, finalY + 44)
		
		const date = new Date()
		doc.save(`orders_report_${moment().format('YYYY-MM-DD_HHmmss')}.pdf`)
	}
	
	// Download individual receipts for selected orders
	const downloadReceipts = (orders = store.data) => {
		if (!orders || orders.length === 0) {
			swal('No Orders', 'Please select orders to download receipts', 'warning')
			return
		}
		
		// Create a new jsPDF instance for thermal receipt (80mm width)
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: [80, 297] // 80mm width, A4 height
		})
		
		orders.forEach((data, orderIndex) => {
			if (orderIndex > 0) {
				doc.addPage()
			}
			
			// Set font for receipt
			doc.setFont('courier', 'normal')
			doc.setFontSize(8)
			
			let yPos = 10
			const lineHeight = 3.5
			const pageWidth = 80
			const margin = 5
			const contentWidth = pageWidth - (margin * 2)
			
			// Helper functions
			const centerText = (text, y, fontSize = 8) => {
				doc.setFontSize(fontSize)
				const textWidth = doc.getTextWidth(text)
				doc.text(text, (pageWidth - textWidth) / 2, y)
			}
			
			const drawLine = (y, style = 'dashed') => {
				if (style === 'dashed') {
					doc.setLineDashPattern([1, 1], 0)
				} else {
					doc.setLineDashPattern([], 0)
				}
				doc.line(margin, y, pageWidth - margin, y)
				doc.setLineDashPattern([], 0)
				return y + 2
			}
			
			// Company Header
			doc.setFont('courier', 'bold')
			centerText('TIKI FISH FARM', yPos, 11)
			yPos += lineHeight + 1
			
			doc.setFont('courier', 'normal')
			centerText('& SMOKE HOUSE', yPos, 8)
			yPos += lineHeight
			centerText('SALES RECEIPT', yPos, 9)
			yPos += lineHeight + 2
			
			// Order Info
			yPos = drawLine(yPos)
			yPos += 2
			doc.setFontSize(7)
			doc.text(`Order: #${data.orderNumber}`, margin, yPos)
			yPos += lineHeight
			doc.text(`Date: ${moment(data.createdAt).format('DD/MM/YY HH:mm')}`, margin, yPos)
			yPos += lineHeight
			doc.text(`Customer: ${data.customer?.fullName || 'N/A'}`, margin, yPos)
			yPos += lineHeight + 2
			
			// Products summary
			yPos = drawLine(yPos)
			yPos += 2
			const products = data.products || []
			products.forEach(product => {
				const nameLines = doc.splitTextToSize(product.name, contentWidth - 20)
				nameLines.forEach((line, index) => {
					if (index === 0) {
						doc.text(line.substring(0, 30), margin, yPos)
						doc.text(`₦${product.amount?.toLocaleString() || '0'}`, pageWidth - margin - 20, yPos)
					}
					yPos += lineHeight
				})
			})
			
			// Total
			yPos = drawLine(yPos)
			yPos += 2
			doc.setFont('courier', 'bold')
			doc.text('TOTAL:', margin, yPos)
			doc.text(`₦${data.amount?.toLocaleString() || '0'}`, pageWidth - margin - 20, yPos)
			doc.setFont('courier', 'normal')
			yPos += lineHeight + 2
			
			// Footer
			centerText('Thank You!', yPos, 7)
		})
		
		doc.save(`receipts_${moment().format('YYYY-MM-DD_HHmmss')}.pdf`)
	}

	// ** Table data to render
	// ** The server applied the search, the filters and the paging. A fallback to store.allData
	// here would show unfiltered orders whenever a search legitimately returned nothing — which
	// reads as a list of results.
	const dataToRender = () => store.data


	// ** Summary comes from the SERVER, over everything matching the current filter.
	//
	// These were computed from store.allData, which was capped at 2,500 rows — so "Total Orders"
	// read 2,500 against a real 7,210 and "Total Revenue" summed only the newest third. Both
	// looked like answers, which is why nobody questioned them.
	const summary = store.summary || { totalOrders: 0, totalValue: 0, byStatus: {} }
	const totalOrders = summary.totalOrders
	const totalRevenue = summary.totalValue
	const pendingOrders = summary.byStatus.pending || 0
	const processingOrders = summary.byStatus.processing || 0
	const completedOrders = summary.byStatus.completed || 0
	const cancelledOrders = summary.byStatus.cancelled || 0

	// Status options for filter
	const statusOptions = [
		{ value: '', label: 'All Status' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'out_for_delivery', label: 'Out for Delivery' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' }
	]

	const paymentStatusOptions = [
		{ value: '', label: 'All Payment Status' },
		{ value: 'pending', label: 'Payment Pending' },
		{ value: 'paid', label: 'Paid' },
		{ value: 'partial', label: 'Partial Payment' },
		{ value: 'failed', label: 'Failed' },
		{ value: 'refunded', label: 'Refunded' }
	]

	return (
		<Fragment>
			{/* Summary Cards */}
			<Row className="mb-2">
				<Col xl="3" sm="6">
					<Card>
						<CardBody>
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h2 className="font-weight-bolder mb-0">{totalOrders}</h2>
									<p className="card-text">Total Orders</p>
								</div>
								<div className="avatar avatar-stats p-50 bg-light-primary">
									<div className="avatar-content">
										<ShoppingBag className="text-primary" size={22} />
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col xl="3" sm="6">
					<Card>
						<CardBody>
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h2 className="font-weight-bolder mb-0">₦{totalRevenue.toLocaleString()}</h2>
									<p className="card-text">Total Revenue</p>
								</div>
								<div className="avatar avatar-stats p-50 bg-light-success">
									<div className="avatar-content">
										<DollarSign className="text-success" size={22} />
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col xl="3" sm="6">
					<Card>
						<CardBody>
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h2 className="font-weight-bolder mb-0">{pendingOrders + processingOrders}</h2>
									<p className="card-text">Active Orders</p>
								</div>
								<div className="avatar avatar-stats p-50 bg-light-warning">
									<div className="avatar-content">
										<Clock className="text-warning" size={22} />
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col xl="3" sm="6">
					<Card>
						<CardBody>
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h2 className="font-weight-bolder mb-0">{completedOrders}</h2>
									<p className="card-text">Completed</p>
								</div>
								<div className="avatar avatar-stats p-50 bg-light-info">
									<div className="avatar-content">
										<CheckCircle className="text-info" size={22} />
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>

			{/* Search and Filter Card */}
			<Card>
				<CardHeader className="border-bottom d-flex justify-content-between align-items-center flex-wrap">
					<CardTitle tag="h4" className="mb-0">
						<Filter size={20} className="mr-1" />
						Search &amp; Filter
					</CardTitle>
					{/* Quick ranges. On a phone this is the whole filter most of the time: a
					    storekeeper wants today's orders, and one tap is cheaper than opening a
					    date picker twice. */}
					<div className="d-flex align-items-center flex-wrap mt-50 mt-md-0">
						{QUICK_RANGES.map((r) => (
							<Button
								key={r.key}
								size="sm"
								color={activeRange === r.key ? 'primary' : 'flat-secondary'}
								className="mr-50 mb-25"
								onClick={() => applyQuickRange(r)}
							>
								{r.label}
							</Button>
						))}
						{!isDesktop && (
							<Button size="sm" color="flat-secondary" className="mb-25" onClick={() => setFiltersOpen(!filtersOpen)}>
								<Filter size={14} className="mr-25" />
								{filtersOpen ? 'Hide' : 'More'}
							</Button>
						)}
					</div>
				</CardHeader>
				{/* On a phone the full filter block is four stacked controls before a single order
				    is visible, so it starts collapsed and the chips above cover the common cases. */}
				<CardBody className={!isDesktop && !filtersOpen ? 'd-none' : ''}>
					<Row form className="mt-1">
						<Col lg="3" md="6" className="mb-1">
							<FormGroup>
								<Label for="search-order">
									<Search size={14} className="mr-1" />
									Search Orders
								</Label>
								<Input
									id="search-order"
									type="text"
									value={searchTerm}
									placeholder="Order ID, customer name..."
									onChange={(e) => handleFilter(e.target.value)}
								/>
							</FormGroup>
						</Col>
						<Col lg="3" md="6" className="mb-1">
							<FormGroup>
								<Label for="status-filter">
									<Package size={14} className="mr-1" />
									Order Status
								</Label>
								<Select
									id="status-filter"
									isClearable={false}
									className="react-select"
									classNamePrefix="select"
									options={statusOptions}
									theme={selectThemeColors}
									value={statusOptions.find(option => option.value === statusFilter)}
									onChange={(data) => setStatusFilter(data.value)}
								/>
							</FormGroup>
						</Col>
						<Col lg="3" md="6" className="mb-1">
							<FormGroup>
								<Label for="payment-filter">
									<DollarSign size={14} className="mr-1" />
									Payment Status
								</Label>
								<Select
									id="payment-filter"
									isClearable={false}
									className="react-select"
									classNamePrefix="select"
									options={paymentStatusOptions}
									theme={selectThemeColors}
									value={paymentStatusOptions.find(option => option.value === paymentStatusFilter)}
									onChange={(data) => setPaymentStatusFilter(data.value)}
								/>
							</FormGroup>
						</Col>
						<Col lg="3" md="6" className="mb-1">
							<FormGroup>
								<Label for="range-picker">
									<Calendar size={14} className="mr-1" />
									Date Range
								</Label>
								<Flatpickr
									value={picker}
									id="range-picker"
									className="form-control"
									onChange={(date) => handleRangeSearch(date)}
									options={{
										mode: 'range',
										dateFormat: 'Y-m-d'
									}}
								/>
							</FormGroup>
						</Col>
					</Row>
				</CardBody>
			</Card>
			{/* Orders Table Card */}
			<Card>
				<CardHeader className="border-bottom">
					<CardTitle tag="h4">
						<ShoppingBag size={20} className="mr-1" />
						Orders List
					</CardTitle>
				</CardHeader>
				<Row className="mx-0 mt-2">
					<Col xl="6" sm="12" className="d-flex align-items-center pl-3">
						<div className="d-flex align-items-center w-100">
							<Label for="rows-per-page">Show</Label>
							<CustomInput
								className="form-control mx-50"
								type="select"
								id="rows-per-page"
								value={rowsPerPage}
								onChange={handlePerPage}
								style={{
									width: '10rem',
									padding: '0 0.8rem',
									backgroundPosition: 'calc(100% - 3px) 11px, calc(100% - 20px) 13px, 100% 0',
								}}
							>
								{/* Must stay within the API's perPage cap of 200 (validate.js) and must include
								    the default of 25, or the select renders with no matching option and two of
								    the three choices 400 the request — leaving the previous page's rows on
								    screen under a page count that no longer matches them. */}
								<option value="25">25</option>
								<option value="50">50</option>
								<option value="100">100</option>
								<option value="200">200</option>
							</CustomInput>
							<Label for="rows-per-page">Entries</Label>
						</div>
					</Col>
					<Col xl="6" sm="12" className="d-flex align-items-sm-center justify-content-lg-end justify-content-center pr-lg-3 p-0 mt-lg-0 mt-1">
						<UncontrolledButtonDropdown>
							<DropdownToggle className="mr-lg-0 mr-5" color="secondary" caret outline>
								<Share size={15} />
								<span className="align-middle ml-lg-50">Download Table</span>
							</DropdownToggle>
							<DropdownMenu right>
								<DropdownItem className="w-100" onClick={() => downloadPDF()}>
									<FileText size={15} />
									<span className="align-middle ml-50">Orders Report (PDF)</span>
								</DropdownItem>
								<DropdownItem className="w-100" onClick={() => downloadReceipts()}>
									<FileText size={15} />
									<span className="align-middle ml-50">Download Receipts</span>
								</DropdownItem>
								<DropdownItem divider />
								<DropdownItem className="w-100" onClick={() => handleExportCSV()}>
									<FileText size={15} />
									<span className="align-middle ml-50">Export CSV</span>
								</DropdownItem>
							</DropdownMenu>
						</UncontrolledButtonDropdown>
					</Col>
				</Row>
				{isLoading ? (
					<div className="text-center py-5">
						<div className="spinner-border text-primary" role="status">
							<span className="sr-only">Loading...</span>
						</div>
						<p className="mt-2">Loading orders...</p>
					</div>
				) : store.data.length === 0 && !searchTerm && !statusFilter && !paymentStatusFilter && activeRange === 'all' ? (
					<div className="text-center py-5">
						<ShoppingBag size={48} className="text-muted mb-2" />
						<h4>No Orders Found</h4>
						<p className="text-muted">Start by creating your first order</p>
					</div>
				) : breakpoint === 'desktop' ? (
					<DataTable
						noHeader
						pagination
						subHeader
						responsive
						paginationServer
						// The rows are ONE PAGE from the server, so a client-side sort reorders 25
						// of 7,218 rows while the header still renders an arrow and looks like it
						// answered. Server sorting is offered through the sort param; until every
						// column maps to one, no column claims to sort.
						columns={columns.map((c) => ({ ...c, sortable: false }))}
						sortIcon={<ChevronDown />}
						className="react-dataTable"
						paginationComponent={CustomPagination}
						data={dataToRender()}
						noDataComponent={
							<div className="text-center py-5">
								<AlertCircle size={48} className="text-muted mb-2" />
								<h4>No Results Found</h4>
								<p className="text-muted">Try adjusting your search or filter criteria</p>
							</div>
						}
					/>
				) : (
					/* Below 1024px the table becomes cards: one per row on a phone, two on a
					   tablet. The seven columns here have 1,020px of combined minimum width, so
					   on a 390px screen reading one order meant scrolling through nearly three
					   screens sideways. */
					<div className="p-1">
						<OrderCards orders={dataToRender()} breakpoint={breakpoint} canAdvance={canAdvance} loading={isLoading} />
						<CustomPagination />
					</div>
				)}
			</Card>
		</Fragment>
	)
}

export default TransactionTable
