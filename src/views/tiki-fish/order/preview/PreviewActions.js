// ** React Imports
import { Link } from 'react-router-dom'

// ** Third Party Components
import { Card, CardBody, Button } from 'reactstrap'
import UpdateStatus from './UpdateStatus'
import UpdatePayment from './UpdatePayment'
import { swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import moment from 'moment/moment'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { getOrder, completeOrder, nullifyOrder } from '../store/action'

const PreviewActions = ({ id, data }) => {
	const dispatch = useDispatch()
  const MySwal = withReactContent(Swal)

	const completePayment = async (saleId) => {
		const response = await apiRequest({ url: `/sales/complete/${saleId}`, method: 'GET' }, dispatch)
		if (response) {
			if (response.data.message) {
				swal('Great job!', response.data.message, 'success')
				dispatch(getOrder(id))
			} else {
				swal('Oops!', response.data.message, 'error')
			}
		} else {
			swal('Oops!', 'Something went wrong with your network.', 'error')
		}
	}

	const handleCompleteOrder = async (id) => {
        return MySwal.fire({
          title: 'Are you sure?',
          text: "This action will complete this order!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, complete it!',
          customClass: {
            confirmButton: 'btn btn-success',
            cancelButton: 'btn btn-outline-danger ml-1'
          },
          buttonsStyling: false
        }).then(async function (result) {
          if (result.value) {
            const completed = await dispatch(completeOrder(id))
            if (completed) {
              await dispatch(getOrder(id))
                MySwal.fire({
                    icon: 'success',
                    title: 'Comleted!',
                    text: 'Order has been completed.',
                    customClass: {
                      confirmButton: 'btn btn-primary'
                    }
                  })
            //   history.push(`/products/list`)
            }
            
          }
        })
  	}

	  const handleNullifyOrder = async (id) => {
        return MySwal.fire({
          title: 'Are you sure?',
          text: "This action will cancelled this order!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, cancel it!',
          customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-outline-danger ml-1'
          },
          buttonsStyling: false
        }).then(async function (result) {
          if (result.value) {
            const nullified = await dispatch(nullifyOrder(id))
            if (nullified) {
              await dispatch(getOrder(id))
                MySwal.fire({
                    icon: 'success',
                    title: 'Cancelled!',
                    text: 'Order has been cancelled.',
                    customClass: {
                      confirmButton: 'btn btn-primary'
                    }
                  })
            //   history.push(`/products/list`)
            }
            
          }
        })
  	}

    const handleDownloadOrder = () => {
      // Create a new jsPDF instance for thermal receipt (80mm width)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // 80mm width, A4 height (can be trimmed by printer)
      })
      
      // Set font for receipt
      doc.setFont('courier', 'normal')
      doc.setFontSize(8)
      
      let yPos = 10
      const lineHeight = 3.5
      const pageWidth = 80
      const margin = 5
      const contentWidth = pageWidth - (margin * 2)
      
      // Helper function for center text
      const centerText = (text, y, fontSize = 8) => {
        doc.setFontSize(fontSize)
        const textWidth = doc.getTextWidth(text)
        doc.text(text, (pageWidth - textWidth) / 2, y)
      }
      
      // Helper function for line
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
      
      centerText('500m Opp. Ilere Junction', yPos, 7)
      yPos += lineHeight
      centerText('Along Ijare Road, Akure South', yPos, 7)
      yPos += lineHeight
      centerText('Ondo State, Nigeria', yPos, 7)
      yPos += lineHeight + 2
      
      doc.setFont('courier', 'bold')
      centerText('SALES RECEIPT', yPos, 9)
      yPos += lineHeight + 2
      
      // Divider
      yPos = drawLine(yPos)
      yPos += 2
      
      // Order Information
      doc.setFont('courier', 'normal')
      doc.setFontSize(7)
      doc.text(`Order No: #${data.orderNumber}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Date: ${moment(data.createdAt).format('DD/MM/YYYY HH:mm')}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Status: ${data.status.toUpperCase()}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Payment: ${data.paymentMode.toUpperCase()}`, margin, yPos)
      yPos += lineHeight + 1
      
      // Customer Info
      yPos = drawLine(yPos)
      yPos += 2
      doc.text(`Customer: ${data.customer.fullName}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Phone: ${data.customer.phone}`, margin, yPos)
      yPos += lineHeight
      if (data.location) {
        // Wrap long location text
        const locationLines = doc.splitTextToSize(`Location: ${data.location}`, contentWidth)
        locationLines.forEach(line => {
          doc.text(line, margin, yPos)
          yPos += lineHeight
        })
      }
      yPos += 1
      
      // Products Header
      yPos = drawLine(yPos)
      yPos += 2
      doc.setFont('courier', 'bold')
      doc.text('ITEM', margin, yPos)
      doc.text('AMT', pageWidth - margin - 15, yPos)
      yPos += lineHeight
      doc.setFont('courier', 'normal')
      
      // Products
      data.products.forEach(product => {
        // Product name (wrap if too long)
        const nameLines = doc.splitTextToSize(product.name, contentWidth - 20)
        nameLines.forEach((line, index) => {
          if (index === 0) {
            doc.text(line, margin, yPos)
            doc.text(`₦${product.amount.toLocaleString()}`, pageWidth - margin - doc.getTextWidth(`₦${product.amount.toLocaleString()}`), yPos)
          } else {
            doc.text(line, margin, yPos)
          }
          yPos += lineHeight
        })
        // Quantity and price detail
        doc.setFontSize(6)
        doc.text(`  ${product.qty} x ₦${product.price.toLocaleString()}`, margin, yPos)
        doc.setFontSize(7)
        yPos += lineHeight + 0.5
      })
      
      // Totals
      yPos = drawLine(yPos)
      yPos += 2
      
      const drawTotal = (label, amount, bold = false) => {
        if (bold) doc.setFont('courier', 'bold')
        doc.text(label, margin, yPos)
        const amountText = `₦${amount.toLocaleString()}`
        doc.text(amountText, pageWidth - margin - doc.getTextWidth(amountText), yPos)
        if (bold) doc.setFont('courier', 'normal')
        yPos += lineHeight
      }
      
      drawTotal('Subtotal:', data.subTotal)
      if (data.logistics > 0) drawTotal('Logistics:', data.logistics)
      if (data.discount > 0) drawTotal('Discount:', -data.discount)
      
      yPos = drawLine(yPos, 'solid')
      yPos += 1
      doc.setFontSize(8)
      drawTotal('TOTAL:', data.amount, true)
      yPos += 2
      
      // Payment Status
      if (data.paymentStatus) {
        yPos = drawLine(yPos)
        yPos += 2
        doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`, margin, yPos)
        yPos += lineHeight
      }
      
      // Attendant
      yPos = drawLine(yPos)
      yPos += 2
      doc.text(`Attendant: ${data.admin.firstName} ${data.admin.lastName}`, margin, yPos)
      yPos += lineHeight + 2
      
      // Footer
      yPos = drawLine(yPos)
      yPos += 2
      doc.setFont('courier', 'bold')
      centerText('THANK YOU!', yPos, 8)
      yPos += lineHeight
      doc.setFont('courier', 'normal')
      doc.setFontSize(6)
      centerText('Thanks for your patronage', yPos)
      yPos += lineHeight
      centerText('We hope to see you again', yPos)
      yPos += lineHeight + 2
      
      // Order barcode representation
      centerText(`*${data.orderNumber}*`, yPos, 8)
      
      // Save the PDF
      doc.save(`receipt-${data.orderNumber}.pdf`)
    }
	return (
		<Card className="invoice-action-wrapper">
			<CardBody>
				{/* <Button.Ripple color='primary' block className='mb-75' onClick={() => setSendSidebarOpen(true)}>
          Send Invoice
        </Button.Ripple> */}

				<Button.Ripple className="mb-75" color='success' onClick={() => handleCompleteOrder(data.id)} block disabled={data.status === 'completed' || data.status === 'cancelled'}>
					Complete Order
				</Button.Ripple>
				<Button.Ripple className='mb-75' color='danger' outline onClick={() => handleNullifyOrder(data.id)} block disabled={data.status === 'completed' || data.status === 'cancelled'}>
					Cancel Order
				</Button.Ripple>
        <Button.Ripple className='mb-75' color="success" onClick={() => handleDownloadOrder()} block outline>
					Download
				</Button.Ripple>
				<Button.Ripple color="secondary" tag={Link} to={`/order/print/${id}`} block outline className="mb-75">
					Print
				</Button.Ripple>
				
				<UpdateStatus currentStatus={data.status} />
				<UpdatePayment 
					currentPaymentMode={data.paymentMode} 
					currentPaymentStatus={data.paymentStatus} 
				/>
				{/* <Button.Ripple tag={Link} to={`/apps/invoice/edit/${id}`} color='secondary' block outline className='mb-75'>
          Edit
        </Button.Ripple>
        <Button.Ripple color='success' block onClick={() => setAddPaymentOpen(true)}>
          Add Payment
        </Button.Ripple> */}
			</CardBody>
		</Card>
	)
}

export default PreviewActions
