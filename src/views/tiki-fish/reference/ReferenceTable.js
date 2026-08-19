import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
	Card, CardBody, CardHeader, CardTitle, Row, Col, Label, Input, Button, Table, Badge,
	Spinner, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter, CustomInput
} from 'reactstrap'
import { Plus } from 'react-feather'
import { getReferenceList, createReferenceRow, updateReferenceRow, deleteReferenceRow } from './store/action'
import { can } from '@src/utility/capabilities'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

/**
 * One table for every reference master.
 *
 * departments, expense categories, payment accounts, fish grades and packaging items are the
 * same screen with different columns, so this takes a field descriptor list rather than being
 * copied five times. Five copies is five places to fix the next time a rule changes, and they
 * will not all get fixed.
 *
 * `config` shape:
 *   { key, title, blurb, endpoint, manageCapability, fields: [...], columns: [...] }
 * A field is { name, label, type, options?, required?, help?, showIf? }.
 */
const ReferenceTable = ({ config }) => {
	const dispatch = useDispatch()
	const { lists, loading } = useSelector((s) => s.reference)
	const rows = lists[config.key] || []

	const [includeInactive, setIncludeInactive] = useState(false)
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [form, setForm] = useState({})
	const [saving, setSaving] = useState(false)

	const canManage = can(config.manageCapability)

	useEffect(() => {
		dispatch(getReferenceList(config.key, config.endpoint, includeInactive))
	}, [config.key, includeInactive])

	const blank = () => {
		const out = {}
		config.fields.forEach((f) => {
			out[f.name] = f.defaultValue !== undefined ? f.defaultValue : ''
		})
		return out
	}

	const openCreate = () => {
		setEditing(null)
		setForm(blank())
		setOpen(true)
	}

	const openEdit = (row) => {
		const next = blank()
		config.fields.forEach((f) => {
			next[f.name] = row[f.name] ?? next[f.name]
		})
		setEditing(row)
		setForm(next)
		setOpen(true)
	}

	const set = (name) => (e) => {
		const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
		setForm((f) => ({ ...f, [name]: value }))
	}

	const submit = async () => {
		setSaving(true)
		const payload = { ...form }
		Object.keys(payload).forEach((k) => {
			if (payload[k] === '') payload[k] = null
		})
		let save = createReferenceRow(config.endpoint, payload)
		if (editing) save = updateReferenceRow(config.endpoint, editing.id, payload)
		const ok = await dispatch(save)
		setSaving(false)
		if (ok) {
			setOpen(false)
			dispatch(getReferenceList(config.key, config.endpoint, includeInactive))
		}
	}

	const toggleActive = async (row) => {
		const ok = await dispatch(updateReferenceRow(config.endpoint, row.id, { isActive: !row.isActive }))
		if (ok) dispatch(getReferenceList(config.key, config.endpoint, includeInactive))
	}

	const remove = async (row) => {
		const result = await MySwal.fire({
			title: `Remove ${row.name}?`,
			html: 'Anything already recorded against it keeps working. If it is simply no longer used, <b>deactivate</b> it instead — that hides it from new entries without touching history.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Remove',
			customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false,
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(deleteReferenceRow(config.endpoint, row.id))
		if (ok) dispatch(getReferenceList(config.key, config.endpoint, includeInactive))
	}

	const visibleFields = config.fields.filter((f) => !f.showIf || f.showIf(form))
	const incomplete = visibleFields.some((f) => f.required && !form[f.name])

	return (
		<Card>
			<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
				<div>
					<CardTitle tag="h4" className="mb-25">
						{config.title}
					</CardTitle>
					<small className="text-muted">{config.blurb}</small>
				</div>
				<div className="d-flex align-items-center">
					<CustomInput
						type="switch"
						id={`inactive-${config.key}`}
						label="Show deactivated"
						checked={includeInactive}
						onChange={(e) => setIncludeInactive(e.target.checked)}
						className="mr-1"
					/>
					{canManage && (
						<Button color="primary" onClick={openCreate}>
							<Plus size={15} /> Add
						</Button>
					)}
				</div>
			</CardHeader>

			<CardBody>
				{loading[config.key] ? (
					<div className="text-center py-3">
						<Spinner />
					</div>
				) : (
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									{config.columns.map((c) => (
										<th key={c.label} className={c.align === 'right' ? 'text-right' : ''}>
											{c.label}
										</th>
									))}
									<th>Status</th>
									{canManage && <th />}
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 && (
									<tr>
										<td colSpan={config.columns.length + 2} className="text-center text-muted py-3">
											{config.emptyMessage || 'Nothing here yet.'}
										</td>
									</tr>
								)}
								{rows.map((row) => (
									<tr key={row.id} className={row.isActive === false ? 'text-muted' : ''}>
										{config.columns.map((c) => (
											<td key={c.label} className={c.align === 'right' ? 'text-right text-nowrap' : ''}>
												{c.render ? c.render(row) : row[c.field] ?? '—'}
											</td>
										))}
										<td>
											<Badge color={row.isActive === false ? 'light-secondary' : 'light-success'}>
												{row.isActive === false ? 'Inactive' : 'Active'}
											</Badge>
										</td>
										{canManage && (
											<td className="text-nowrap">
												<Button size="sm" color="flat-primary" onClick={() => openEdit(row)}>
													Edit
												</Button>
												<Button size="sm" color="flat-secondary" onClick={() => toggleActive(row)}>
													{row.isActive === false ? 'Reactivate' : 'Deactivate'}
												</Button>
												<Button size="sm" color="flat-danger" onClick={() => remove(row)}>
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

			<Modal isOpen={open} toggle={() => setOpen(false)} className="modal-dialog-centered">
				<ModalHeader toggle={() => setOpen(false)}>
					{editing ? editing.name : `Add to ${config.title.toLowerCase()}`}
				</ModalHeader>
				<ModalBody>
					<Row>
						{visibleFields.map((f) => (
							<Col md={f.width || 12} key={f.name}>
								<FormGroup>
									<Label for={f.name}>
										{f.label}
										{f.required ? ' *' : ''}
									</Label>
									{f.type === 'select' ? (
										<Input id={f.name} type="select" value={form[f.name] ?? ''} onChange={set(f.name)}>
											<option value="">{f.placeholder || 'Choose…'}</option>
											{(typeof f.options === 'function' ? f.options() : f.options).map((o) => (
												<option key={o.value} value={o.value}>
													{o.label}
												</option>
											))}
										</Input>
									) : (
										<Input
											id={f.name}
											type={f.type || 'text'}
											step={f.step}
											placeholder={f.placeholder}
											value={form[f.name] ?? ''}
											onChange={set(f.name)}
										/>
									)}
									{f.help && <small className="text-muted">{f.help}</small>}
								</FormGroup>
							</Col>
						))}
					</Row>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" outline onClick={() => setOpen(false)} disabled={saving}>
						Cancel
					</Button>
					<Button color="primary" onClick={submit} disabled={saving || incomplete}>
						{saving ? <Spinner size="sm" /> : editing ? 'Save changes' : 'Add'}
					</Button>
				</ModalFooter>
			</Modal>
		</Card>
	)
}

export default ReferenceTable
