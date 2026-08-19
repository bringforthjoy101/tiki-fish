import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, Button, FormGroup, Spinner, Table, Alert } from 'reactstrap'
import { approvePayRun } from '../../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const ApproveModal = ({ open, toggle, payRun, onApproved }) => {
	const dispatch = useDispatch()
	const { reference } = useSelector((s) => s.payroll)
	const [paymentAccountId, setPaymentAccountId] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (open) setPaymentAccountId('')
	}, [open])

	const items = (payRun?.payRunItems || []).filter((i) => Number(i.grossAmount) !== 0)

	// Exactly what will be written: one expense per department. Showing it here means the
	// person approving sees the ledger entries before they exist, not after.
	const byDepartment = []
	for (const item of items) {
		const name = item.department?.name || `Department ${item.departmentId}`
		const row = byDepartment.find((r) => r.name === name)
		if (row) {
			row.total += Number(item.grossAmount) || 0
			row.headcount += 1
		} else {
			byDepartment.push({ name, total: Number(item.grossAmount) || 0, headcount: 1 })
		}
	}
	const total = byDepartment.reduce((a, r) => a + r.total, 0)

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(approvePayRun(payRun.id, paymentAccountId || null))
		setSaving(false)
		if (ok) {
			toggle()
			onApproved()
		}
	}

	const activeAccounts = (reference.paymentAccounts || []).filter((a) => a.isActive !== false)

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered modal-lg">
			<ModalHeader toggle={toggle}>Approve {payRun?.reference}</ModalHeader>
			<ModalBody>
				<p className="mb-1">
					{items.length} worker{items.length === 1 ? '' : 's'}, {naira(total)} in total. Approving posts it to the expense
					ledger and locks the run — the amounts can no longer be edited.
				</p>

				<Table size="sm" className="mb-1">
					<thead>
						<tr>
							<th>Department</th>
							<th className="text-center">Workers</th>
							<th className="text-right">Expense posted</th>
						</tr>
					</thead>
					<tbody>
						{byDepartment.map((r) => (
							<tr key={r.name}>
								<td>{r.name}</td>
								<td className="text-center">{r.headcount}</td>
								<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
									{naira(r.total)}
								</td>
							</tr>
						))}
					</tbody>
				</Table>

				<FormGroup>
					<Label for="paymentAccountId">Paid from</Label>
					<Input id="paymentAccountId" type="select" value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)}>
						<option value="">Not recorded</option>
						{activeAccounts.map((a) => (
							<option key={a.id} value={a.id}>
								{a.name}
							</option>
						))}
					</Input>
				</FormGroup>

				{/* The confidentiality arrangement, stated where it matters. Whoever approves
				    should know what a manager will and will not be able to read afterwards. */}
				<Alert color="info" className="p-1 mb-0">
					One expense per department, each described as{' '}
					<em>“Payroll {payRun?.periodStart} to {payRun?.periodEnd} (n workers)”</em> — a headcount, never a name. Who
					was paid what stays on this run, which only an owner can open.
				</Alert>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="success" onClick={submit} disabled={saving || !items.length}>
					{saving ? <Spinner size="sm" /> : `Approve ${naira(total)}`}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default ApproveModal
