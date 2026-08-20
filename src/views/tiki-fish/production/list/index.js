import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import {
	Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge,
	Spinner, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap'
import { Plus } from 'react-feather'
import { getBatches, getProductionReference, createBatch } from '../store/action'
import { can } from '@src/utility/capabilities'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const today = () => new Date().toISOString().slice(0, 10)

const STATUS = {
	draft: { label: 'Draft', color: 'light-secondary' },
	posted: { label: 'Posted', color: 'light-success' },
	voided: { label: 'Voided', color: 'light-danger' },
}

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const monthStart = () => {
	const d = new Date()
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

const NewBatchModal = ({ open, toggle }) => {
	const dispatch = useDispatch()
	const history = useHistory()
	const { reference } = useSelector((s) => s.production)
	const [form, setForm] = useState({ batchDate: today(), departmentId: '', notes: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		// Smoking is what a batch is, so the smokehouse is the answer almost every time.
		const smokehouse = reference.departments.find((d) => d.code === 'SMOKEHOUSE')
		setForm({ batchDate: today(), departmentId: smokehouse ? smokehouse.id : '', notes: '' })
	}, [open, reference.departments])

	const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const submit = async () => {
		setSaving(true)
		const batch = await dispatch(createBatch({ ...form, notes: form.notes || null }))
		setSaving(false)
		if (batch) {
			toggle()
			history.push(`/production/view/${batch.id}`)
		}
	}

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>Start a batch</ModalHeader>
			<ModalBody>
				<FormGroup>
					<Label for="batchDate">Date processed *</Label>
					<Input id="batchDate" type="date" max={today()} value={form.batchDate} onChange={set('batchDate')} />
					<small className="text-muted">
						The fish is costed at what it was worth on this day, so a batch keyed late still costs correctly.
					</small>
				</FormGroup>
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
				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes} onChange={set('notes')} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || !form.batchDate || !form.departmentId}>
					{saving ? <Spinner size="sm" /> : 'Open batch'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

const BatchesList = () => {
	const dispatch = useDispatch()
	const { batches, totals, reference, loading } = useSelector((s) => s.production)
	const [filters, setFilters] = useState({ startDate: monthStart() })
	const [newOpen, setNewOpen] = useState(false)

	useEffect(() => {
		dispatch(getProductionReference())
	}, [])

	useEffect(() => {
		dispatch(getBatches(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const drafts = batches.filter((b) => b.status === 'draft').length
	let summary = `${batches.length} shown · ${totals.posted} posted · ${naira(totals.totalCost)} of cost`
	if (drafts) summary += ` · ${drafts} still open`

	return (
		<div className="batches-list">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Production
						</CardTitle>
						<small className="text-muted">{loading ? 'Loading…' : summary}</small>
					</div>
					{can('batches.create') && (
						<Button color="primary" onClick={() => setNewOpen(true)}>
							<Plus size={15} /> Start a batch
						</Button>
					)}
				</CardHeader>

				<CardBody>
					<Row className="mb-1">
						<Col md="3">
							<FormGroup>
								<Label>From</Label>
								<Input type="date" value={filters.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>To</Label>
								<Input type="date" value={filters.endDate || ''} onChange={set('endDate')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={set('status')}>
									<option value="">All</option>
									<option value="draft">Draft</option>
									<option value="posted">Posted</option>
									<option value="voided">Voided</option>
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Department</Label>
								<Input type="select" value={filters.departmentId || ''} onChange={set('departmentId')}>
									<option value="">All</option>
									{reference.departments.map((d) => (
										<option key={d.id} value={d.id}>
											{d.name}
										</option>
									))}
								</Input>
							</FormGroup>
						</Col>
					</Row>

					{loading ? (
						<div className="text-center py-3">
							<Spinner />
						</div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Reference</th>
										<th>Processed</th>
										<th>Department</th>
										<th>Status</th>
										<th className="text-right">Fish</th>
										<th className="text-right">Conversion</th>
										<th className="text-right">Total cost</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{batches.length === 0 && (
										<tr>
											<td colSpan="8" className="text-center text-muted py-3">
												No batches match this filter.
											</td>
										</tr>
									)}
									{batches.map((b) => (
										<tr key={b.id}>
											<td className="text-nowrap">
												<Link to={`/production/view/${b.id}`} className="font-weight-bold">
													{b.reference}
												</Link>
											</td>
											<td className="text-nowrap">{readable(b.batchDate)}</td>
											<td>{b.department?.name || '—'}</td>
											<td className="text-nowrap">
												<Badge color={STATUS[b.status]?.color || 'light-secondary'}>
													{STATUS[b.status]?.label || b.status}
												</Badge>
												{/* A posted batch with no conversion cost understates itself, and the
												    variance it feeds will read favourably for the wrong reason. */}
												{b.status === 'posted' && !b.conversionCostCaptured && (
													<Badge color="light-warning" className="ml-50">
														no conversion cost
													</Badge>
												)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{b.status === 'posted' ? naira(b.inputCost) : '—'}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{b.status === 'posted' ? naira(b.conversionCost) : '—'}
											</td>
											<td className="text-right text-nowrap font-weight-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{b.status === 'posted' ? naira(b.totalCostToAllocate) : '—'}
											</td>
											<td className="text-nowrap">
												<Link to={`/production/view/${b.id}`}>
													<Button size="sm" color="flat-primary">
														{b.status === 'draft' ? 'Continue' : 'Open'}
													</Button>
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<NewBatchModal open={newOpen} toggle={() => setNewOpen(false)} />
		</div>
	)
}

export default BatchesList
