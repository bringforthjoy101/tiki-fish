import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { adjustStock, getStockOnHand } from '../store/action'

const naira = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const today = () => new Date().toISOString().slice(0, 10)

// The four corrections a person may post by hand. `purchase`, `production` and `reversal` are
// written by the routines that own them and are deliberately not offered here — a movement with
// no document behind it is how a ledger stops being evidence.
const REASONS = [
	{ value: 'opening', label: 'Opening balance — what was already here', direction: 'in' },
	{ value: 'count', label: 'Count difference — the count disagreed with the book', direction: 'either' },
	{ value: 'adjustment', label: 'Correction — the book is simply wrong', direction: 'either' },
	{ value: 'wastage', label: 'Wastage — spoiled, lost or discarded', direction: 'out' },
]

/**
 * One correcting movement.
 *
 * The form is built around the sign of the quantity, because that is what decides whether a
 * unit cost must be typed: adding stock has no history to average against, so somebody has to
 * say what it was worth. Removing stock is priced at the book's own average, which is why that
 * field disappears — showing it would invite a value that silently re-prices the remainder.
 */
const AdjustModal = ({ open, toggle, line, filters }) => {
	const dispatch = useDispatch()
	const [form, setForm] = useState({ sourceType: 'count', direction: 'in', quantity: '', unitCost: '', movementDate: today(), description: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open || !line) return
		// An item with no stock at all is almost always an opening balance being keyed for the
		// first time, so lead with that rather than making them change it.
		setForm({
			sourceType: line.quantity ? 'count' : 'opening',
			direction: 'in',
			quantity: '',
			unitCost: line.unitCost ? String(line.unitCost) : '',
			movementDate: today(),
			description: '',
		})
	}, [open, line])

	if (!line) return null

	const set = (field) => (e) => {
		const { value } = e.target
		setForm((f) => {
			const next = { ...f, [field]: value }
			// Keep the direction consistent with the reason: an opening balance can only add,
			// wastage can only remove. Silently correcting it beats a validation error.
			if (field === 'sourceType') {
				const reason = REASONS.find((r) => r.value === value)
				if (reason?.direction === 'in') next.direction = 'in'
				if (reason?.direction === 'out') next.direction = 'out'
			}
			return next
		})
	}

	const reason = REASONS.find((r) => r.value === form.sourceType)
	const qty = Number(form.quantity) || 0
	const signed = form.direction === 'out' ? -qty : qty
	const needsCost = signed > 0
	const closing = Math.round((Number(line.quantity || 0) + signed) * 1000) / 1000
	const wouldGoNegative = closing < -0.0005

	const incomplete = !(qty > 0) || (needsCost && !(Number(form.unitCost) >= 0)) || wouldGoNegative

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			adjustStock({
				ledger: line.ledger,
				speciesGradeId: line.speciesGradeId || undefined,
				packagingItemId: line.packagingItemId || undefined,
				unit: line.unit,
				quantity: signed,
				...(needsCost ? { unitCost: Number(form.unitCost) } : {}),
				sourceType: form.sourceType,
				movementDate: form.movementDate,
				description: form.description || undefined,
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getStockOnHand(filters))
		}
	}

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>{line.name}</ModalHeader>
			<ModalBody>
				<div className="border rounded p-1 mb-1">
					<div className="text-muted" style={{ fontSize: '0.75rem' }}>The book says</div>
					<div className="font-weight-bold">
						{Number(line.quantity || 0).toLocaleString('en-NG')} {line.unit}
						{line.unitCost ? <span className="text-muted font-weight-normal"> · {naira(line.unitCost)} per {line.unit}</span> : null}
					</div>
				</div>

				<FormGroup>
					<Label for="sourceType">Why *</Label>
					<Input type="select" id="sourceType" value={form.sourceType} onChange={set('sourceType')}>
						{REASONS.map((r) => (
							<option key={r.value} value={r.value}>{r.label}</option>
						))}
					</Input>
				</FormGroup>

				<Row>
					<Col md="5">
						<FormGroup>
							<Label for="direction">Direction *</Label>
							<Input type="select" id="direction" value={form.direction} onChange={set('direction')} disabled={reason?.direction !== 'either'}>
								<option value="in">Add to stock</option>
								<option value="out">Take out of stock</option>
							</Input>
						</FormGroup>
					</Col>
					<Col md="7">
						<FormGroup>
							<Label for="quantity">How much, in {line.unit} *</Label>
							<Input id="quantity" type="number" step="0.001" min="0" value={form.quantity} onChange={set('quantity')} />
						</FormGroup>
					</Col>
				</Row>

				{needsCost && (
					<FormGroup>
						<Label for="unitCost">What one {line.unit} was worth *</Label>
						<Input id="unitCost" type="number" step="0.01" min="0" value={form.unitCost} onChange={set('unitCost')} />
						<small className="text-muted">
							Stock added without a cost would leave the ledger holding quantity with no value, and the cost of
							everything already here would come out wrong.
						</small>
					</FormGroup>
				)}
				{!needsCost && qty > 0 && (
					<Alert color="info" className="p-1">
						Priced at what the book already says this is worth, so the {line.unit} left over keep their cost.
					</Alert>
				)}

				<FormGroup>
					<Label for="movementDate">Dated *</Label>
					<Input id="movementDate" type="date" max={today()} value={form.movementDate} onChange={set('movementDate')} />
					<small className="text-muted">Use the day it actually happened — a count keyed late still belongs to the day it was taken.</small>
				</FormGroup>

				<FormGroup>
					<Label for="description">Note</Label>
					<Input id="description" type="textarea" rows="2" value={form.description} onChange={set('description')} placeholder="What happened?" />
				</FormGroup>

				{qty > 0 && !wouldGoNegative && (
					<div className="border rounded p-1">
						<div className="text-muted" style={{ fontSize: '0.75rem' }}>The book will say</div>
						<div className="font-weight-bold">{closing.toLocaleString('en-NG')} {line.unit}</div>
					</div>
				)}
				{wouldGoNegative && (
					<Alert color="danger" className="p-1 mb-0">
						That would take {line.name} below zero. The book only holds {Number(line.quantity || 0).toLocaleString('en-NG')} {line.unit}.
					</Alert>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>Cancel</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Post it'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default AdjustModal
