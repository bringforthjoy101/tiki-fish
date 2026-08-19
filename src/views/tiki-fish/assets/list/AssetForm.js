import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { createAsset, updateAsset, getAssets } from '../store/action'

const today = () => new Date().toISOString().slice(0, 10)

const blank = {
	name: '',
	description: '',
	departmentId: '',
	categoryId: '',
	acquiredOn: today(),
	cost: '',
	supplierId: '',
	usefulLifeMonths: '',
	residualValue: '',
	sourceExpenseId: '',
	location: '',
	serialNumber: '',
	notes: '',
}

const AssetForm = ({ open, toggle, asset, fromExpense, filters }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.assets)
	const [form, setForm] = useState(blank)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		if (asset) {
			setForm({
				...blank,
				...asset,
				departmentId: asset.departmentId ?? '',
				categoryId: asset.categoryId ?? '',
				supplierId: asset.supplierId ?? '',
				sourceExpenseId: asset.sourceExpenseId ?? '',
				acquiredOn: asset.acquiredOn?.slice(0, 10) || today(),
			})
			return
		}
		// Registering a capex payment: everything the expense already knows is carried over,
		// so the only thing left to answer is how long it will last. Retyping the amount is
		// how the register and the ledger end up disagreeing about the same oven.
		if (fromExpense) {
			setForm({
				...blank,
				name: fromExpense.description || '',
				departmentId: fromExpense.departmentId ?? '',
				categoryId: fromExpense.categoryId ?? '',
				supplierId: fromExpense.supplierId ?? '',
				acquiredOn: fromExpense.expenseDate?.slice(0, 10) || today(),
				cost: fromExpense.amount ?? '',
				sourceExpenseId: fromExpense.id,
			})
			return
		}
		setForm(blank)
	}, [open, asset, fromExpense])

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const submit = async () => {
		setSaving(true)
		const payload = { ...form }
		Object.keys(payload).forEach((k) => {
			if (payload[k] === '') payload[k] = null
		})
		const ok = asset ? await dispatch(updateAsset(asset.id, payload)) : await dispatch(createAsset(payload))
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getAssets(filters))
		}
	}

	const incomplete = !form.name || !form.departmentId || !form.acquiredOn || !Number(form.cost)

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>{asset ? asset.name : 'Add to the asset register'}</ModalHeader>
			<ModalBody>
				{fromExpense && !asset && (
					<Alert color="info" className="p-1">
						Registering the payment <b>{fromExpense.reference}</b>. The amount and date come from that expense and
						stay linked to it.
					</Alert>
				)}
				<Row>
					<Col md="8">
						<FormGroup>
							<Label for="name">What is it? *</Label>
							<Input id="name" placeholder="e.g. Smokehouse oven no. 2" value={form.name ?? ''} onChange={set('name')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="acquiredOn">Acquired *</Label>
							<Input id="acquiredOn" type="date" max={today()} value={form.acquiredOn ?? ''} onChange={set('acquiredOn')} />
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="4">
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
					<Col md="4">
						<FormGroup>
							<Label for="categoryId">Category</Label>
							<Input id="categoryId" type="select" value={form.categoryId} onChange={set('categoryId')}>
								<option value="">None</option>
								{reference.categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="cost">Cost *</Label>
							<Input id="cost" type="number" step="0.01" value={form.cost ?? ''} onChange={set('cost')} />
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="4">
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
					<Col md="4">
						<FormGroup>
							<Label for="location">Where is it?</Label>
							<Input id="location" placeholder="e.g. Smokehouse" value={form.location ?? ''} onChange={set('location')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="serialNumber">Serial number</Label>
							<Input id="serialNumber" value={form.serialNumber ?? ''} onChange={set('serialNumber')} />
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="usefulLifeMonths">Expected life (months)</Label>
							<Input
								id="usefulLifeMonths"
								type="number"
								placeholder="e.g. 60"
								value={form.usefulLifeMonths ?? ''}
								onChange={set('usefulLifeMonths')}
							/>
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="residualValue">Expected value at the end</Label>
							<Input id="residualValue" type="number" step="0.01" value={form.residualValue ?? ''} onChange={set('residualValue')} />
						</FormGroup>
					</Col>
				</Row>

				{/* Said plainly, because the fields above invite the opposite assumption. */}
				<div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
					Life and residual value are recorded but not used to calculate anything — nothing is depreciated. They are
					captured now because only the person holding the invoice can answer them.
				</div>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes ?? ''} onChange={set('notes')} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : asset ? 'Save changes' : 'Add asset'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default AssetForm
