// ** React Imports
import { Fragment, useState, useEffect } from 'react'
import moment from 'moment'

// ** Columns
import { columns } from './columns'

// ** Stats Cards
import StatsCards from './StatsCards'

// ** Store & Actions
import { getAllSupplies, getSuppliesSummary, getAllSuppliers, getFilteredData, paySupply } from '../store/action'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import { ChevronDown, Share, FileText } from 'react-feather'
import DataTable from 'react-data-table-component'
import Flatpickr from 'react-flatpickr'
import '@styles/react/libs/flatpickr/flatpickr.scss'
import { selectThemeColors } from '@utils'
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
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  FormGroup,
  Spinner
} from 'reactstrap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm }) => {
  return (
    <div className='invoice-list-table-header w-100 mr-1 ml-50 mt-2 mb-75'>
      <Row>
        <Col xl='6' className='d-flex align-items-center p-0'>
          <div className='d-flex align-items-center w-100'>
            <Label for='rows-per-page'>Show</Label>
            <CustomInput
              className='form-control mx-50'
              type='select'
              id='rows-per-page'
              value={rowsPerPage}
              onChange={handlePerPage}
              style={{
                width: '5rem',
                padding: '0 0.8rem',
                backgroundPosition: 'calc(100% - 3px) 11px, calc(100% - 20px) 13px, 100% 0'
              }}
            >
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
              <option value='100'>100</option>
            </CustomInput>
            <Label for='rows-per-page'>Entries</Label>
          </div>
        </Col>
        <Col
          xl='6'
          className='d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1'
        >
          <div className='d-flex align-items-center mb-sm-0 mb-1 mr-1'>
            <Label className='mb-0' for='search-invoice'>
              Search:
            </Label>
            <Input
              id='search-invoice'
              className='ml-50 w-100'
              type='text'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
              placeholder='Search supplies...'
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

const SuppliesTable = () => {
  // ** Store Vars
  const dispatch = useDispatch()
  const store = useSelector(state => state.supplies)

  // ** States
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [picker, setPicker] = useState([])
  const [currentSupplier, setCurrentSupplier] = useState({ value: '', label: 'All Suppliers' })
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState({ value: '', label: 'All Payment Status' })
  const [overdueOnly, setOverdueOnly] = useState(false)

  // ** Payment Modal States
  const [paymentModal, setPaymentModal] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processingPayment, setProcessingPayment] = useState(false)

  // ** Payment Status Options
  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'unpaid', label: 'Unpaid' }
  ]

  // ** Supplier Options
  const supplierOptions = [
    { value: '', label: 'All Suppliers' },
    ...store.suppliers.map(supplier => ({ value: supplier.id, label: supplier.name }))
  ]

  // ** Toggle Payment Modal
  const togglePaymentModal = () => {
    if (paymentModal) {
      setSelectedSupply(null)
      setPaymentAmount('')
      setPaymentMethod('cash')
    }
    setPaymentModal(!paymentModal)
  }

  // ** Handle Payment Click
  const handlePaymentClick = (supply) => {
    setSelectedSupply(supply)
    setPaymentAmount(supply.amountDue?.toString() || '0')
    setPaymentModal(true)
  }

  // ** Fetch supplies with current filters
  const fetchSuppliesData = () => {
    const params = {
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    }

    if (currentSupplier.value) params.supplierId = currentSupplier.value
    if (currentPaymentStatus.value) params.paymentStatus = currentPaymentStatus.value
    if (overdueOnly) params.overdueOnly = 'true'
    if (picker.length === 2) {
      params.startDate = moment(picker[0]).format('YYYY-MM-DD')
      params.endDate = moment(picker[1]).format('YYYY-MM-DD')
    }

    dispatch(getAllSupplies(params))
  }

  // ** Process Payment
  const processPayment = async (e) => {
    e.preventDefault()

    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      return
    }

    setProcessingPayment(true)
    try {
      await dispatch(paySupply(selectedSupply.id, {
        amount: parseFloat(paymentAmount),
        paymentMethod
      }))

      // Refresh data
      fetchSuppliesData()
      dispatch(getSuppliesSummary())

      togglePaymentModal()
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setProcessingPayment(false)
    }
  }

  // ** Get data on mount
  useEffect(() => {
    fetchSuppliesData()
    dispatch(getSuppliesSummary())
    dispatch(getAllSuppliers())
  }, [])

  // ** Refetch when filters change
  useEffect(() => {
    fetchSuppliesData()
  }, [currentSupplier.value, currentPaymentStatus.value, overdueOnly, picker])

  // ** Update filtered data when allData changes
  useEffect(() => {
    dispatch(
      getFilteredData(store.allData, {
        page: currentPage,
        perPage: rowsPerPage,
        q: searchTerm,
        supplierId: currentSupplier.value,
        paymentStatus: currentPaymentStatus.value,
        overdueOnly
      })
    )
  }, [store.allData])

  // ** Function in get data on page change
  const handlePagination = page => {
    dispatch(
      getFilteredData(store.allData, {
        page: page.selected + 1,
        perPage: rowsPerPage,
        q: searchTerm,
        supplierId: currentSupplier.value,
        paymentStatus: currentPaymentStatus.value,
        overdueOnly
      })
    )
    setCurrentPage(page.selected + 1)
  }

  // ** Function in get data on rows per page
  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    dispatch(
      getFilteredData(store.allData, {
        page: currentPage,
        perPage: value,
        q: searchTerm,
        supplierId: currentSupplier.value,
        paymentStatus: currentPaymentStatus.value,
        overdueOnly
      })
    )
    setRowsPerPage(value)
  }

  // ** Function in get data on search query change
  const handleFilter = val => {
    setSearchTerm(val)
    dispatch(
      getFilteredData(store.allData, {
        page: currentPage,
        perPage: rowsPerPage,
        q: val,
        supplierId: currentSupplier.value,
        paymentStatus: currentPaymentStatus.value,
        overdueOnly
      })
    )
  }

  // ** Handle Date Range Change
  const handleRangeSearch = (date) => {
    if (date.length === 2) {
      setPicker(date)
    } else if (date.length === 0) {
      setPicker([])
    }
  }

  // ** Custom Pagination
  const CustomPagination = () => {
    const count = Number(Math.ceil(store.total / rowsPerPage))

    return (
      <ReactPaginate
        previousLabel={''}
        nextLabel={''}
        pageCount={count || 1}
        activeClassName='active'
        forcePage={currentPage !== 0 ? currentPage - 1 : 0}
        onPageChange={page => handlePagination(page)}
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

  // ** Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape'
    })

    doc.setFontSize(20)
    doc.setTextColor(40)
    doc.text('Tiki Fish - Supplies Report', 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated: ${moment().format('LLL')}`, 14, 30)

    if (picker.length === 2) {
      doc.text(`Date Range: ${moment(picker[0]).format('ll')} - ${moment(picker[1]).format('ll')}`, 14, 36)
    }

    const tableData = store.allData.map(supply => [
      supply.name,
      supply.supplier?.name || 'N/A',
      supply.totalAmount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
      supply.amountPaid?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
      supply.amountDue?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
      supply.paymentDueDate ? moment(supply.paymentDueDate).format('ll') : 'Not set',
      supply.isOverdue ? 'Yes' : 'No',
      supply.paymentStatus,
      supply.status
    ])

    doc.autoTable({
      startY: picker.length === 2 ? 42 : 36,
      head: [['Supply Name', 'Supplier', 'Total Amount', 'Paid', 'Balance', 'Due Date', 'Overdue', 'Payment', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [115, 103, 240] },
      columnStyles: {
        6: {
          cellCallback(cell, data) {
            if (data.row.raw[6] === 'Yes') {
              cell.styles.textColor = [255, 0, 0]
            }
          }
        }
      }
    })

    doc.save(`supplies-report-${moment().format('YYYY-MM-DD-HHmmss')}.pdf`)
  }

  // ** Export to CSV
  const exportToCSV = () => {
    const headers = ['Supply Name', 'Supplier', 'Total Amount', 'Amount Paid', 'Balance Due', 'Due Date', 'Days Until Due', 'Is Overdue', 'Payment Status', 'Status', 'Created Date']

    const csvData = store.allData.map(supply => [
      supply.name,
      supply.supplier?.name || 'N/A',
      supply.totalAmount,
      supply.amountPaid,
      supply.amountDue,
      supply.paymentDueDate ? moment(supply.paymentDueDate).format('YYYY-MM-DD') : '',
      supply.daysUntilDue,
      supply.isOverdue ? 'Yes' : 'No',
      supply.paymentStatus,
      supply.status,
      moment(supply.createdAt).format('YYYY-MM-DD')
    ])

    let csv = `${headers.join(',')}\n`
    csvData.forEach(row => {
      csv += `${row.map(cell => `"${cell}"`).join(',')}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `supplies-report-${moment().format('YYYY-MM-DD-HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ** Table data to render
  const dataToRender = () => {
    const filters = {
      q: searchTerm
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

  // ** Calculate remaining balance for payment modal
  const calculateRemainingBalance = () => {
    if (!selectedSupply) return 0
    return selectedSupply.amountDue || 0
  }

  return (
    <Fragment>
      {/* Stats Cards */}
      <StatsCards summary={store.summary} />

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Filters</CardTitle>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md='3'>
              <FormGroup>
                <Label>Supplier</Label>
                <Select
                  isClearable={false}
                  theme={selectThemeColors}
                  className='react-select'
                  classNamePrefix='select'
                  options={supplierOptions}
                  value={currentSupplier}
                  onChange={data => setCurrentSupplier(data)}
                />
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Payment Status</Label>
                <Select
                  isClearable={false}
                  theme={selectThemeColors}
                  className='react-select'
                  classNamePrefix='select'
                  options={paymentStatusOptions}
                  value={currentPaymentStatus}
                  onChange={data => setCurrentPaymentStatus(data)}
                />
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Date Range</Label>
                <Flatpickr
                  value={picker}
                  id='range-picker'
                  className='form-control'
                  onChange={date => handleRangeSearch(date)}
                  options={{
                    mode: 'range',
                    dateFormat: 'Y-m-d'
                  }}
                  placeholder='Select date range'
                />
              </FormGroup>
            </Col>
            <Col md='3' className='d-flex align-items-end'>
              <FormGroup>
                <CustomInput
                  type='checkbox'
                  id='overdue-only'
                  label='Show Overdue Only'
                  checked={overdueOnly}
                  onChange={e => setOverdueOnly(e.target.checked)}
                />
              </FormGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <Row className='mx-0 mt-3'>
          <Col xl='6' sm='12' className='d-flex align-items-center pl-3'>
            <div className='d-flex align-items-center w-100'>
              <Label for='rows-per-page'>Show</Label>
              <CustomInput
                className='form-control mx-50'
                type='select'
                id='rows-per-page'
                value={rowsPerPage}
                onChange={handlePerPage}
                style={{
                  width: '5rem',
                  padding: '0 0.8rem',
                  backgroundPosition: 'calc(100% - 3px) 11px, calc(100% - 20px) 13px, 100% 0'
                }}
              >
                <option value='10'>10</option>
                <option value='25'>25</option>
                <option value='50'>50</option>
                <option value='100'>100</option>
              </CustomInput>
              <Label for='rows-per-page'>Entries</Label>
            </div>
          </Col>
          <Col xl='6' sm='12' className='d-flex align-items-sm-center justify-content-lg-end justify-content-center pr-lg-3 p-0 mt-lg-0 mt-1'>
            <div className='d-flex align-items-center mb-sm-0 mb-1 mr-1'>
              <Label className='mb-0' for='search-invoice'>
                Search:
              </Label>
              <Input
                id='search-invoice'
                className='ml-50 w-100'
                type='text'
                value={searchTerm}
                onChange={e => handleFilter(e.target.value)}
                placeholder='Search supplies...'
              />
            </div>
            <UncontrolledButtonDropdown>
              <DropdownToggle className='mr-lg-0 mr-5' color='secondary' caret outline>
                <Share size={15} />
                <span className='align-middle ml-lg-50'>Export</span>
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem className='w-100' onClick={exportToPDF}>
                  <FileText size={15} />
                  <span className='align-middle ml-50'>PDF</span>
                </DropdownItem>
                <DropdownItem className='w-100' onClick={exportToCSV}>
                  <FileText size={15} />
                  <span className='align-middle ml-50'>CSV</span>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </Col>
        </Row>
        <DataTable
          noHeader
          pagination
          subHeader={false}
          responsive
          paginationServer
          columns={columns(handlePaymentClick)}
          sortIcon={<ChevronDown />}
          className='react-dataTable'
          paginationComponent={CustomPagination}
          data={dataToRender()}
          progressPending={store.loading}
          progressComponent={
            <div className='d-flex justify-content-center my-3'>
              <Spinner color='primary' />
            </div>
          }
        />
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} toggle={togglePaymentModal} className='modal-dialog-centered'>
        <ModalHeader toggle={togglePaymentModal}>Process Payment</ModalHeader>
        <ModalBody>
          {selectedSupply && (
            <Form onSubmit={processPayment}>
              <div className='mb-2'>
                <h5>{selectedSupply.name}</h5>
                <small className='text-muted'>
                  Supplier: {selectedSupply.supplier?.name || 'N/A'}
                </small>
              </div>
              <FormGroup>
                <Label for='paymentAmount'>Payment Amount</Label>
                <Input
                  type='number'
                  id='paymentAmount'
                  placeholder='Enter payment amount'
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required
                  min='0.01'
                  step='0.01'
                  max={calculateRemainingBalance()}
                />
                <small className='text-muted'>
                  Remaining balance: {calculateRemainingBalance().toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </small>
              </FormGroup>
              <FormGroup>
                <Label for='paymentMethod'>Payment Method</Label>
                <Input
                  type='select'
                  id='paymentMethod'
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value='cash'>Cash</option>
                  <option value='bank-transfer'>Bank Transfer</option>
                </Input>
              </FormGroup>
              <div className='d-flex justify-content-end mt-2'>
                <Button color='secondary' className='mr-1' onClick={togglePaymentModal} outline>
                  Cancel
                </Button>
                <Button color='primary' type='submit' disabled={processingPayment}>
                  {processingPayment ? (
                    <>
                      <Spinner size='sm' color='white' className='mr-50' />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Process Payment'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </ModalBody>
      </Modal>
    </Fragment>
  )
}

export default SuppliesTable
