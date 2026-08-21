// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Columns
import { columns } from './columns'
import Sidebar from './Sidebar'

// ** Store & Actions
import { getAllData, searchCustomers } from '../store/action'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import { ChevronDown, Share, Printer, FileText } from 'react-feather'
import DataTable from 'react-data-table-component'
import { selectThemeColors, isUserLoggedIn, swal, todayLocal } from '@utils'
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

const UsersList = () => {
	// ** Store Vars
	const dispatch = useDispatch()
	const store = useSelector((state) => state.customers)

	// ** States
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [currentStatus, setCurrentStatus] = useState({ value: '', label: 'Select Status', number: 0 })
	const [sidebarOpen, setSidebarOpen] = useState(false)

	// ** Function to toggle sidebar
	const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

	// ** One server call. The list no longer downloads every customer to filter in the browser.
	useEffect(() => {
		dispatch(searchCustomers({ page: 1, perPage: rowsPerPage, status: currentStatus.value, q: '' }))
	}, [dispatch])

	// ** Debounced search. Without this every keystroke is a query; with a remote database whose
	// round-trip floor is ~280ms, typing a name would queue a dozen requests and the last one to
	// arrive — not the last one sent — would win.
	useEffect(() => {
		const timer = setTimeout(() => {
			setCurrentPage(1)
			dispatch(searchCustomers({ page: 1, perPage: rowsPerPage, status: currentStatus.value, q: searchTerm }))
		}, 350)
		return () => clearTimeout(timer)
	}, [searchTerm])

	const statusOptions = [
		{ value: '', label: 'Select Status', number: 0 },
		{ value: 'suspended', label: 'Suspended', number: 1 },
		{ value: 'active', label: 'Active', number: 2 },
	]

	// ** Function in get data on page change
	const handlePagination = (page) => {
		dispatch(searchCustomers({ page: page.selected + 1, perPage: rowsPerPage, status: currentStatus.value, q: searchTerm }))
		setCurrentPage(page.selected + 1)
	}

	// ** Function in get data on rows per page
	const handlePerPage = (e) => {
		const value = parseInt(e.currentTarget.value)
		// Back to page 1: staying on page 7 while the page size grows can land past the end and
		// show an empty table that looks like "no results".
		setCurrentPage(1)
		dispatch(searchCustomers({ page: 1, perPage: value, status: currentStatus.value, q: searchTerm }))
		setRowsPerPage(value)
	}

	// ** Function in get data on search query change
	// Sets the term only — the debounced effect above issues the request.
	const handleFilter = (val) => setSearchTerm(val)

	// ** Custom Pagination
	const CustomPagination = () => {
		// store.total is the count of everything MATCHING on the server, not the page length.
		const count = Math.ceil((store.total || 0) / rowsPerPage)

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

	// ** Export
	//
	// The list is server-paged now, so there is no full copy of the customers in the browser to
	// export. Both exports fetch the complete set on demand.
	//
	// The columns are also stated explicitly. The old CSV took its headers from
	// Object.keys(store.allData[0]) — which throws outright on an empty list — and the old PDF
	// wrote arr.names / arr.email / arr.balance / arr.naira_wallet, none of which exist on a
	// customer. Every PDF it produced was rows of "undefined".
	const EXPORT_COLUMNS = [
		{ key: 'fullName', label: 'Customer' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'location', label: 'Location' },
		{ key: 'totalOrders', label: 'Completed orders' },
		{ key: 'totalOrderAmount', label: 'Total spent' },
		{ key: 'status', label: 'Status' },
	]

	const cell = (row, key) => {
		const value = row[key]
		if (value === null || value === undefined) return ''
		// Quote and escape: a customer location containing a comma would otherwise shift every
		// column after it by one on that line.
		return `"${String(value).replace(/"/g, '""')}"`
	}

	const handleExportCSV = async () => {
		const rows = await dispatch(getAllData())
		if (!rows.length) return swal('Nothing to export', 'No customers were returned.', 'info')
		const header = EXPORT_COLUMNS.map((c) => c.label).join(',')
		const body = rows.map((row) => EXPORT_COLUMNS.map((c) => cell(row, c.key)).join(',')).join('\n')
		const link = document.createElement('a')
		link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${header}\n${body}`))
		link.setAttribute('download', `customers-${todayLocal()}.csv`)
		link.click()
	}

	const handleExportPDF = async () => {
		const rows = await dispatch(getAllData())
		if (!rows.length) return swal('Nothing to export', 'No customers were returned.', 'info')
		const doc = new jsPDF({ orientation: 'landscape' })
		doc.autoTable({
			styles: { halign: 'left', fontSize: 8 },
			head: [EXPORT_COLUMNS.map((c) => c.label)],
			body: rows.map((row) => EXPORT_COLUMNS.map((c) => (row[c.key] === null || row[c.key] === undefined ? '' : String(row[c.key])))),
		})
		doc.save(`customers-${todayLocal()}.pdf`)
	}


	const [userData, setUserData] = useState(null)
	useEffect(() => {
		if (isUserLoggedIn() !== null) {
			setUserData(JSON.parse(localStorage.getItem('userData')))
		}
	}, [])

	// ** The server already applied the search, the status filter and the paging. Falling back to
	// store.allData here would silently show unfiltered rows whenever a search returned nothing.
	const dataToRender = () => store.data

	return (
		<Fragment>
			<Card>
				<CardHeader>
					<CardTitle tag="h4">Search Filter</CardTitle>
				</CardHeader>
				<CardBody>
					<Row form className="mt-1 mb-50">
						<Col lg="4" md="6">
							<FormGroup>
								<Label for="select">Select Status:</Label>
								<Select
									theme={selectThemeColors}
									isClearable={false}
									className="react-select"
									classNamePrefix="select"
									id="select"
									options={statusOptions}
									value={currentStatus}
									onChange={(data) => {
										setCurrentStatus(data)
										setCurrentPage(1)
										dispatch(searchCustomers({ page: 1, perPage: rowsPerPage, status: data.value, q: searchTerm }))
									}}
								/>
							</FormGroup>
						</Col>
						<Col lg="4" md="6">
							<FormGroup>
								<Label for="select">Select Table:</Label>
								<Input
									id="search-invoice"
									className="ml-50 w-100"
									type="text"
									value={searchTerm}
									placeholder="Name, Phone Search & Location Search"
									onChange={(e) => handleFilter(e.target.value)}
								/>
							</FormGroup>
						</Col>
					</Row>
				</CardBody>
			</Card>
			<Card>
				<Row className="mx-0 mt-3">
					<Col xl="4" sm="12" className="d-flex align-items-center pl-3">
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
								<option value="10">10</option>
								<option value="25">25</option>
								<option value="50">50</option>
							</CustomInput>
							<Label for="rows-per-page">Entries</Label>
						</div>
					</Col>

					<Col xl="4" sm="12" className="d-flex align-items-sm-center justify-content-lg-end justify-content-center pr-lg-3 p-0 mt-lg-0 mt-1">
						<UncontrolledButtonDropdown>
							<DropdownToggle className="mr-lg-0 mr-5" color="secondary" caret outline>
								<Share size={15} />
								<span className="align-middle ml-lg-50">Download Table</span>
							</DropdownToggle>
							<DropdownMenu right>
								<DropdownItem className="w-100" onClick={() => handleExportCSV()}>
									<FileText size={15} />
									<span className="align-middle ml-50">CSV</span>
								</DropdownItem>
								<DropdownItem className="w-100" onClick={() => handleExportPDF()}>
									<FileText size={15} />
									<span className="align-middle ml-50">PDF</span>
								</DropdownItem>
							</DropdownMenu>
						</UncontrolledButtonDropdown>
					</Col>
					<Col
						xl="4"
						sm="12"
						className="d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1"
					>
						
							<Button.Ripple color="primary" onClick={toggleSidebar}>
								Add New Customer
							</Button.Ripple>
					</Col>
				</Row>
				<DataTable
					noHeader
					pagination
					subHeader
					responsive
					paginationServer
					columns={userData?.role === 'admin' || userData?.role === 'store' ? columns : columns.filter((col) => col.name !== 'Actions')}
					sortIcon={<ChevronDown />}
					className="react-dataTable"
					paginationComponent={CustomPagination}
					data={dataToRender()}
				/>
			</Card>
			<Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
		</Fragment>
	)
}

export default UsersList
