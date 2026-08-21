import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup } from 'reactstrap'
import { Plus } from 'react-feather'
import { getExpenses, getExpenseSummary, getReferenceData, deleteExpense } from '../store/action'
import { can } from '@src/utility/capabilities'
import ExpenseForm from './ExpenseForm'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { monthStartLocal as monthStart, todayLocal } from '@utils'

// sweetalert2, not sweetalert. The codebase depends on the former (see PreviewActions.js);
// `sweetalert` is not installed at all and importing it fails the build.
const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const ExpensesList = () => {
	const dispatch = useDispatch()
	const { expenses, pagination, totalAmount, summary, reference, loading } = useSelector((s) => s.expenses)

	// Defaults to this month. An expense list with no date filter is a list nobody reads.
	const [filters, setFilters] = useState({ startDate: monthStart(), endDate: todayLocal() })
	const [formOpen, setFormOpen] = useState(false)
	const [editing, setEditing] = useState(null)

	const canReadAll = can('expenses.readAll')

	useEffect(() => {
		dispatch(getReferenceData())
	}, [])

	useEffect(() => {
		dispatch(getExpenses(filters))
		if (canReadAll) dispatch(getExpenseSummary(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const remove = async (expense) => {
		// The reason is captured because the audit trail keeps the row forever - a removal
		// with no stated reason is the one somebody has to reconstruct months later.
		const result = await MySwal.fire({
			title: 'Remove this expense?',
			html: `${expense.description} &mdash; <b>${naira(expense.amount)}</b><br/><small>It stays in the audit trail; nothing is erased.</small>`,
			input: 'text',
			inputPlaceholder: 'Why is it being removed?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(deleteExpense(expense.id, result.value || null))
		if (ok) dispatch(getExpenses(filters))
	}

	return (
		<div className="expenses-list">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Expenses
						</CardTitle>
						<small className="text-muted">
							{loading ? 'Loading…' : `${expenses.length} of ${pagination.total} shown · ${naira(totalAmount)} for this filter`}
						</small>
					</div>
					{can('expenses.create') && (
						<Button
							color="primary"
							onClick={() => {
								setEditing(null)
								setFormOpen(true)
							}}
						>
							<Plus size={15} /> Record expense
						</Button>
					)}
				</CardHeader>

				<CardBody>
					<Row className="mb-1">
						<Col md="2">
							<FormGroup>
								<Label>From</Label>
								<Input type="date" value={filters.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="2">
							<FormGroup>
								<Label>To</Label>
								<Input type="date" value={filters.endDate || ''} onChange={set('endDate')} />
							</FormGroup>
						</Col>
						<Col md="2">
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
						<Col md="2">
							<FormGroup>
								<Label>Category</Label>
								<Input type="select" value={filters.categoryId || ''} onChange={set('categoryId')}>
									<option value="">All</option>
									{reference.categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</Input>
							</FormGroup>
						</Col>
						<Col md="2">
							<FormGroup>
								<Label>Paid from</Label>
								<Input type="select" value={filters.paymentAccountId || ''} onChange={set('paymentAccountId')}>
									<option value="">All</option>
									{reference.paymentAccounts.map((a) => (
										<option key={a.id} value={a.id}>
											{a.name}
										</option>
									))}
								</Input>
							</FormGroup>
						</Col>
						<Col md="2">
							<FormGroup>
								<Label>Search</Label>
								<Input placeholder="description, receipt no…" value={filters.search || ''} onChange={set('search')} />
							</FormGroup>
						</Col>
					</Row>

					{/* Departmental totals — the segmentation the requirement leads with. Manager and
					    above; a clerk sees their own entries without the business-wide picture. */}
					{canReadAll && summary?.byDepartment?.length > 0 && (
						<Row className="mb-2">
							{summary.byDepartment.map((d) => (
								<Col key={d.departmentId} md="2" sm="4" xs="6" className="mb-1">
									<div className="border rounded p-1">
										<div className="text-muted" style={{ fontSize: '0.75rem' }}>
											{d.department?.name || 'Unassigned'}
										</div>
										<div style={{ fontWeight: 600 }}>{naira(d.total)}</div>
										<div className="text-muted" style={{ fontSize: '0.7rem' }}>
											{d.entries} {d.entries === 1 ? 'entry' : 'entries'}
										</div>
									</div>
								</Col>
							))}
						</Row>
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
										<th>Date</th>
										<th>Description</th>
										<th>Department</th>
										<th>Category</th>
										<th>Paid from</th>
										<th className="text-right">Amount</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{expenses.length === 0 && (
										<tr>
											<td colSpan="7" className="text-center text-muted py-2">
												No expenses match this filter.
											</td>
										</tr>
									)}
									{expenses.map((e) => (
										<tr key={e.id} className={e.deletedAt ? 'text-muted' : ''}>
											<td className="text-nowrap">{String(e.expenseDate).slice(0, 10)}</td>
											<td>
												{e.description}
												{e.isCapex && (
													<Badge color="light-info" className="ml-50">
														Capital
													</Badge>
												)}
												{e.deletedAt && (
													<Badge color="light-danger" className="ml-50">
														Removed
													</Badge>
												)}
												{e.quantity ? (
													<div className="text-muted" style={{ fontSize: '0.75rem' }}>
														{e.quantity} {e.unit || ''} {e.unitPrice ? `@ ${naira(e.unitPrice)}` : ''}
													</div>
												) : null}
											</td>
											<td>{e.department?.name || '—'}</td>
											<td>{e.expenseCategory?.name || '—'}</td>
											<td>{e.paymentAccount?.name || '—'}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(e.amount)}
											</td>
											<td className="text-nowrap">
												{can('expenses.update') && !e.deletedAt && (
													<Button
														size="sm"
														color="flat-primary"
														onClick={() => {
															setEditing(e)
															setFormOpen(true)
														}}
													>
														Edit
													</Button>
												)}
												{can('expenses.delete') && !e.deletedAt && (
													<Button size="sm" color="flat-danger" onClick={() => remove(e)}>
														Remove
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<ExpenseForm open={formOpen} toggle={() => setFormOpen(false)} expense={editing} filters={filters} />
		</div>
	)
}

export default ExpensesList
