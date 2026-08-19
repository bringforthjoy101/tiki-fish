import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup } from 'reactstrap'
import { Plus } from 'react-feather'
import { getPayRuns, getPayrollReference } from '../store/action'
import { can } from '@src/utility/capabilities'
import NewRunModal from './NewRunModal'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const STATUS_COLOR = { draft: 'light-secondary', approved: 'light-success', paid: 'light-primary', cancelled: 'light-danger' }
const PAY_TYPE_LABEL = { monthly_fixed: 'Monthly', weekly_variable: 'Weekly' }

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PayRunsList = () => {
	const dispatch = useDispatch()
	const { payRuns, loading } = useSelector((s) => s.payroll)
	const [filters, setFilters] = useState({})
	const [newOpen, setNewOpen] = useState(false)

	useEffect(() => {
		dispatch(getPayrollReference())
	}, [])

	useEffect(() => {
		dispatch(getPayRuns(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const drafts = payRuns.filter((r) => r.status === 'draft').length

	return (
		<div className="pay-runs-list">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Pay runs
						</CardTitle>
						<small className="text-muted">
							{loading ? 'Loading…' : `${payRuns.length} shown${drafts ? ` · ${drafts} still in draft` : ''}`}
						</small>
					</div>
					{can('payroll.run') && (
						<Button color="primary" onClick={() => setNewOpen(true)}>
							<Plus size={15} /> New pay run
						</Button>
					)}
				</CardHeader>

				<CardBody>
					<Row className="mb-1">
						<Col md="3">
							<FormGroup>
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={set('status')}>
									<option value="">All</option>
									<option value="draft">Draft</option>
									<option value="approved">Approved</option>
									<option value="paid">Paid</option>
									<option value="cancelled">Cancelled</option>
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Payroll</Label>
								<Input type="select" value={filters.payType || ''} onChange={set('payType')}>
									<option value="">All</option>
									<option value="weekly_variable">Weekly</option>
									<option value="monthly_fixed">Monthly</option>
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Period from</Label>
								<Input type="date" value={filters.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Period to</Label>
								<Input type="date" value={filters.endDate || ''} onChange={set('endDate')} />
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
										<th>Payroll</th>
										<th>Period</th>
										<th>Status</th>
										<th>Paid from</th>
										<th className="text-right">Total</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{payRuns.length === 0 && (
										<tr>
											<td colSpan="7" className="text-center text-muted py-2">
												No pay runs match this filter.
											</td>
										</tr>
									)}
									{payRuns.map((r) => (
										<tr key={r.id}>
											<td className="text-nowrap">
												<Link to={`/payroll/runs/view/${r.id}`} className="font-weight-bold">
													{r.reference}
												</Link>
											</td>
											<td>{PAY_TYPE_LABEL[r.payType] || r.payType}</td>
											<td className="text-nowrap">
												{readable(r.periodStart)} → {readable(r.periodEnd)}
											</td>
											<td>
												<Badge color={STATUS_COLOR[r.status] || 'light-secondary'}>{r.status}</Badge>
											</td>
											<td>{r.paymentAccount?.name || '—'}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(r.totalAmount)}
											</td>
											<td className="text-nowrap">
												<Link to={`/payroll/runs/view/${r.id}`}>
													<Button size="sm" color="flat-primary">
														{r.status === 'draft' ? 'Continue' : 'Open'}
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

			<NewRunModal open={newOpen} toggle={() => setNewOpen(false)} />
		</div>
	)
}

export default PayRunsList
