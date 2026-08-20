import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { savePurchaseLine, getFishPurchase } from '../store/action'

const blank = {
	speciesGradeId: '',
	unit: 'kg',
	grossQuantity: '',
	mortalityQty: '',
	shrinkageQty: '',
	unitPrice: '',
	notes: '',
}

const naira = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

/**
 * One grade on one delivery.
 *
 * The preview at the bottom is the point of this form. Mortality and shrinkage are the
 * difference between what you pay for and what you get, and the person keying the waybill is
 * the only one who can see both numbers - so the consequence is shown to them, at the moment
 * they type it, rather than appearing in a report weeks later.
 */
const LineForm = ({ open, toggle, purchaseId, line }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.procurement)
	const [form, setForm] = useState(blank)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		if (!line) {
			setForm(blank)
			return
		}
		setForm({
			...blank,
			...line,
			speciesGradeId: line.speciesGradeId ?? '',
			mortalityQty: line.mortalityQty || '',
			shrinkageQty: line.shrinkageQty || '',
		})
	}, [open, line])

	const set = (field) => (e) => {
		const { value } = e.target
		setForm((f) => {
			const next = { ...f, [field]: value }
			// Choosing a grade adopts the unit it is normally bought in. Still editable: a
			// delivery can legitimately arrive part-weighed and part-counted.
			if (field === 'speciesGradeId' && value && !line) {
				const grade = reference.grades.find((g) => String(g.id) === String(value))
				if (grade?.defaultUnit) next.unit = grade.defaultUnit
			}
			return next
		})
	}

	const gross = Number(form.grossQuantity) || 0
	const mortality = Number(form.mortalityQty) || 0
	const shrinkage = Number(form.shrinkageQty) || 0
	const net = Math.round((gross - mortality - shrinkage) * 1000) / 1000
	const price = Number(form.unitPrice) || 0
	const lineAmount = Math.round(gross * price * 100) / 100
	// What it will actually cost per surviving unit, before the delivery's transport is
	// spread over it at receive.
	const costPerNet = net ? Math.round((lineAmount / net) * 100) / 100 : 0
	const lossPercent = gross ? Math.round(((gross - net) / gross) * 1000) / 10 : 0

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			savePurchaseLine(purchaseId, {
				speciesGradeId: form.speciesGradeId,
				unit: form.unit,
				grossQuantity: gross,
				mortalityQty: mortality,
				shrinkageQty: shrinkage,
				unitPrice: price,
				notes: form.notes || null,
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getFishPurchase(purchaseId, { quiet: true }))
		}
	}

	const nothingLeft = gross !== 0 && net === 0
	const overDeducted = gross > 0 && net < 0
	const incomplete = !form.speciesGradeId || !gross || !price || nothingLeft || overDeducted

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>{line ? 'Edit grade' : 'Add a grade to this delivery'}</ModalHeader>
			<ModalBody>
				{reference.grades.length === 0 && (
					<Alert color="warning" className="p-1">
						No fish grades exist yet. Add them under <b>Reference data → Fish species &amp; grades</b> first.
					</Alert>
				)}
				<Row>
					<Col md="8">
						<FormGroup>
							<Label for="speciesGradeId">Grade *</Label>
							<Input id="speciesGradeId" type="select" value={form.speciesGradeId} onChange={set('speciesGradeId')} disabled={Boolean(line)}>
								<option value="">Choose…</option>
								{reference.grades.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</Input>
							{line && <small className="text-muted">Remove the line and add it again to change the grade.</small>}
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="unit">Bought by *</Label>
							<Input id="unit" type="select" value={form.unit} onChange={set('unit')} disabled={Boolean(line)}>
								<option value="kg">Weight (kg)</option>
								<option value="pcs">Piece</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="3">
						<FormGroup>
							<Label for="grossQuantity">Delivered *</Label>
							<Input id="grossQuantity" type="number" step="0.001" value={form.grossQuantity} onChange={set('grossQuantity')} />
							<small className="text-muted">As weighed at the pond</small>
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="mortalityQty">Dead on arrival</Label>
							<Input id="mortalityQty" type="number" step="0.001" value={form.mortalityQty} onChange={set('mortalityQty')} />
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="shrinkageQty">Shrinkage</Label>
							<Input id="shrinkageQty" type="number" step="0.001" value={form.shrinkageQty} onChange={set('shrinkageQty')} />
							<small className="text-muted">Weight lost in transit</small>
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="unitPrice">Price per {form.unit} *</Label>
							<Input id="unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={set('unitPrice')} />
							<small className="text-muted">As invoiced, on the delivered quantity</small>
						</FormGroup>
					</Col>
				</Row>

				{gross > 0 && price > 0 && net > 0 && (
					<div className="border rounded p-1">
						<Row>
							<Col md="4">
								<div className="text-muted" style={{ fontSize: '0.75rem' }}>
									Invoiced
								</div>
								<div className="font-weight-bold">{naira(lineAmount)}</div>
								<div className="text-muted" style={{ fontSize: '0.7rem' }}>
									{gross} {form.unit} @ {naira(price)}
								</div>
							</Col>
							<Col md="4">
								<div className="text-muted" style={{ fontSize: '0.75rem' }}>
									Into stock
								</div>
								<div className="font-weight-bold">
									{net} {form.unit}
								</div>
								{lossPercent > 0 && (
									<div className="text-warning" style={{ fontSize: '0.7rem' }}>
										{lossPercent}% lost to mortality and shrinkage
									</div>
								)}
							</Col>
							<Col md="4">
								<div className="text-muted" style={{ fontSize: '0.75rem' }}>
									Cost per surviving {form.unit}
								</div>
								<div className="font-weight-bold">{naira(costPerNet)}</div>
								{lossPercent > 0 && (
									<div className="text-muted" style={{ fontSize: '0.7rem' }}>
										not {naira(price)} — the losses are carried by what survived
									</div>
								)}
							</Col>
						</Row>
					</div>
				)}

				{nothingLeft && (
					<Alert color="danger" className="p-1 mb-0 mt-1">
						Nothing survives: {gross} less {mortality} dead and {shrinkage} shrinkage leaves zero.
					</Alert>
				)}
				{overDeducted && (
					<Alert color="danger" className="p-1 mb-0 mt-1">
						Deductions of {mortality + shrinkage} exceed the {gross} delivered.
					</Alert>
				)}

				<FormGroup className="mt-1">
					<Label for="notes">Notes</Label>
					<Input id="notes" value={form.notes} onChange={set('notes')} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Save grade'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default LineForm
