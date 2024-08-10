// ** React Imports
import { Link } from 'react-router-dom'

// ** Third Party Components
import { Card, CardBody, Button } from 'reactstrap'
import UpdateStatus from './UpdateStatus'
import { swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import { getOrder } from '../store/action'

const PreviewActions = ({ id, data }) => {
	const dispatch = useDispatch()

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
	return (
		<Card className="invoice-action-wrapper">
			<CardBody>
				{/* <Button.Ripple color='primary' block className='mb-75' onClick={() => setSendSidebarOpen(true)}>
          Send Invoice
        </Button.Ripple> */}

				<Button.Ripple color="secondary" tag={Link} to={`/order/print/${id}`} block outline className="mb-75">
					Print
				</Button.Ripple>
				{/* <UpdateStatus /> */}
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
