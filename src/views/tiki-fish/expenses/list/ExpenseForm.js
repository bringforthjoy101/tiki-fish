import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { createExpense, updateExpense, getExpenses } from '../store/action'

const today = () => new Date().toISOString().slice(0, 10)

const BATCH_HINT_AVAILABLE =
	'Firewood, smokehouse labour and packaging used on one batch belong to that batch. Tag it here and it becomes ' +
	'part of what those products cost. Only batches still being worked on are listed — once a batch is posted its cost is fixed.'

const BATCH_HINT_NONE =
	'No batch is currently being worked on. Costs can only be tagged to a batch before it is posted, so start the ' +
	'batch first, then record its firewood and labour against it.'

const readable = (d) => {
	if (!d) return ''
	const [y, m, day] = String(d).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, day).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

const blank = {
	expenseDate: today(),
	departmentId: '',
	categoryId: '',
	paymentAccountId: '',
	amount: '',
	description: '',
	quantity: '',
	unit: '',
	unitPrice: '',
	supplierId: '',
	receiptNumber: '',
	receiptUrl: '',
	notes: '',
	isCapex: false,
	productionBatchId: '',
}

// Capex threshold, matching the server. Shown as a prompt rather than enforced: the rule is
// "over this AND lasts more than a year", and only the person holding the receipt knows the
// second half.
const CAPEX_HINT = 500000

const ExpenseForm = ({ open, toggle, expense, filters }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.expenses)
	const [form, setForm] = useState(blank)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		// Editing loads the row; creating starts clean each time the modal opens, so yesterday's
		// entry does not bleed into today's.
		if (!expense) {
			setForm(blank)
			return
		}
		setForm({
			...blank,
			...expense,
			expenseDate: expense.expenseDate?.slice(0, 10) || today(),
			departmentId: expense.departmentId ?? '',
			categoryId: expense.categoryId ?? '',
			paymentAccountId: expense.paymentAccountId ?? '',
			supplierId: expense.supplierId ?? '',
			productionBatchId: expense.productionBatchId ?? '',
		})
	}, [open, expense])

	const set = (field) => (e) => {
		const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
		setForm((f) => {
			const next = { ...f, [field]: value }
			// Choosing a category pre-fills its usual department, because most categories only
			// ever belong to one. It is a starting point, not a lock - the clerk can change it,
			// and what they choose is what gets stored.
			if (field === 'categoryId' && value) {
				const cat = reference.categories.find((c) => String(c.id) === String(value))
				if (cat?.defaultDepartmentId && !f.departmentId) next.departmentId = cat.defaultDepartmentId
			}
			// Quantity x unit price is offered as the amount when the amount is still blank.
			if ((field === 'quantity' || field === 'unitPrice') && !f.amount) {
				const q = Number(field === 'quantity' ? value : f.quantity)
				const p = Number(field === 'unitPrice' ? value : f.unitPrice)
				if (q > 0 && p > 0) next.amount = String(Math.round(q * p * 100) / 100)
			}
			return next
		})
	}

	const submit = async () => {
		setSaving(true)
		const payload = { ...form }
		// Empty strings are not the same as "not provided" to the API - a '' supplierId would
		// fail the foreign key rather than being treated as absent.
		Object.keys(payload).forEach((k) => {
			if (payload[k] === '') payload[k] = null
		})
		const ok = expense ? await dispatch(updateExpense(expense.id, payload)) : await dispatch(createExpense(payload))
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getExpenses(filters))
		}
	}

	const draftBatches = reference.draftBatches || []
	const batchHint = draftBatches.length ? BATCH_HINT_AVAILABLE : BATCH_HINT_NONE
	const daysBack = Math.round((new Date(today()) - new Date(form.expenseDate || today())) / 86400000)
	const amountNum = Number(form.amount) || 0

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>{expense ? 'Edit expense' : 'Record an expense'}</ModalHeader>
			<ModalBody>
				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="expenseDate">Date paid *</Label>
							<Input id="expenseDate" type="date" max={today()} value={form.expenseDate} onChange={set('expenseDate')} />
							{daysBack > 7 && (
								<small className="text-warning">
									{daysBack} days ago. Entries older than 7 days need a manager.
								</small>
							)}
						</FormGroup>
					</Col>
					<Col md="8">
						<FormGroup>
							<Label for="description">What was it for? *</Label>
							<Input id="description" placeholder="e.g. Firewood — 4 truckloads" value={form.description} onChange={set('description')} />
						</FormGroup>
					</Col>
				</Row>

				<Row>
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
				</Row>

				{/* Without this field nothing could ever tag a cost to a batch, so every batch
				    posted with conversionCost = 0 and warned about it — a warning that fires on
				    100% of batches is one people learn to click through. Drafts only, matching
				    what createExpense accepts. */}
				<Row>
					<Col md="12">
						<FormGroup>
							<Label for="productionBatchId">Part of a smoking batch?</Label>
							<Input
								id="productionBatchId"
								type="select"
								value={form.productionBatchId ?? ''}
								onChange={set('productionBatchId')}
								disabled={!draftBatches.length}
							>
								<option value="">No — this is a general cost</option>
								{draftBatches.map((b) => (
									<option key={b.id} value={b.id}>
										{b.reference} — {readable(b.batchDate)}
									</option>
								))}
							</Input>
							<small className="text-muted">{batchHint}</small>
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="3">
						<FormGroup>
							<Label for="quantity">Quantity</Label>
							<Input id="quantity" type="number" step="0.001" placeholder="4" value={form.quantity ?? ''} onChange={set('quantity')} />
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="unit">Unit</Label>
							<Input id="unit" placeholder="truckloads" value={form.unit ?? ''} onChange={set('unit')} />
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="unitPrice">Unit price</Label>
							<Input id="unitPrice" type="number" step="0.01" value={form.unitPrice ?? ''} onChange={set('unitPrice')} />
						</FormGroup>
					</Col>
					<Col md="3">
						<FormGroup>
							<Label for="amount">Total amount *</Label>
							<Input id="amount" type="number" step="0.01" value={form.amount} onChange={set('amount')} />
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="6">
						<FormGroup>
							<Label for="paymentAccountId">Paid from</Label>
							<Input id="paymentAccountId" type="select" value={form.paymentAccountId} onChange={set('paymentAccountId')}>
								<option value="">Not recorded</option>
								{reference.paymentAccounts.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="supplierId">Supplier</Label>
							<Input id="supplierId" type="select" value={form.supplierId} onChange={set('supplierId')}>
								<option value="">None</option>
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
							<Label for="receiptNumber">Receipt / reference no.</Label>
							<Input id="receiptNumber" value={form.receiptNumber ?? ''} onChange={set('receiptNumber')} />
						</FormGroup>
					</Col>
					<Col md="6">
						<FormGroup>
							<Label for="receiptUrl">Receipt image URL</Label>
							<Input id="receiptUrl" placeholder="Upload, then paste the link" value={form.receiptUrl ?? ''} onChange={set('receiptUrl')} />
						</FormGroup>
					</Col>
				</Row>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes ?? ''} onChange={set('notes')} />
				</FormGroup>

				<FormGroup check className="mb-1">
					<Label check>
						<Input type="checkbox" checked={Boolean(form.isCapex)} onChange={set('isCapex')} /> This is a capital item
					</Label>
				</FormGroup>
				{amountNum >= CAPEX_HINT && !form.isCapex && (
					<Alert color="warning" className="p-1 mb-0">
						Over ₦{CAPEX_HINT.toLocaleString()}. If it lasts more than a year — an oven, a vehicle, a freezer — tick capital item so it
						does not land entirely in this month.
					</Alert>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button
					color="primary"
					onClick={submit}
					disabled={saving || !form.expenseDate || !form.departmentId || !form.categoryId || !form.amount || !form.description}
				>
					{saving ? <Spinner size="sm" /> : expense ? 'Save changes' : 'Record expense'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default ExpenseForm
