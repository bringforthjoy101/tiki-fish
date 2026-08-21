import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, Table, Badge, Spinner, Alert } from 'reactstrap'
import { ArrowLeft, Plus, AlertTriangle } from 'react-feather'
import {
	getBatch, getAllocationPreview, getProductionReference,
	removeBatchInput, removeBatchOutput, postBatch, voidBatch
} from '../store/action'
import { can } from '@src/utility/capabilities'
import { InputForm, OutputForm } from './LineForms'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const exact = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

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

// Until the expense form gained its batch field, nothing could tag a cost to a batch at all —
// so this warning fired on every batch ever posted, which is how a warning becomes wallpaper.
// It now names the screen that fixes it, because "tag the expenses first" is only actionable
// advice if the reader knows where.
const NO_CONVERSION_WARNING =
	'<p style="text-align:left;color:#b45309"><b>No smokehouse or packaging expense is tagged to this batch.</b> ' +
	'Its cost will be the fish alone, which understates what it took to make and makes your standard costs look ' +
	'generous.</p>' +
	'<p style="text-align:left"><small>To tag one: go to <b>Expenses</b>, record the firewood or labour, and set ' +
	'<b>Part of a smoking batch?</b> to this batch. It has to be done before posting — once a batch is posted its ' +
	'cost is frozen.</small></p>'

const BatchView = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const { batch, inputs, outputs, expenses, conversionCost, preview, loading } = useSelector((s) => s.production)

	const [inputOpen, setInputOpen] = useState(false)
	const [outputOpen, setOutputOpen] = useState(false)
	const [editingInput, setEditingInput] = useState(null)
	const [editingOutput, setEditingOutput] = useState(null)
	const [posting, setPosting] = useState(false)

	useEffect(() => {
		dispatch(getProductionReference())
		dispatch(getBatch(id)).then((data) => {
			// The preview only means anything on a draft; a posted batch shows what it actually did.
			if (data?.batch?.status === 'draft') dispatch(getAllocationPreview(id))
		})
		return () => dispatch({ type: 'CLEAR_BATCH' })
	}, [id])

	const isDraft = batch?.status === 'draft'
	const editable = isDraft && can('batches.create')

	const post = async () => {
		const noConversion = !conversionCost
		const result = await MySwal.fire({
			title: `Post ${batch.reference}?`,
			html: `
				<p style="text-align:left">This consumes the fish from stock and puts the products in, at the costs shown.</p>
				${noConversion ? NO_CONVERSION_WARNING : ''}
				<p style="text-align:left"><small>The costs are frozen at posting. A later expense edit or price change will not restate this batch.</small></p>`,
			icon: noConversion ? 'warning' : 'question',
			showCancelButton: true,
			confirmButtonText: noConversion ? 'Post anyway — there were none' : 'Post batch',
			customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		setPosting(true)
		const ok = await dispatch(postBatch(id, noConversion))
		setPosting(false)
		if (ok) dispatch(getBatch(id))
	}

	const doVoid = async () => {
		const result = await MySwal.fire({
			title: `Void ${batch.reference}?`,
			html: 'The fish goes back into stock and the products come out of it. Both are recorded as reversing entries — nothing is deleted.',
			input: 'text',
			inputPlaceholder: 'Why is it being voided?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Void batch',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed || !result.value) return
		const ok = await dispatch(voidBatch(id, result.value))
		if (ok) dispatch(getBatch(id))
	}

	const removeInput = async (input) => {
		const ok = await dispatch(removeBatchInput(id, input.id))
		if (ok) {
			dispatch(getBatch(id, { quiet: true }))
			dispatch(getAllocationPreview(id))
		}
	}

	const removeOutput = async (output) => {
		const ok = await dispatch(removeBatchOutput(id, output.id))
		if (ok) {
			dispatch(getBatch(id, { quiet: true }))
			dispatch(getAllocationPreview(id))
		}
	}

	if (loading && !batch) {
		return (
			<div className="text-center py-4">
				<Spinner />
			</div>
		)
	}
	if (!batch) {
		return (
			<Alert color="danger" className="p-2">
				That batch could not be loaded. <Link to="/production/list">Back to production</Link>
			</Alert>
		)
	}

	// A draft shows what posting WOULD do; a posted batch shows what it DID.
	const lines = isDraft ? preview?.outputs || [] : outputs
	const pricedInputs = isDraft ? preview?.inputs || [] : inputs
	const inputCost = isDraft ? preview?.inputCost || 0 : Number(batch.inputCost)
	const pool = isDraft ? preview?.totalCostToAllocate || 0 : Number(batch.totalCostToAllocate)
	const problems = preview?.problems || []

	const totalIn = pricedInputs.reduce((a, i) => a + Number(i.quantity), 0)
	const totalOut = outputs.reduce((a, o) => a + Number(o.quantity), 0)
	const yieldPercent = totalIn ? Math.round((totalOut / totalIn) * 1000) / 10 : 0

	return (
		<div className="batch-view">
			<Card>
				<CardHeader className="d-flex justify-content-between align-items-start flex-wrap">
					<div>
						<Link to="/production/list" className="text-muted d-inline-flex align-items-center mb-50">
							<ArrowLeft size={14} className="mr-25" /> Production
						</Link>
						<CardTitle tag="h4" className="mb-25">
							{batch.reference}{' '}
							<Badge color={STATUS[batch.status]?.color || 'light-secondary'} className="align-middle">
								{STATUS[batch.status]?.label || batch.status}
							</Badge>
						</CardTitle>
						<small className="text-muted">
							{batch.department?.name} · processed {readable(batch.batchDate)} · {inputs.length} input
							{inputs.length === 1 ? '' : 's'}, {outputs.length} output{outputs.length === 1 ? '' : 's'}
						</small>
					</div>
					<div className="text-right">
						<div style={{ fontSize: '1.4rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{naira(pool)}</div>
						<div className="text-muted" style={{ fontSize: '0.75rem' }}>
							{isDraft ? 'would be allocated' : 'allocated'}
						</div>
						{isDraft && can('batches.post') && (
							<Button
								color="success"
								className="mt-50"
								onClick={post}
								disabled={posting || !inputs.length || !outputs.length || problems.length > 0}
							>
								{posting ? <Spinner size="sm" /> : 'Post batch'}
							</Button>
						)}
						{batch.status === 'posted' && can('batches.void') && (
							<Button color="flat-danger" className="mt-50" onClick={doVoid}>
								Void
							</Button>
						)}
					</div>
				</CardHeader>

				<CardBody>
					{batch.status === 'voided' && (
						<Alert color="danger" className="p-1">
							Voided {readable(batch.voidedAt)} — {batch.voidReason}. The fish went back into stock and the products
							came out of it.
						</Alert>
					)}
					{batch.status === 'posted' && !batch.conversionCostCaptured && (
						<Alert color="warning" className="p-1">
							<AlertTriangle size={15} className="mr-50" />
							This batch was posted with no smokehouse or packaging expense tagged to it, so its cost is the fish
							alone. Any variance it reports will look better than the truth. Its cost was frozen at posting —
							tagging an expense now would change nothing. Void and re-post it if the firewood and labour matter.
						</Alert>
					)}
					{isDraft && problems.length > 0 && (
						<Alert color="danger" className="p-1">
							<b>This batch cannot be posted yet:</b>
							<ul className="mb-0 mt-50">
								{problems.map((p) => (
									<li key={p}>{p}</li>
								))}
							</ul>
						</Alert>
					)}

					<Row className="mb-1">
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Fish consumed
							</div>
							<div style={{ fontWeight: 600 }}>{naira(inputCost)}</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Smokehouse &amp; packaging
							</div>
							<div style={{ fontWeight: 600 }} className={conversionCost ? '' : 'text-warning'}>
								{naira(isDraft ? conversionCost : batch.conversionCost)}
							</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Yield
							</div>
							<div style={{ fontWeight: 600 }}>{yieldPercent}%</div>
						</Col>
						<Col md="3">
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Cost to allocate
							</div>
							<div style={{ fontWeight: 600 }}>{naira(pool)}</div>
						</Col>
					</Row>

					<div className="d-flex justify-content-between align-items-center mb-50">
						<h5 className="mb-0">What went in</h5>
						{editable && (
							<Button
								size="sm"
								color="primary"
								outline
								onClick={() => {
									setEditingInput(null)
									setInputOpen(true)
								}}
							>
								<Plus size={14} /> Add input
							</Button>
						)}
					</div>
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Grade</th>
									<th className="text-right">Quantity</th>
									{can('inventory.readValuation') && <th className="text-right">Cost per unit</th>}
									{can('inventory.readValuation') && <th className="text-right">Cost</th>}
									{isDraft && <th className="text-right">In stock</th>}
									{editable && <th />}
								</tr>
							</thead>
							<tbody>
								{pricedInputs.length === 0 && (
									<tr>
										<td colSpan="6" className="text-center text-muted py-2">
											Nothing yet. Add the fish that went into this batch.
										</td>
									</tr>
								)}
								{pricedInputs.map((i) => (
									<tr key={i.id}>
										<td className="font-weight-bold">{i.fishSpeciesGrade?.name || `Grade ${i.speciesGradeId}`}</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{Number(i.quantity)} {i.unit}
										</td>
										{/* Cost is hidden from the storekeeper: input cost is computed server-side, so
										    entering a batch never requires seeing a purchase price. */}
										{can('inventory.readValuation') && (
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{i.unitCost ? exact(i.unitCost) : '—'}
											</td>
										)}
										{can('inventory.readValuation') && (
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{i.cost ? naira(i.cost) : '—'}
											</td>
										)}
										{isDraft && (
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												<span className={Number(i.available) < Number(i.quantity) ? 'text-danger font-weight-bold' : ''}>
													{i.available === undefined ? '—' : Number(i.available)}
												</span>
											</td>
										)}
										{editable && (
											<td className="text-nowrap">
												<Button size="sm" color="flat-danger" onClick={() => removeInput(i)}>
													Remove
												</Button>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</Table>
					</div>

					<div className="d-flex justify-content-between align-items-center mb-50 mt-2">
						<h5 className="mb-0">What came out{isDraft ? ', and what it would cost' : ''}</h5>
						{editable && (
							<Button
								size="sm"
								color="primary"
								outline
								onClick={() => {
									setEditingOutput(null)
									setOutputOpen(true)
								}}
							>
								<Plus size={14} /> Add output
							</Button>
						)}
					</div>

					{/* The point of the whole screen: the split is visible BEFORE it is committed. */}
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Product</th>
									<th className="text-right">Yield</th>
									<th className="text-right">Worth</th>
									<th className="text-right">Share</th>
									<th className="text-right">Cost carried</th>
									<th className="text-right">Actual / unit</th>
									<th className="text-right">Standard / unit</th>
									<th className="text-right">Variance</th>
									{editable && <th />}
								</tr>
							</thead>
							<tbody>
								{lines.length === 0 && (
									<tr>
										<td colSpan="9" className="text-center text-muted py-2">
											Nothing yet. Add what this batch produced.
										</td>
									</tr>
								)}
								{lines.map((o) => {
									let variance = o.variance
									if (variance === undefined || variance === null) {
										variance = null
										if (o.standardUnitCost) {
											variance = Math.round((Number(o.actualUnitCost) - Number(o.standardUnitCost)) * 100) / 100
										}
									}
									let varianceClass = ''
									if (variance !== null && variance > 0) varianceClass = 'text-danger'
									if (variance !== null && variance < 0) varianceClass = 'text-success'
									return (
										<tr key={o.id}>
											<td className="font-weight-bold">{o.product?.name || `Product ${o.productId}`}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{Number(o.quantity)} {o.unit}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(o.salesValue)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{o.sharePercent !== undefined ? `${o.sharePercent}%` : '—'}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(o.allocatedCost)}
											</td>
											<td className="text-right text-nowrap font-weight-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{exact(o.actualUnitCost)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{o.standardUnitCost ? exact(o.standardUnitCost) : '—'}
											</td>
											<td className={`text-right text-nowrap ${varianceClass}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
												{variance === null ? '—' : `${variance > 0 ? '+' : ''}${exact(variance)}`}
											</td>
											{editable && (
												<td className="text-nowrap">
													<Button
														size="sm"
														color="flat-primary"
														onClick={() => {
															setEditingOutput(o)
															setOutputOpen(true)
														}}
													>
														Edit
													</Button>
													<Button size="sm" color="flat-danger" onClick={() => removeOutput(o)}>
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
					{lines.length > 0 && (
						<small className="text-muted">
							Cost is split by what each product is worth, not by weight. A variance above zero means this batch
							cost more per unit than the standard says it should.
						</small>
					)}

					{expenses.length > 0 && (
						<>
							<h5 className="mt-2 mb-50">Expenses tagged to this batch</h5>
							<div style={{ overflowX: 'auto' }}>
								<Table responsive size="sm">
									<tbody>
										{expenses.map((e) => (
											<tr key={e.id}>
												<td className="text-nowrap">{readable(e.expenseDate)}</td>
												<td>{e.description}</td>
												<td>{e.expenseCategory?.name || '—'}</td>
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
													{naira(e.amount)}
												</td>
											</tr>
										))}
									</tbody>
								</Table>
							</div>
						</>
					)}

					{batch.notes && (
						<div className="mt-2">
							<small className="text-muted">Notes</small>
							<div>{batch.notes}</div>
						</div>
					)}
				</CardBody>
			</Card>

			<InputForm open={inputOpen} toggle={() => setInputOpen(false)} batchId={id} input={editingInput} />
			<OutputForm open={outputOpen} toggle={() => setOutputOpen(false)} batchId={id} output={editingOutput} />
		</div>
	)
}

export default BatchView
