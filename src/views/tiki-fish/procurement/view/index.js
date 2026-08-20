import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, Table, Badge, Spinner, Alert } from 'reactstrap'
import { ArrowLeft, Plus } from 'react-feather'
import { getFishPurchase, getProcurementReference, receiveFishPurchase, removePurchaseLine } from '../store/action'
import { can } from '@src/utility/capabilities'
import LineForm from './LineForm'
import PayModal from './PayModal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const exact = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

const STATUS = {
	draft: { label: 'Draft', color: 'light-secondary' },
	received: { label: 'Received', color: 'light-success' },
	cancelled: { label: 'Cancelled', color: 'light-danger' },
}

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FishPurchaseView = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const { purchase, lines, payments, loading } = useSelector((s) => s.procurement)

	const [lineOpen, setLineOpen] = useState(false)
	const [editingLine, setEditingLine] = useState(null)
	const [payOpen, setPayOpen] = useState(false)
	const [receiving, setReceiving] = useState(false)

	useEffect(() => {
		dispatch(getProcurementReference())
		dispatch(getFishPurchase(id))
		return () => dispatch({ type: 'CLEAR_FISH_PURCHASE' })
	}, [id])

	const isDraft = purchase?.status === 'draft'
	const editable = isDraft && can('fishPurchases.update')

	const receive = async () => {
		const landed = Number(purchase.transportCost) + Number(purchase.handlingCost) + Number(purchase.otherLandedCost)
		const result = await MySwal.fire({
			title: `Receive ${purchase.reference}?`,
			html: `
				<p style="text-align:left">This puts the surviving quantity into the fish stock ledger at its landed cost.</p>
				<p style="text-align:left"><b>No money moves.</b> Record the payment separately, whenever it is actually paid.</p>
				${landed > 0 ? `<p style="text-align:left">The ${naira(landed)} of transport and handling will be spread across the grades in proportion to what each cost.</p>` : ''}
				<p style="text-align:left"><small>The lines cannot be edited afterwards — they will be in the stock ledger.</small></p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Receive into stock',
			customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		setReceiving(true)
		const ok = await dispatch(receiveFishPurchase(id))
		setReceiving(false)
		if (ok) dispatch(getFishPurchase(id))
	}

	const removeLine = async (line) => {
		const result = await MySwal.fire({
			title: `Remove ${line.fishSpeciesGrade?.name || 'this grade'}?`,
			text: 'It has not been received into stock yet, so nothing is affected.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(removePurchaseLine(id, line.id))
		if (ok) dispatch(getFishPurchase(id, { quiet: true }))
	}

	if (loading && !purchase) {
		return (
			<div className="text-center py-4">
				<Spinner />
			</div>
		)
	}
	if (!purchase) {
		return (
			<Alert color="danger" className="p-2">
				That delivery could not be loaded. <Link to="/procurement/list">Back to fish purchases</Link>
			</Alert>
		)
	}

	const landedExtras =
		Number(purchase.transportCost) + Number(purchase.handlingCost) + Number(purchase.otherLandedCost)
	const goods = lines.reduce((a, l) => a + Number(l.lineAmount), 0)
	const totalNet = lines.reduce((a, l) => a + Number(l.netQuantity), 0)
	const totalGross = lines.reduce((a, l) => a + Number(l.grossQuantity), 0)
	const lostPercent = totalGross ? Math.round(((totalGross - totalNet) / totalGross) * 1000) / 10 : 0

	return (
		<div className="fish-purchase-view">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-start flex-wrap">
					<div>
						<Link to="/procurement/list" className="text-muted d-inline-flex align-items-center mb-50">
							<ArrowLeft size={14} className="mr-25" /> Fish purchases
						</Link>
						<CardTitle tag="h4" className="mb-25">
							{purchase.reference}{' '}
							<Badge color={STATUS[purchase.status]?.color || 'light-secondary'} className="align-middle">
								{STATUS[purchase.status]?.label || purchase.status}
							</Badge>
						</CardTitle>
						<small className="text-muted">
							{purchase.supplier?.name} · landed {readable(purchase.purchaseDate)} · {lines.length} grade
							{lines.length === 1 ? '' : 's'}
						</small>
					</div>
					<div className="text-right">
						<div style={{ fontSize: '1.4rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
							{naira(purchase.totalLandedCost)}
						</div>
						{purchase.status === 'received' && purchase.outstanding > 0.005 && (
							<div className="text-danger" style={{ fontSize: '0.8rem' }}>
								{naira(purchase.outstanding)} outstanding
							</div>
						)}
						{isDraft && can('fishPurchases.update') && (
							<Button color="success" className="mt-50" onClick={receive} disabled={receiving || lines.length === 0}>
								{receiving ? <Spinner size="sm" /> : 'Receive into stock'}
							</Button>
						)}
						{purchase.status === 'received' && can('fishPurchases.pay') && purchase.outstanding > 0.005 && (
							<Button color="primary" className="mt-50" onClick={() => setPayOpen(true)}>
								Record payment
							</Button>
						)}
					</div>
				</CardHeader>

				<CardBody>
					{isDraft && (
						<Alert color="warning" className="p-1">
							Nothing is in the stock ledger yet and no money has moved. Add every grade on the waybill, then
							receive it.
						</Alert>
					)}

					<Row className="mb-1">
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Goods invoiced
							</div>
							<div style={{ fontWeight: 600 }}>{naira(goods)}</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Transport, handling, other
							</div>
							<div style={{ fontWeight: 600 }}>{naira(landedExtras)}</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Into stock
							</div>
							<div style={{ fontWeight: 600 }}>{Math.round(totalNet * 1000) / 1000}</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Lost on the way
							</div>
							<div style={{ fontWeight: 600 }} className={lostPercent > 0 ? 'text-warning' : ''}>
								{lostPercent}%
							</div>
						</Col>
					</Row>

					<div className="d-flex justify-content-between align-items-center mb-50">
						<h5 className="mb-0">Grades</h5>
						{editable && (
							<Button
								size="sm"
								color="primary"
								outline
								onClick={() => {
									setEditingLine(null)
									setLineOpen(true)
								}}
							>
								<Plus size={14} /> Add grade
							</Button>
						)}
					</div>

					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Grade</th>
									<th className="text-right">Delivered</th>
									<th className="text-right">Lost</th>
									<th className="text-right">Into stock</th>
									<th className="text-right">Price</th>
									<th className="text-right">Invoiced</th>
									{purchase.status === 'received' && <th className="text-right">Cost per unit</th>}
									{editable && <th />}
								</tr>
							</thead>
							<tbody>
								{lines.length === 0 && (
									<tr>
										<td colSpan="8" className="text-center text-muted py-3">
											No grades yet. Add what is on the waybill.
										</td>
									</tr>
								)}
								{lines.map((l) => {
									const lost = Number(l.mortalityQty) + Number(l.shrinkageQty)
									return (
										<tr key={l.id}>
											<td>
												<span className="font-weight-bold">{l.fishSpeciesGrade?.name || `Grade ${l.speciesGradeId}`}</span>
												<div className="text-muted" style={{ fontSize: '0.7rem' }}>
													by {l.unit === 'kg' ? 'weight' : 'piece'}
												</div>
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{Number(l.grossQuantity)} {l.unit}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{lost > 0 ? (
													<span className="text-warning">
														{Math.round(lost * 1000) / 1000}
														<div style={{ fontSize: '0.7rem' }}>
															{Number(l.mortalityQty) > 0 ? `${Number(l.mortalityQty)} dead` : ''}
															{Number(l.mortalityQty) > 0 && Number(l.shrinkageQty) > 0 ? ' · ' : ''}
															{Number(l.shrinkageQty) > 0 ? `${Number(l.shrinkageQty)} shrink` : ''}
														</div>
													</span>
												) : (
													'—'
												)}
											</td>
											<td className="text-right text-nowrap font-weight-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{Number(l.netQuantity)} {l.unit}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(l.unitPrice)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(l.lineAmount)}
											</td>
											{purchase.status === 'received' && (
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
													<span className="font-weight-bold">{exact(l.landedUnitCost)}</span>
													<div className="text-muted" style={{ fontSize: '0.7rem' }}>
														incl. {naira(l.allocatedLandedCost)} carriage
													</div>
												</td>
											)}
											{editable && (
												<td className="text-nowrap">
													<Button
														size="sm"
														color="flat-primary"
														onClick={() => {
															setEditingLine(l)
															setLineOpen(true)
														}}
													>
														Edit
													</Button>
													<Button size="sm" color="flat-danger" onClick={() => removeLine(l)}>
														Remove
													</Button>
												</td>
											)}
										</tr>
									)
								})}
							</tbody>
						</Table>
					</div>

					{purchase.status === 'received' && (
						<>
							<h5 className="mt-2 mb-50">Payments</h5>
							{payments.length === 0 ? (
								<div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>
									Nothing paid yet. The fish is in stock; the money has not left.
								</div>
							) : (
								<div style={{ overflowX: 'auto' }}>
									<Table responsive size="sm">
										<thead>
											<tr>
												<th>Date</th>
												<th>Reference</th>
												<th>From</th>
												<th className="text-right">Amount</th>
											</tr>
										</thead>
										<tbody>
											{payments.map((p) => (
												<tr key={p.id}>
													<td className="text-nowrap">{readable(p.expenseDate)}</td>
													<td>{p.reference}</td>
													<td>{p.paymentAccount?.name || '—'}</td>
													<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
														{naira(p.amount)}
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</div>
							)}
							{/* The one sentence that stops somebody hunting for this in the P&L. */}
							<small className="text-muted">
								Payments for fish come off the bank account but are not expenses in the profit and loss — the cost
								is counted when the fish is sold.
							</small>
						</>
					)}

					{purchase.notes && (
						<div className="mt-2">
							<small className="text-muted">Notes</small>
							<div>{purchase.notes}</div>
						</div>
					)}
				</CardBody>
			</Card>

			<LineForm open={lineOpen} toggle={() => setLineOpen(false)} purchaseId={id} line={editingLine} />
			<PayModal open={payOpen} toggle={() => setPayOpen(false)} purchase={purchase} payments={payments} />
		</div>
	)
}

export default FishPurchaseView
