import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { createWorker, updateWorker, getWorkers } from '../store/action'

const blank = {
	firstName: '',
	lastName: '',
	phone: '',
	departmentId: '',
	jobTitle: '',
	payType: 'monthly_fixed',
	monthlyRate: '',
	defaultWeeklyRate: '',
	bankName: '',
	accountNumber: '',
	accountName: '',
	startDate: '',
	endDate: '',
	status: 'active',
	notes: '',
}

const WorkerForm = ({ open, toggle, worker, filters }) => {
	const dispatch = useDispatch()
	const { reference, payVisible } = useSelector((s) => s.payroll)
	const [form, setForm] = useState(blank)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		if (!worker) {
			setForm(blank)
			return
		}
		setForm({
			...blank,
			...worker,
			departmentId: worker.departmentId ?? '',
			monthlyRate: worker.monthlyRate ?? '',
			defaultWeeklyRate: worker.defaultWeeklyRate ?? '',
			startDate: worker.startDate?.slice(0, 10) || '',
			endDate: worker.endDate?.slice(0, 10) || '',
		})
	}, [open, worker])

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const monthly = form.payType === 'monthly_fixed'

	const submit = async () => {
		setSaving(true)
		const payload = { ...form }
		if (payVisible) {
			// The other pay type's rate is cleared rather than carried. Leaving a stale weekly
			// rate on someone moved to monthly means a weekly run would pre-fill an amount for a
			// person who is no longer paid weekly.
			if (monthly) payload.defaultWeeklyRate = null
			else payload.monthlyRate = null
		} else {
			// Never send a rate field this admin was not shown. The API treats an absent field
			// as "unchanged" and an explicit null as "clear it", so posting the blank inputs
			// behind the hidden section would wipe a salary the editor could not even see.
			// Today only an owner holds workers.manage, so this branch is unreachable - it is
			// here so that granting a manager edit rights later cannot silently erase pay.
			delete payload.monthlyRate
			delete payload.defaultWeeklyRate
			delete payload.bankName
			delete payload.accountNumber
			delete payload.accountName
		}
		Object.keys(payload).forEach((k) => {
			if (payload[k] === '') payload[k] = null
		})
		const ok = worker ? await dispatch(updateWorker(worker.id, payload)) : await dispatch(createWorker(payload))
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getWorkers(filters))
		}
	}

	// Mirrors the DB CHECK: monthly pay is fixed and knowable in advance, so it is required.
	// A weekly worker with no usual rate is legitimate - smokehouse pay varies by the week.
	const rateMissing = payVisible && monthly && !Number(form.monthlyRate)
	const incomplete = !form.firstName || !form.lastName || !form.departmentId || rateMissing

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>{worker ? `${worker.firstName} ${worker.lastName}` : 'Add a worker'}</ModalHeader>
			<ModalBody>
				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="firstName">First name *</Label>
							<Input id="firstName" value={form.firstName ?? ''} onChange={set('firstName')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="lastName">Last name *</Label>
							<Input id="lastName" value={form.lastName ?? ''} onChange={set('lastName')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="phone">Phone</Label>
							<Input id="phone" value={form.phone ?? ''} onChange={set('phone')} />
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
							<Label for="jobTitle">Job title</Label>
							<Input id="jobTitle" placeholder="e.g. Smoker" value={form.jobTitle ?? ''} onChange={set('jobTitle')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="payType">Paid *</Label>
							<Input id="payType" type="select" value={form.payType} onChange={set('payType')}>
								<option value="monthly_fixed">Monthly — fixed salary</option>
								<option value="weekly_variable">Weekly — varies by the week</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>

				{payVisible && (
					<>
						<Row>
							<Col md="4">
								<FormGroup>
									<Label for="rate">{monthly ? 'Monthly salary *' : 'Usual weekly pay'}</Label>
									<Input
										id="rate"
										type="number"
										step="0.01"
										value={(monthly ? form.monthlyRate : form.defaultWeeklyRate) ?? ''}
										onChange={set(monthly ? 'monthlyRate' : 'defaultWeeklyRate')}
									/>
									{!monthly && <small className="text-muted">Only a starting point — each week's run can differ.</small>}
								</FormGroup>
							</Col>
							<Col md="4">
								<FormGroup>
									<Label for="bankName">Bank</Label>
									<Input id="bankName" value={form.bankName ?? ''} onChange={set('bankName')} />
								</FormGroup>
							</Col>
							<Col md="4">
								<FormGroup>
									<Label for="accountNumber">Account number</Label>
									<Input id="accountNumber" value={form.accountNumber ?? ''} onChange={set('accountNumber')} />
								</FormGroup>
							</Col>
						</Row>
						<Row>
							<Col md="4">
								<FormGroup>
									<Label for="accountName">Account name</Label>
									<Input id="accountName" value={form.accountName ?? ''} onChange={set('accountName')} />
								</FormGroup>
							</Col>
						</Row>
					</>
				)}

				<Row>
					<Col md="4">
						<FormGroup>
							<Label for="startDate">Started</Label>
							<Input id="startDate" type="date" value={form.startDate ?? ''} onChange={set('startDate')} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="endDate">Left</Label>
							<Input id="endDate" type="date" value={form.endDate ?? ''} onChange={set('endDate')} />
							<small className="text-muted">Set this and they drop off future runs.</small>
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label for="status">Status</Label>
							<Input id="status" type="select" value={form.status} onChange={set('status')}>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes ?? ''} onChange={set('notes')} />
				</FormGroup>

				{worker && payVisible && (
					<Alert color="warning" className="p-1 mb-0">
						A changed rate applies to future runs only. Runs already approved keep the amount actually paid.
					</Alert>
				)}
				{rateMissing && (
					<Alert color="danger" className="p-1 mb-0">
						A monthly worker needs a salary. Weekly workers may be left without one.
					</Alert>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : worker ? 'Save changes' : 'Add worker'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default WorkerForm
