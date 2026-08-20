import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup } from 'reactstrap'
import { Plus } from 'react-feather'
import { getFishPurchases, getProcurementReference } from '../store/action'
import { can } from '@src/utility/capabilities'
import NewPurchaseModal from './PurchaseForm'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const STATUS = {
	draft: { label: 'Draft', color: 'light-secondary' },
	received: { label: 'Received', color: 'light-success' },
	cancelled: { label: 'Cancelled', color: 'light-danger' },
}
const PAYMENT = {
	unpaid: { label: 'Unpaid', color: 'light-danger' },
	partial: { label: 'Part paid', color: 'light-warning' },
	paid: { label: 'Paid', color: 'light-success' },
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

const FishPurchasesList = () => {
	const dispatch = useDispatch()
	const { purchases, totals, reference, loading } = useSelector((s) => s.procurement)

	const [filters, setFilters] = useState({ startDate: monthStart() })
	const [newOpen, setNewOpen] = useState(false)

	useEffect(() => {
		dispatch(getProcurementReference())
	}, [])

	useEffect(() => {
		dispatch(getFishPurchases(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const drafts = purchases.filter((p) => p.status === 'draft').length
	let summary = `${purchases.length} shown · ${naira(totals.landedCost)} landed`
	if (totals.outstanding > 0) summary += ` · ${naira(totals.outstanding)} still owed`
	if (drafts) summary += ` · ${drafts} not yet received`

	return (
		<div className="fish-purchases">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Fish purchases
						</CardTitle>
						<small className="text-muted">{loading ? 'Loading…' : summary}</small>
					</div>
					{can('fishPurchases.create') && (
						<Button color="primary" onClick={() => setNewOpen(true)}>
							<Plus size={15} /> Record delivery
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
								<Label>Supplier</Label>
								<Input type="select" value={filters.supplierId || ''} onChange={set('supplierId')}>
									<option value="">All</option>
									{reference.suppliers.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={set('status')}>
									<option value="">All</option>
									<option value="draft">Draft</option>
									<option value="received">Received</option>
									<option value="cancelled">Cancelled</option>
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
										<th>Landed</th>
										<th>Supplier</th>
										<th>Status</th>
										<th className="text-right">Total cost</th>
										<th className="text-right">Outstanding</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{purchases.length === 0 && (
										<tr>
											<td colSpan="7" className="text-center text-muted py-3">
												No deliveries match this filter.
											</td>
										</tr>
									)}
									{purchases.map((p) => (
										<tr key={p.id}>
											<td className="text-nowrap">
												<Link to={`/procurement/view/${p.id}`} className="font-weight-bold">
													{p.reference}
												</Link>
											</td>
											<td className="text-nowrap">{readable(p.purchaseDate)}</td>
											<td>{p.supplier?.name || '—'}</td>
											<td className="text-nowrap">
												<Badge color={STATUS[p.status]?.color || 'light-secondary'}>
													{STATUS[p.status]?.label || p.status}
												</Badge>
												{p.status === 'received' && (
													<Badge color={PAYMENT[p.paymentStatus]?.color || 'light-secondary'} className="ml-50">
														{PAYMENT[p.paymentStatus]?.label || p.paymentStatus}
													</Badge>
												)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(p.totalLandedCost)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{p.outstanding > 0.005 ? naira(p.outstanding) : '—'}
											</td>
											<td className="text-nowrap">
												<Link to={`/procurement/view/${p.id}`}>
													<Button size="sm" color="flat-primary">
														{p.status === 'draft' ? 'Continue' : 'Open'}
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

			<NewPurchaseModal open={newOpen} toggle={() => setNewOpen(false)} />
		</div>
	)
}

export default FishPurchasesList
