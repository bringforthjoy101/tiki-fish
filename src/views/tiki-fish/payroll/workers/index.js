import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup } from 'reactstrap'
import { Plus, Lock } from 'react-feather'
import { getWorkers, getPayrollReference, deleteWorker } from '../store/action'
import { can } from '@src/utility/capabilities'
import WorkerForm from './WorkerForm'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const PAY_TYPE_LABEL = { monthly_fixed: 'Monthly', weekly_variable: 'Weekly' }

// A weekly worker legitimately has no usual rate - smokehouse pay varies by the week - so the
// dash here means "not recorded", not "unpaid".
const rateLabel = (w) => {
	if (w.payType === 'monthly_fixed') return naira(w.monthlyRate)
	if (w.defaultWeeklyRate) return `${naira(w.defaultWeeklyRate)} / wk`
	return '—'
}

const WorkersList = () => {
	const dispatch = useDispatch()
	const { workers, payVisible, loading, reference } = useSelector((s) => s.payroll)

	const [filters, setFilters] = useState({ status: 'active' })
	const [formOpen, setFormOpen] = useState(false)
	const [editing, setEditing] = useState(null)

	const canManage = can('workers.manage')

	useEffect(() => {
		dispatch(getPayrollReference())
	}, [])

	useEffect(() => {
		dispatch(getWorkers(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const remove = async (worker) => {
		const result = await MySwal.fire({
			title: `Remove ${worker.firstName} ${worker.lastName}?`,
			html: 'Anyone who has ever been paid should be set <b>inactive</b> instead — that keeps their pay history intact.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(deleteWorker(worker.id))
		if (ok) dispatch(getWorkers(filters))
	}

	// The register is a roster, not a payroll: monthly and weekly staff are counted
	// separately because a weekly headcount tells you what a Monday run will pre-fill.
	const active = workers.filter((w) => w.status === 'active')
	const weekly = active.filter((w) => w.payType === 'weekly_variable').length
	const summary = `${workers.length} shown · ${active.length} active · ${weekly} paid weekly`

	return (
		<div className="workers-list">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Worker register
						</CardTitle>
						<small className="text-muted">{loading ? 'Loading…' : summary}</small>
					</div>
					{canManage && (
						<Button
							color="primary"
							onClick={() => {
								setEditing(null)
								setFormOpen(true)
							}}
						>
							<Plus size={15} /> Add worker
						</Button>
					)}
				</CardHeader>

				<CardBody>
					<Row className="mb-1">
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
						<Col md="3">
							<FormGroup>
								<Label>Paid</Label>
								<Input type="select" value={filters.payType || ''} onChange={set('payType')}>
									<option value="">All</option>
									<option value="monthly_fixed">Monthly</option>
									<option value="weekly_variable">Weekly</option>
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={set('status')}>
									<option value="">All</option>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</Input>
							</FormGroup>
						</Col>
					</Row>

					{/* Said plainly rather than left as an unexplained absence. A manager who cannot
					    find the salary column should know it was withheld, not that it is missing. */}
					{!payVisible && (
						<div className="d-flex align-items-center text-muted mb-1">
							<Lock size={14} className="mr-50" />
							<small>Pay and bank details are not shown at your access level.</small>
						</div>
					)}

					{loading ? (
						<div className="text-center py-3">
							<Spinner />
						</div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Name</th>
										<th>Job title</th>
										<th>Department</th>
										<th>Paid</th>
										{payVisible && <th className="text-right">Rate</th>}
										<th>Status</th>
										{canManage && <th />}
									</tr>
								</thead>
								<tbody>
									{workers.length === 0 && (
										<tr>
											<td colSpan={payVisible ? 7 : 6} className="text-center text-muted py-2">
												Nobody on the register matches this filter.
											</td>
										</tr>
									)}
									{workers.map((w) => (
										<tr key={w.id}>
											<td>
												<span className="font-weight-bold">
													{w.firstName} {w.lastName}
												</span>
												{w.phone && (
													<div className="text-muted" style={{ fontSize: '0.75rem' }}>
														{w.phone}
													</div>
												)}
											</td>
											<td>{w.jobTitle || '—'}</td>
											<td>{w.department?.name || '—'}</td>
											<td>{PAY_TYPE_LABEL[w.payType] || w.payType}</td>
											{payVisible && (
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
													{rateLabel(w)}
												</td>
											)}
											<td>
												<Badge color={w.status === 'active' ? 'light-success' : 'light-secondary'}>
													{w.status === 'active' ? 'Active' : 'Inactive'}
												</Badge>
											</td>
											{canManage && (
												<td className="text-nowrap">
													<Button
														size="sm"
														color="flat-primary"
														onClick={() => {
															setEditing(w)
															setFormOpen(true)
														}}
													>
														Edit
													</Button>
													<Button size="sm" color="flat-danger" onClick={() => remove(w)}>
														Remove
													</Button>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<WorkerForm open={formOpen} toggle={() => setFormOpen(false)} worker={editing} filters={filters} />
		</div>
	)
}

export default WorkersList
