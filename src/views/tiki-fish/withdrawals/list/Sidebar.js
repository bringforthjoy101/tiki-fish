// ** Custom Components
import Sidebar from '@components/sidebar'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { swal, apiRequest } from '@utils'
import { getAllData, getFilteredData } from '../store/action'

// ** Third Party Components
import { Button, FormGroup, Label, Spinner } from 'reactstrap'
import { AvForm, AvInput } from 'availity-reactstrap-validation-safe'

const SidebarNewWithdrawal = ({ open, toggleSidebar }) => {
	const dispatch = useDispatch()

	const [withdrawalData, setWithdrawalData] = useState({
		amount: '',
		purpose: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	// ** Function to handle form submit
	const onSubmit = async (event, errors) => {
		setIsSubmitting(true)
		event?.preventDefault()
		if (errors) setIsSubmitting(false)
		if (errors && !errors.length) {
			setIsSubmitting(true)
			const body = JSON.stringify(withdrawalData)
			try {
				const response = await apiRequest({ url: '/withdrawals/create', method: 'POST', body }, dispatch)
				
				if (response) {
					if (response.data.status) {
						setIsSubmitting(false)
						swal('Great job!', response.data.message, 'success')
						dispatch(getAllData())
						setWithdrawalData({
							amount: '',
							purpose: '',
						})
						toggleSidebar()
					} else {
						setIsSubmitting(false)
						setWithdrawalData({
							amount: '',
							purpose: '',
						})
						swal('Oops!', response.data.message, 'error')
					}
				} else {
					setIsSubmitting(false)
					swal('Oops!', 'Something went wrong with your network.', 'error')
				}
			} catch (error) {
				setIsSubmitting(false)
				console.error({ error })
			}
		}
	}

	useEffect(() => {
		// onSubmit()
		dispatch(getAllData())
	}, [dispatch])

	return (
		<Sidebar size="lg" open={open} title="New User" headerClassName="mb-1" contentClassName="pt-0" toggleSidebar={toggleSidebar}>
			<AvForm onSubmit={onSubmit}>
				<FormGroup>
					<Label for="amount">Amount</Label>
					<AvInput
						type="number"
						name="amount"
						id="amount"
						placeholder="Enter Amount"
						value={withdrawalData.amount}
						onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
						required
					/>
				</FormGroup>
				<FormGroup>
					<Label for="purpose">Purpose</Label>
					<AvInput
						type='textarea'
						name="purpose"
						id="purpose"
						placeholder="Enter Purpose"
						value={withdrawalData.purpose}
						onChange={(e) => setWithdrawalData({ ...withdrawalData, purpose: e.target.value })}
						required
					/>
				</FormGroup>
				<Button type='submit' className='mr-1' color='primary' disabled={isSubmitting}>
					{isSubmitting && <Spinner color='white' size='sm' />}
					<span className='ml-50'>Submit</span>
				</Button>
				<Button type="reset" color="secondary" outline onClick={toggleSidebar}>
					Cancel
				</Button>
			</AvForm>
		</Sidebar>
	)
}

export default SidebarNewWithdrawal
