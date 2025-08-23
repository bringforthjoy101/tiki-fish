// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Columns
import { columns } from './columns'
import moment from 'moment'

// ** Store & Actions
import { getAllData, getFilteredData, getFilteredRageData } from '../store/action'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import { ChevronDown, Share, Printer, FileText, Search, Calendar, Filter, TrendingUp, Package, Clock, CheckCircle, XCircle, DollarSign, ShoppingBag, AlertCircle } from 'react-feather'
import Flatpickr from 'react-flatpickr'
import DataTable from 'react-data-table-component'
import { selectThemeColors } from '@utils'
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

const TransactionTable = () => {
	// ** Store Vars
	const dispatch = useDispatch()
	const store = useSelector((state) => state.orders)

	// ** States
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(100)
	const [picker, setPicker] = useState([new Date(), new Date()])
	const [statusFilter, setStatusFilter] = useState('')
	const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
	const [isLoading, setIsLoading] = useState(true)

	// Fetch all data on mount
	useEffect(() => {
		setIsLoading(true)
		dispatch(getAllData()).then(() => {
			setIsLoading(false)
		})
	}, [dispatch])

	// Filter data when allData changes or filter parameters change
	useEffect(() => {
		if (store.allData.length > 0) {
			dispatch(
				getFilteredData(store.allData, {
					page: currentPage,
					perPage: rowsPerPage,
					q: searchTerm,
					status: statusFilter,
					paymentStatus: paymentStatusFilter
				})
			)
		}
	}, [store.allData, currentPage, rowsPerPage, searchTerm, statusFilter, paymentStatusFilter, dispatch])

	// ** Function in get data on page change
	const handlePagination = (page) => {
		dispatch(
			getFilteredData(store.allData, {
				page: page.selected + 1,
				perPage: rowsPerPage,
				q: searchTerm,
				status: statusFilter,
				paymentStatus: paymentStatusFilter
			})
		)
		setCurrentPage(page.selected + 1)
	}

	// ** Function in get data on rows per page
	const handlePerPage = (e) => {
		const value = parseInt(e.currentTarget.value)
		dispatch(
			getFilteredData(store.allData, {
				page: currentPage,
				perPage: value,
				q: searchTerm,
				status: statusFilter,
				paymentStatus: paymentStatusFilter
			})
		)
		setRowsPerPage(value)
	}

	// ** Function in get data on search query change
	const handleFilter = (val) => {
		setSearchTerm(val)
		dispatch(
			getFilteredData(store.allData, {
				page: currentPage,
				perPage: rowsPerPage,
				q: val,
				status: statusFilter,
				paymentStatus: paymentStatusFilter
			})
		)
	}

	const handleRangeSearch = (date) => {
		const range = date.map((d) => new Date(d).getTime())
		setPicker(range)
		dispatch(getFilteredRageData(store.allData, range, { page: currentPage, perPage: rowsPerPage }))
	}

	const filteredData = store.allData.filter((item) => item.orderNumber.toLowerCase())

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
	function convertArrayOfObjectsToCSV(array) {
		let result

		const columnDelimiter = ','
		const lineDelimiter = '\n'
		const keys = Object.keys(store.allData[0])
		console.log('keyss', keys)

		result = ''
		result += keys.join(columnDelimiter)
		result += lineDelimiter

		array.forEach((item) => {
			let ctr = 0
			keys.forEach((key) => {
				if (ctr > 0) result += columnDelimiter

				result += item[key]

				ctr++
			})
			result += lineDelimiter
			console.log('esults', result)
		})

		return result
	}

	// ** Downloads CSV
	function downloadCSV(array) {
		const link = document.createElement('a')
		let csv = convertArrayOfObjectsToCSV(array)
		if (csv === null) return

		const filename = 'export.csv'

		if (!csv.match(/^data:text\/csv/i)) {
			csv = `data:text/csv;charset=utf-8,${csv}`
		}

		link.setAttribute('href', encodeURI(csv))
		link.setAttribute('download', filename)
		link.click()
	}

	// download PDF - Summary Report
	const downloadPDF = () => {
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
			body: store.data.map((order) => [
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
		
		const totalRevenue = store.data.reduce((sum, order) => sum + (order.amount || 0), 0)
		const completedOrders = store.data.filter(order => order.status === 'completed').length
		const pendingOrders = store.data.filter(order => order.status === 'pending').length
		
		doc.text(`Total Orders: ${store.data.length}`, 14, finalY + 23)
		doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 14, finalY + 30)
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
	const dataToRender = () => {
		const filters = {
			q: searchTerm,
		}

		const isFiltered = Object.keys(filters).some(function (k) {
			return filters[k].length > 0
		})

		if (store.data.length > 0) {
			return store.data
		} else if (store.data.length === 0 && isFiltered) {
			return []
		} else {
			return store.allData.slice(0, rowsPerPage)
		}
	}

	// Calculate summary statistics
	const totalOrders = store.allData.length
	const totalRevenue = store.allData.reduce((sum, order) => sum + (order.amount || 0), 0)
	const pendingOrders = store.allData.filter(order => order.status === 'pending').length
	const processingOrders = store.allData.filter(order => order.status === 'processing').length
	const completedOrders = store.allData.filter(order => order.status === 'completed').length
	const cancelledOrders = store.allData.filter(order => order.status === 'cancelled').length

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
				<CardHeader className="border-bottom">
					<CardTitle tag="h4">
						<Filter size={20} className="mr-1" />
						Search & Filter
					</CardTitle>
				</CardHeader>
				<CardBody>
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
								<option value="100">100</option>
								<option value="250">250</option>
								<option value="500">500</option>
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
								<DropdownItem className="w-100" onClick={() => downloadCSV(store.data)}>
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
				) : store.allData.length === 0 && !searchTerm && !statusFilter && !paymentStatusFilter ? (
					<div className="text-center py-5">
						<ShoppingBag size={48} className="text-muted mb-2" />
						<h4>No Orders Found</h4>
						<p className="text-muted">Start by creating your first order</p>
					</div>
				) : (
					<DataTable
						noHeader
						pagination
						subHeader
						responsive
						paginationServer
						columns={columns}
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
				)}
			</Card>
		</Fragment>
	)
}

export default TransactionTable
