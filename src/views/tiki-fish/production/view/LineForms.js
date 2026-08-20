import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { saveBatchInput, saveBatchOutput, getBatch, getAllocationPreview } from '../store/action'

const naira = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

const refresh = (dispatch, batchId) => {
	dispatch(getBatch(batchId, { quiet: true }))
	dispatch(getAllocationPreview(batchId))
}

/**
 * What went in.
 *
 * There is no cost field, deliberately. The cost is the weighted-average landed cost of that
 * grade as at the batch date, computed server-side from the fish ledger — so the storekeeper
 * entering a batch never sees or types a purchase price.
 */
export const InputForm = ({ open, toggle, batchId, input }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.production)
	const [form, setForm] = useState({ speciesGradeId: '', unit: 'kg', quantity: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		if (!input) {
			setForm({ speciesGradeId: '', unit: 'kg', quantity: '' })
			return
		}
		setForm({ speciesGradeId: input.speciesGradeId, unit: input.unit, quantity: input.quantity })
	}, [open, input])

	const set = (field) => (e) => {
		const { value } = e.target
		setForm((f) => {
			const next = { ...f, [field]: value }
			// Adopt the unit the grade is normally bought in. Still editable — the ledger keeps
			// a separate balance per unit and the batch must draw from the right one.
			if (field === 'speciesGradeId' && value && !input) {
				const grade = reference.grades.find((g) => String(g.id) === String(value))
				if (grade?.defaultUnit) next.unit = grade.defaultUnit
			}
			return next
		})
	}

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(saveBatchInput(batchId, { ...form, quantity: Number(form.quantity) }))
		setSaving(false)
		if (ok) {
			toggle()
			refresh(dispatch, batchId)
		}
	}

	const incomplete = !form.speciesGradeId || !(Number(form.quantity) > 0)

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>{input ? 'Edit input' : 'What went in?'}</ModalHeader>
			<ModalBody>
				{reference.grades.length === 0 && (
					<Alert color="warning" className="p-1">
						No fish grades exist yet. Add them under <b>Reference data</b> first.
					</Alert>
				)}
				<Row>
					<Col md="7">
						<FormGroup>
							<Label for="speciesGradeId">Grade *</Label>
							<Input id="speciesGradeId" type="select" value={form.speciesGradeId} onChange={set('speciesGradeId')} disabled={Boolean(input)}>
								<option value="">Choose…</option>
								{reference.grades.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md="5">
						<FormGroup>
							<Label for="unit">Measured in *</Label>
							<Input id="unit" type="select" value={form.unit} onChange={set('unit')} disabled={Boolean(input)}>
								<option value="kg">Weight (kg)</option>
								<option value="pcs">Piece</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>
				<FormGroup>
					<Label for="quantity">How much went in? *</Label>
					<Input id="quantity" type="number" step="0.001" value={form.quantity} onChange={set('quantity')} />
					<small className="text-muted">
						Costed at what this grade was worth on the batch date — you do not enter a price.
					</small>
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Save input'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

/**
 * What came out.
 *
 * The sales value is an ALLOCATION WEIGHT, not a sale. It decides how much of the batch's cost
 * this product absorbs — whole-folded at 23,500/kg carries more than heads at 5,000/kg,
 * because it is worth more. Defaults to the product's own price and stays editable, because
 * what matters is what the output was worth on the day it was made.
 */
export const OutputForm = ({ open, toggle, batchId, output }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.production)
	const [form, setForm] = useState({ productId: '', unit: 'kg', quantity: '', salesValueUnitPrice: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		if (!output) {
			setForm({ productId: '', unit: 'kg', quantity: '', salesValueUnitPrice: '' })
			return
		}
		setForm({
			productId: output.productId,
			unit: output.unit,
			quantity: output.quantity,
			salesValueUnitPrice: output.salesValueUnitPrice,
		})
	}, [open, output])

	const set = (field) => (e) => {
		const { value } = e.target
		setForm((f) => {
			const next = { ...f, [field]: value }
			if (field === 'productId' && value && !output) {
				const product = reference.products.find((p) => String(p.id) === String(value))
				if (product) {
					if (!f.salesValueUnitPrice) next.salesValueUnitPrice = product.price
					if (product.unit === 'kg' || product.unit === 'pcs') next.unit = product.unit
				}
			}
			return next
		})
	}

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			saveBatchOutput(batchId, {
				productId: form.productId,
				unit: form.unit,
				quantity: Number(form.quantity),
				salesValueUnitPrice: Number(form.salesValueUnitPrice),
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			refresh(dispatch, batchId)
		}
	}

	const qty = Number(form.quantity) || 0
	const price = Number(form.salesValueUnitPrice) || 0
	const incomplete = !form.productId || qty <= 0 || price <= 0

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>{output ? 'Edit output' : 'What came out?'}</ModalHeader>
			<ModalBody>
				<FormGroup>
					<Label for="productId">Product *</Label>
					<Input id="productId" type="select" value={form.productId} onChange={set('productId')} disabled={Boolean(output)}>
						<option value="">Choose…</option>
						{reference.products.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</Input>
				</FormGroup>
				<Row>
					<Col md="6">
						<FormGroup>
							<Label for="quantity">Yield *</Label>
							<Input id="quantity" type="number" step="0.001" value={form.quantity} onChange={set('quantity')} />
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="unit">Measured in *</Label>
							<Input id="unit" type="select" value={form.unit} onChange={set('unit')} disabled={Boolean(output)}>
								<option value="kg">Weight (kg)</option>
								<option value="pcs">Piece</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>
				<FormGroup>
					<Label for="salesValueUnitPrice">What it is worth, per {form.unit} *</Label>
					<Input
						id="salesValueUnitPrice"
						type="number"
						step="0.01"
						value={form.salesValueUnitPrice}
						onChange={set('salesValueUnitPrice')}
					/>
					<small className="text-muted">
						This decides how much of the batch&apos;s cost this product carries — not what it sells for. A more
						valuable cut absorbs more.
					</small>
				</FormGroup>

				{qty > 0 && price > 0 && (
					<div className="border rounded p-1">
						<div className="text-muted" style={{ fontSize: '0.75rem' }}>
							Weight in the split
						</div>
						<div className="font-weight-bold">{naira(qty * price)}</div>
					</div>
				)}
				{price === 0 && form.productId && (
					<Alert color="danger" className="p-1 mb-0 mt-1">
						At zero this product would absorb none of the batch&apos;s cost, and all of it would land on the others.
					</Alert>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Save output'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
