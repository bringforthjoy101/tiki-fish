import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Button, Table, Badge, Spinner, Alert } from 'reactstrap'
import { ArrowLeft, Check } from 'react-feather'
import { getPayRun, getPayrollReference, updatePayRunItem, removePayRunItem } from '../../store/action'
import { can } from '@src/utility/capabilities'
import ApproveModal from './ApproveModal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const STATUS_COLOR = { draft: 'light-secondary', approved: 'light-success', paid: 'light-primary', cancelled: 'light-danger' }

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
const monthLabel = (s) => {
	const [y, m] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, 1).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
}

const PayRunView = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const { payRun, loading } = useSelector((s) => s.payroll)

	// Local entry state. The server stays authoritative for the month split and the run
	// total; these hold only what is being typed right now.
	const [amounts, setAmounts] = useState({})
	const [days, setDays] = useState({})
	const [savingId, setSavingId] = useState(null)
	const [savedId, setSavedId] = useState(null)
	const [approveOpen, setApproveOpen] = useState(false)
	const focusedRef = useRef(null)

	useEffect(() => {
		dispatch(getPayrollReference())
		dispatch(getPayRun(id))
		return () => dispatch({ type: 'CLEAR_PAY_RUN' })
	}, [id])

	// Re-syncs from the server after every save, EXCEPT for the field the cursor is in.
	// Overwriting that one would delete what someone is halfway through typing, which on this
	// screen means a wrong wage rather than a lost keystroke.
	useEffect(() => {
		if (!payRun) return
		const items = payRun.payRunItems || []
		setAmounts((prev) => {
			const next = {}
			for (const it of items) {
				next[it.id] = focusedRef.current === it.id && prev[it.id] !== undefined ? prev[it.id] : String(it.grossAmount ?? '')
			}
			return next
		})
		setDays((prev) => {
			const next = {}
			for (const it of items) {
				next[it.id] = focusedRef.current === it.id && prev[it.id] !== undefined ? prev[it.id] : it.daysWorked ?? ''
			}
			return next
		})
	}, [payRun])

	const isDraft = payRun?.status === 'draft'
	const editable = isDraft && can('payroll.run')
	const weekly = payRun?.payType === 'weekly_variable'

	const saveLine = async (item) => {
		const raw = amounts[item.id]
		// A blank field means "leave it as it was", not zero. A number input rejects what it
		// cannot parse by handing back an empty string, so treating blank as 0 would turn a
		// mistyped "45,000" into a worker paid nothing, saved without a word. Zeroing a line is
		// still possible - you type 0, deliberately.
		if (raw === '' || raw === undefined || raw === null) {
			setAmounts((a) => ({ ...a, [item.id]: String(item.grossAmount ?? '') }))
			return
		}
		const amount = Number(raw)
		if (!Number.isFinite(amount)) return
		const dayCount = days[item.id] === '' || days[item.id] === undefined ? null : Number(days[item.id])
		if (amount === Number(item.grossAmount) && dayCount === (item.daysWorked ?? null)) return
		setSavingId(item.id)
		const ok = await dispatch(updatePayRunItem(item.id, { grossAmount: amount, daysWorked: dayCount }))
		setSavingId(null)
		if (ok) {
			setSavedId(item.id)
			setTimeout(() => setSavedId((c) => (c === item.id ? null : c)), 1500)
			// Quiet: picks up the rebuilt month split and the new run total without a spinner
			// tearing the table down under the cursor.
			dispatch(getPayRun(id, { quiet: true }))
		}
	}

	const removeLine = async (item) => {
		const result = await MySwal.fire({
			title: `Take ${item.worker?.firstName} ${item.worker?.lastName} off this run?`,
			text: 'They stay on the register — this only removes them from this period.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(removePayRunItem(item.id))
		if (ok) dispatch(getPayRun(id, { quiet: true }))
	}

	if (loading && !payRun) {
		return (
			<div className="text-center py-4">
				<Spinner />
			</div>
		)
	}
	if (!payRun) {
		return (
			<Alert color="danger" className="p-2">
				That pay run could not be loaded.{' '}
				<Link to="/payroll/runs">Back to pay runs</Link>
			</Alert>
		)
	}

	const items = payRun.payRunItems || []
	// Summed from the lines rather than read off the header, so a header the server has not
	// caught up with is visible as a difference instead of hiding one.
	const lineTotal = items.reduce((a, i) => a + (Number(i.grossAmount) || 0), 0)
	const unset = items.filter((i) => !Number(i.grossAmount)).length
	const straddles = items.some((i) => (i.payRunItemAllocations || []).length > 1)

	return (
		<div className="pay-run-view">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-start flex-wrap">
					<div>
						<Link to="/payroll/runs" className="text-muted d-inline-flex align-items-center mb-50">
							<ArrowLeft size={14} className="mr-25" /> Pay runs
						</Link>
						<CardTitle tag="h4" className="mb-25">
							{payRun.reference}{' '}
							<Badge color={STATUS_COLOR[payRun.status] || 'light-secondary'} className="align-middle">
								{payRun.status}
							</Badge>
						</CardTitle>
						<small className="text-muted">
							{weekly ? 'Weekly' : 'Monthly'} · {readable(payRun.periodStart)} → {readable(payRun.periodEnd)} ·{' '}
							{items.length} worker{items.length === 1 ? '' : 's'}
							{payRun.paymentAccount?.name ? ` · paid from ${payRun.paymentAccount.name}` : ''}
						</small>
					</div>
					<div className="text-right">
						<div style={{ fontSize: '1.4rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{naira(lineTotal)}</div>
						{isDraft && can('payroll.approve') && (
							<Button color="success" className="mt-50" onClick={() => setApproveOpen(true)} disabled={!items.length}>
								Approve run
							</Button>
						)}
					</div>
				</CardHeader>

				<CardBody>
					{isDraft && (
						<Alert color="warning" className="p-1">
							This run is a draft. Nothing has been posted to the ledger yet
							{unset > 0 && `, and ${unset} line${unset === 1 ? ' has' : 's have'} no amount set`}.
						</Alert>
					)}
					{straddles && (
						<div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
							This period crosses month end. Each amount is split between the months by days worked — the split shown
							under each figure is what the monthly reports will use.
						</div>
					)}

					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Worker</th>
									<th>Department</th>
									{weekly && <th className="text-center">Days</th>}
									<th className="text-right" style={{ minWidth: 190 }}>
										Amount
									</th>
									{editable && <th />}
								</tr>
							</thead>
							<tbody>
								{items.length === 0 && (
									<tr>
										<td colSpan="5" className="text-center text-muted py-2">
											Nobody is on this run. Everyone active in the period was already excluded — check the
											register.
										</td>
									</tr>
								)}
								{items.map((item) => {
									const allocations = item.payRunItemAllocations || []
									return (
										<tr key={item.id}>
											<td>
												<span className="font-weight-bold">
													{item.worker?.firstName} {item.worker?.lastName}
												</span>
												{item.worker?.jobTitle && (
													<div className="text-muted" style={{ fontSize: '0.75rem' }}>
														{item.worker.jobTitle}
													</div>
												)}
											</td>
											<td>{item.department?.name || '—'}</td>
											{weekly && (
												<td className="text-center" style={{ maxWidth: 90 }}>
													{editable ? (
														<Input
															type="number"
															bsSize="sm"
															className="text-center"
															value={days[item.id] ?? ''}
															onFocus={() => (focusedRef.current = item.id)}
															onChange={(e) => setDays((d) => ({ ...d, [item.id]: e.target.value }))}
															onBlur={() => {
																focusedRef.current = null
																saveLine(item)
															}}
														/>
													) : (
														item.daysWorked ?? '—'
													)}
												</td>
											)}
											<td className="text-right">
												{editable ? (
													<div className="d-flex align-items-center justify-content-end">
														<Input
															type="number"
															step="0.01"
															bsSize="sm"
															className="text-right"
															style={{ maxWidth: 140, fontVariantNumeric: 'tabular-nums' }}
															value={amounts[item.id] ?? ''}
															onFocus={() => (focusedRef.current = item.id)}
															onChange={(e) => setAmounts((a) => ({ ...a, [item.id]: e.target.value }))}
															onBlur={() => {
																focusedRef.current = null
																saveLine(item)
															}}
															onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
														/>
														<span style={{ width: 22 }} className="ml-50">
															{savingId === item.id && <Spinner size="sm" />}
															{savedId === item.id && <Check size={16} className="text-success" />}
														</span>
													</div>
												) : (
													<span className="text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
														{naira(item.grossAmount)}
													</span>
												)}
												{allocations.length > 1 && (
													<div className="text-muted mt-25" style={{ fontSize: '0.7rem' }}>
														{allocations
															.slice()
															.sort((a, b) => String(a.monthStart).localeCompare(String(b.monthStart)))
															.map((a) => `${monthLabel(a.monthStart)} ${a.days}d ${naira(a.amount)}`)
															.join(' · ')}
													</div>
												)}
											</td>
											{editable && (
												<td className="text-nowrap">
													<Button size="sm" color="flat-danger" onClick={() => removeLine(item)}>
														Remove
													</Button>
												</td>
											)}
										</tr>
									)
								})}
							</tbody>
							{items.length > 0 && (
								<tfoot>
									<tr>
										<th colSpan={weekly ? 3 : 2}>Total</th>
										<th className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(lineTotal)}
										</th>
										{editable && <th />}
									</tr>
								</tfoot>
							)}
						</Table>
					</div>

					{payRun.notes && (
						<div className="mt-1">
							<small className="text-muted">Notes</small>
							<div>{payRun.notes}</div>
						</div>
					)}
					{payRun.approvedAt && (
						<div className="mt-1 text-muted" style={{ fontSize: '0.8rem' }}>
							Approved {new Date(payRun.approvedAt).toLocaleString('en-NG')} — posted to the expense ledger as one
							entry per department.
						</div>
					)}
				</CardBody>
			</Card>

			<ApproveModal
				open={approveOpen}
				toggle={() => setApproveOpen(false)}
				payRun={payRun}
				onApproved={() => dispatch(getPayRun(id))}
			/>
		</div>
	)
}

export default PayRunView
