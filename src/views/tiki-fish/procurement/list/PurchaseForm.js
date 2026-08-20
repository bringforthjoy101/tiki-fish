import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner } from 'reactstrap'
import { createFishPurchase } from '../store/action'

const today = () => new Date().toISOString().slice(0, 10)

const blank = {
	purchaseDate: today(),
	supplierId: '',
	departmentId: '',
	categoryId: '',
	transportCost: '',
	handlingCost: '',
	otherLandedCost: '',
	paymentDueDate: '',
	receiptNumber: '',
	notes: '',
}

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const NewPurchaseModal = ({ open, toggle }) => {
	const dispatch = useDispatch()
	const history = useHistory()
	const { reference } = useSelector((s) => s.procurement)
	const [form, setForm] = useState(blank)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		const next = { ...blank }
		// Procurement is where fish is bought, and there is exactly one category seeded for it.
		// Pre-selecting the obvious answer is not a lock - both stay editable.
		const procurement = reference.departments.find((d) => d.code === 'PROCUREMENT')
		if (procurement) next.departmentId = procurement.id
		const fishCategory = reference.categories.find((c) => /fish/i.test(c.name))
		if (fishCategory) next.categoryId = fishCategory.id
		setForm(next)
	}, [open, reference.departments, reference.categories])

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const submit = async () => {
		setSaving(true)
		const payload = { ...form }
		Object.keys(payload).forEach((k) => {
			if (payload[k] === '') payload[k] = null
		})
		const purchase = await dispatch(createFishPurchase(payload))
		setSaving(false)
		if (purchase) {
			toggle()
			// Straight to the delivery, because a purchase with no lines is not yet anything.
			history.push(`/procurement/view/${purchase.id}`)
		}
	}

	const landed =
		(Number(form.transportCost) || 0) + (Number(form.handlingCost) || 0) + (Number(form.otherLandedCost) || 0)
	const incomplete = !form.purchaseDate || !form.supplierId || !form.departmentId || !form.categoryId

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>Record a fish delivery</ModalHeader>
			<ModalBody>
				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="purchaseDate">Date landed *</Label>
							<Input id="purchaseDate" type="date" max={today()} value={form.purchaseDate} onChange={set('purchaseDate')} />
							<small className="text-muted">The day it was weighed, not the day you key it.</small>
						</FormGroup>
					</Col>
					<Col md="8">
						<FormGroup>
							<Label for="supplierId">Supplier *</Label>
							<Input id="supplierId" type="select" value={form.supplierId} onChange={set('supplierId')}>
								<option value="">Choose…</option>
								{reference.suppliers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="6">
						<FormGroup>
							<Label for="departmentId">Department *</Label>
							<Input id="departmentId" type="select" value={form.departmentId} onChange={set('departmentId')}>
								<option value="">Choose…</option>
								{reference.departments.map((d) => (
									<option key={d.id} value={d.id}>
										{d.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="categoryId">Category *</Label>
							<Input id="categoryId" type="select" value={form.categoryId} onChange={set('categoryId')}>
								<option value="">Choose…</option>
								{reference.categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
				</Row>

				{/* Landed cost is per DELIVERY, which is why it lives on the header. It is spread
				    across the lines by invoice value when the delivery is received. */}
				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="transportCost">Transport</Label>
							<Input id="transportCost" type="number" step="0.01" value={form.transportCost} onChange={set('transportCost')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="handlingCost">Handling, ice, labour</Label>
							<Input id="handlingCost" type="number" step="0.01" value={form.handlingCost} onChange={set('handlingCost')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="otherLandedCost">Other</Label>
							<Input id="otherLandedCost" type="number" step="0.01" value={form.otherLandedCost} onChange={set('otherLandedCost')} />
						</FormGroup>
					</Col>
				</Row>
				{landed > 0 && (
					<div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
						{naira(landed)} will be spread across the grades in proportion to what each cost, so the cost per kg
						includes getting it here.
					</div>
				)}

				<Row>
					<Col md="6">
						<FormGroup>
							<Label for="paymentDueDate">Payment due</Label>
							<Input id="paymentDueDate" type="date" value={form.paymentDueDate} onChange={set('paymentDueDate')} />
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="receiptNumber">Waybill / receipt no.</Label>
							<Input id="receiptNumber" value={form.receiptNumber} onChange={set('receiptNumber')} />
						</FormGroup>
					</Col>
				</Row>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes} onChange={set('notes')} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Create and add grades'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default NewPurchaseModal
