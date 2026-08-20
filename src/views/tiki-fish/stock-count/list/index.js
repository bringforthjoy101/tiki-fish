import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { Plus } from 'react-feather'
import { getStockCounts, createStockCount } from '../store/action'
import { can } from '@src/utility/capabilities'

const today = () => new Date().toISOString().slice(0, 10)

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS = {
	draft: { label: 'Draft', color: 'light-secondary' },
	posted: { label: 'Posted', color: 'light-success' },
	cancelled: { label: 'Cancelled', color: 'light-danger' },
}

const NewCountModal = ({ open, toggle }) => {
	const dispatch = useDispatch()
	const history = useHistory()
	const [form, setForm] = useState({ countDate: today(), notes: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (open) setForm({ countDate: today(), notes: '' })
	}, [open])

	const submit = async () => {
		setSaving(true)
		const created = await dispatch(createStockCount({ countDate: form.countDate, notes: form.notes || null }))
		setSaving(false)
		if (created) {
			toggle()
			history.push(`/stock-counts/view/${created.id}`)
		}
	}

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>Start a count</ModalHeader>
			<ModalBody>
				<FormGroup>
					<Label for="countDate">Counted on *</Label>
					<Input id="countDate" type="date" max={today()} value={form.countDate} onChange={(e) => setForm((f) => ({ ...f, countDate: e.target.value }))} />
					<small className="text-muted">
						The day the stock was physically counted, not today. Every correction this count posts is dated from
						here, so a sheet filled in on paper and keyed days later still lands in the right period.
					</small>
				</FormGroup>
				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>Cancel</Button>
				<Button color="primary" onClick={submit} disabled={saving || !form.countDate}>
					{saving ? <Spinner size="sm" /> : 'Open the count'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

const StockCountList = () => {
	const dispatch = useDispatch()
	const { counts, loading } = useSelector((s) => s.stockCount)
	const [filters, setFilters] = useState({})
	const [newOpen, setNewOpen] = useState(false)

	useEffect(() => {
		dispatch(getStockCounts(filters))
	}, [JSON.stringify(filters)])

	return (
		<div className="stock-count-list">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">Stock counts</CardTitle>
						<small className="text-muted">{loading ? 'Loading…' : `${counts.length} count(s)`}</small>
					</div>
					{can('stockCounts.manage') && (
						<Button color="primary" onClick={() => setNewOpen(true)}>
							<Plus size={15} /> Start a count
						</Button>
					)}
				</CardHeader>
				<CardBody>
					<Row className="mb-1">
						<Col md="3">
							<FormGroup>
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
									<option value="">All</option>
									<option value="draft">Draft</option>
									<option value="posted">Posted</option>
									<option value="cancelled">Cancelled</option>
								</Input>
							</FormGroup>
						</Col>
					</Row>

					{loading ? (
						<div className="text-center py-3"><Spinner /></div>
					) : (
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Reference</th>
									<th>Counted on</th>
									<th>Status</th>
									<th>Notes</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{counts.length === 0 && (
									<tr><td colSpan="5" className="text-center text-muted py-3">No counts yet.</td></tr>
								)}
								{counts.map((c) => (
									<tr key={c.id}>
										<td className="text-nowrap">
											<Link to={`/stock-counts/view/${c.id}`} className="font-weight-bold">{c.reference}</Link>
										</td>
										<td className="text-nowrap">{readable(c.countDate)}</td>
										<td><Badge color={STATUS[c.status]?.color}>{STATUS[c.status]?.label || c.status}</Badge></td>
										<td className="text-muted">{c.notes || '—'}</td>
										<td className="text-nowrap">
											<Link to={`/stock-counts/view/${c.id}`}>
												<Button size="sm" color="flat-primary">{c.status === 'draft' ? 'Continue' : 'Open'}</Button>
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					)}
				</CardBody>
			</Card>

			<NewCountModal open={newOpen} toggle={() => setNewOpen(false)} />
		</div>
	)
}

export default StockCountList
