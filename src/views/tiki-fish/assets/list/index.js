import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup, Alert } from 'reactstrap'
import { Plus, AlertCircle } from 'react-feather'
import { getAssets, getAssetReference, getUnregisteredCapex, disposeAsset, deleteAsset } from '../store/action'
import { can } from '@src/utility/capabilities'
import AssetForm from './AssetForm'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const STATUS = { in_use: { label: 'In use', color: 'light-success' }, disposed: { label: 'Disposed', color: 'light-secondary' }, written_off: { label: 'Written off', color: 'light-danger' } }

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const AssetsList = () => {
	const dispatch = useDispatch()
	const { assets, totals, unregisteredCapex, reference, loading } = useSelector((s) => s.assets)

	const [filters, setFilters] = useState({ status: 'in_use' })
	const [formOpen, setFormOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [fromExpense, setFromExpense] = useState(null)

	const canManage = can('assets.manage')

	useEffect(() => {
		dispatch(getAssetReference())
		if (canManage) dispatch(getUnregisteredCapex())
	}, [])

	useEffect(() => {
		dispatch(getAssets(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const openBlank = () => {
		setEditing(null)
		setFromExpense(null)
		setFormOpen(true)
	}

	const registerCapex = (expense) => {
		setEditing(null)
		setFromExpense(expense)
		setFormOpen(true)
	}

	const dispose = async (asset) => {
		const result = await MySwal.fire({
			title: `Dispose of ${asset.name}?`,
			html: 'Sold, scrapped or written off. Any money received is recorded here for the record — enter the receipt itself as an expense entry so it reaches the bank balance.',
			input: 'date',
			inputValue: new Date().toISOString().slice(0, 10),
			inputLabel: 'Date disposed',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Record disposal',
			customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed || !result.value) return

		const proceeds = await MySwal.fire({
			title: 'Anything received for it?',
			input: 'number',
			inputPlaceholder: '0',
			text: 'Leave blank if it was scrapped.',
			showCancelButton: true,
			confirmButtonText: 'Save',
			customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!proceeds.isConfirmed) return

		const amount = Number(proceeds.value) || 0
		const ok = await dispatch(
			disposeAsset(asset.id, {
				disposedOn: result.value,
				disposalProceeds: amount || null,
				status: amount > 0 ? 'disposed' : 'written_off',
			})
		)
		if (ok) dispatch(getAssets(filters))
	}

	const remove = async (asset) => {
		const result = await MySwal.fire({
			title: `Remove ${asset.name} from the register?`,
			html: 'Only for a row keyed by mistake. If the business no longer has it, record a <b>disposal</b> instead — that keeps the history.',
			input: 'text',
			inputPlaceholder: 'Why is it being removed?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(deleteAsset(asset.id, result.value || null))
		if (ok) dispatch(getAssets(filters))
	}

	const unregistered = unregisteredCapex?.expenses || []
	const summary = `${totals.inUseCount} in use · ${naira(totals.costOfAssetsInUse)} spent on what the business still owns`

	return (
		<div className="assets-list">
			{/* The gap between what was paid for and what is recorded. This was migration 010's
			    POST-CHECK query - written as a comment, so never run by anyone. */}
			{canManage && unregistered.length > 0 && (
				<Alert color="warning" className="p-1 mb-2">
					<div className="d-flex align-items-center mb-50">
						<AlertCircle size={16} className="mr-50" />
						<b>
							{unregistered.length} capital payment{unregistered.length === 1 ? '' : 's'} not yet on the register —{' '}
							{naira(unregisteredCapex.total)}
						</b>
					</div>
					<div style={{ overflowX: 'auto' }}>
						<Table size="sm" borderless className="mb-0">
							<tbody>
								{unregistered.slice(0, 8).map((e) => (
									<tr key={e.id}>
										<td className="text-nowrap">{readable(e.expenseDate)}</td>
										<td>{e.description}</td>
										<td>{e.department?.name || '—'}</td>
										<td className="text-right text-nowrap">{naira(e.amount)}</td>
										<td className="text-right">
											<Button size="sm" color="flat-primary" onClick={() => registerCapex(e)}>
												Register it
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>
					{unregistered.length > 8 && <small>…and {unregistered.length - 8} more.</small>}
				</Alert>
			)}

			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">
							Asset register
						</CardTitle>
						<small className="text-muted">{loading ? 'Loading…' : summary}</small>
					</div>
					{canManage && (
						<Button color="primary" onClick={openBlank}>
							<Plus size={15} /> Add asset
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
								<Label>Status</Label>
								<Input type="select" value={filters.status || ''} onChange={set('status')}>
									<option value="">All</option>
									<option value="in_use">In use</option>
									<option value="disposed">Disposed</option>
									<option value="written_off">Written off</option>
								</Input>
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Search</Label>
								<Input placeholder="name, serial, location…" value={filters.search || ''} onChange={set('search')} />
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
										<th>Asset</th>
										<th>Department</th>
										<th>Acquired</th>
										<th className="text-right">Cost</th>
										<th>Status</th>
										{canManage && <th />}
									</tr>
								</thead>
								<tbody>
									{assets.length === 0 && (
										<tr>
											<td colSpan={canManage ? 6 : 5} className="text-center text-muted py-2">
												Nothing on the register matches this filter.
											</td>
										</tr>
									)}
									{assets.map((a) => (
										<tr key={a.id}>
											<td>
												<span className="font-weight-bold">{a.name}</span>
												{(a.location || a.serialNumber) && (
													<div className="text-muted" style={{ fontSize: '0.75rem' }}>
														{[a.location, a.serialNumber].filter(Boolean).join(' · ')}
													</div>
												)}
												{a.expense && (
													<div className="text-muted" style={{ fontSize: '0.7rem' }}>
														Paid by {a.expense.reference}
													</div>
												)}
											</td>
											<td>{a.department?.name || '—'}</td>
											<td className="text-nowrap">{readable(a.acquiredOn)}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(a.cost)}
											</td>
											<td>
												<Badge color={STATUS[a.status]?.color || 'light-secondary'}>
													{STATUS[a.status]?.label || a.status}
												</Badge>
												{a.disposedOn && (
													<div className="text-muted" style={{ fontSize: '0.7rem' }}>
														{readable(a.disposedOn)}
														{a.disposalProceeds ? ` · ${naira(a.disposalProceeds)}` : ''}
													</div>
												)}
											</td>
											{canManage && (
												<td className="text-nowrap">
													<Button
														size="sm"
														color="flat-primary"
														onClick={() => {
															setEditing(a)
															setFromExpense(null)
															setFormOpen(true)
														}}
													>
														Edit
													</Button>
													{a.status === 'in_use' && (
														<Button size="sm" color="flat-warning" onClick={() => dispose(a)}>
															Dispose
														</Button>
													)}
													<Button size="sm" color="flat-danger" onClick={() => remove(a)}>
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

			<AssetForm open={formOpen} toggle={() => setFormOpen(false)} asset={editing} fromExpense={fromExpense} filters={filters} />
		</div>
	)
}

export default AssetsList
