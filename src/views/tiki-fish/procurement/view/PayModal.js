import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { payFishPurchase, getFishPurchase } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const today = () => new Date().toISOString().slice(0, 10)

const PayModal = ({ open, toggle, purchase, payments }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.procurement)
	const [form, setForm] = useState({ amount: '', paymentDate: today(), paymentAccountId: '', notes: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		// Defaults to the whole outstanding balance, and to the account the last payment on
		// this delivery came from. Both derived from data rather than hardcoded, so they stay
		// right when the accounts change.
		const lastAccount = [...(payments || [])].reverse().find((p) => p.paymentAccountId)
		setForm({
			amount: purchase?.outstanding > 0 ? String(purchase.outstanding) : '',
			paymentDate: today(),
			paymentAccountId: lastAccount?.paymentAccountId || '',
			notes: '',
		})
	}, [open, purchase, payments])

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			payFishPurchase(purchase.id, {
				amount: Number(form.amount),
				paymentDate: form.paymentDate,
				paymentAccountId: form.paymentAccountId,
				notes: form.notes || null,
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getFishPurchase(purchase.id, { quiet: true }))
		}
	}

	const activeAccounts = (reference.paymentAccounts || []).filter((a) => a.isActive !== false)
	const amount = Number(form.amount) || 0
	const overpaying = amount > 0 && amount - (purchase?.outstanding || 0) > 0.005
	const incomplete = !amount || !form.paymentAccountId || !form.paymentDate || overpaying

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>Pay {purchase?.reference}</ModalHeader>
			<ModalBody>
				<p className="mb-1">
					{naira(purchase?.totalLandedCost)} total, {naira(purchase?.paid)} paid so far.{' '}
					<b>{naira(purchase?.outstanding)} outstanding.</b>
				</p>

				<Row>
					<Col md="6">
						<FormGroup>
							<Label for="amount">Amount *</Label>
							<Input id="amount" type="number" step="0.01" value={form.amount} onChange={set('amount')} />
							<small className="text-muted">Part payments are fine.</small>
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="paymentDate">Date paid *</Label>
							<Input id="paymentDate" type="date" max={today()} value={form.paymentDate} onChange={set('paymentDate')} />
						</FormGroup>
					</Col>
				</Row>

				<FormGroup>
					<Label for="paymentAccountId">Paid from *</Label>
					<Input id="paymentAccountId" type="select" value={form.paymentAccountId} onChange={set('paymentAccountId')}>
						<option value="">Choose…</option>
						{activeAccounts.map((a) => (
							<option key={a.id} value={a.id}>
								{a.name}
							</option>
						))}
					</Input>
				</FormGroup>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" value={form.notes} onChange={set('notes')} />
				</FormGroup>

				{overpaying && (
					<Alert color="danger" className="p-1">
						That is more than the {naira(purchase?.outstanding)} outstanding.
					</Alert>
				)}

				{/* Stated because the figure will not appear where anyone expects it. */}
				<Alert color="info" className="p-1 mb-0">
					This comes off <b>{activeAccounts.find((a) => String(a.id) === String(form.paymentAccountId))?.name || 'the account'}</b> straight
					away. It does <b>not</b> appear as an expense in the profit and loss — the cost of this fish is counted when it
					is sold.
				</Alert>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : `Pay ${naira(amount)}`}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default PayModal
