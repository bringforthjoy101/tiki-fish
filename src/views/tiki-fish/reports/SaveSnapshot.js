import { useState, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Spinner } from 'reactstrap'
import { Save } from 'react-feather'
import { AbilityContext } from '@src/utility/context/Can'
import { createSnapshot } from './store/action'

/**
 * "Save this report" — shown on each report screen.
 *
 * The button sends only the report type and the dates. The server re-runs the report and stores
 * what IT computed; a figure the browser could supply would be worthless as evidence.
 *
 * Gated on periods.lock, which is owner-only. Anyone with reports.pnl can READ a saved report —
 * freezing one is the act that creates a record somebody may later be held to.
 */
const SaveSnapshot = ({ reportType, range }) => {
	const dispatch = useDispatch()
	const ability = useContext(AbilityContext)
	const { saving } = useSelector((s) => s.reports)
	const [open, setOpen] = useState(false)
	const [note, setNote] = useState('')

	if (!ability.can('lock', 'periods')) return null

	const period = range?.startDate || range?.endDate ? `${range.startDate || 'the start'} to ${range.endDate || 'today'}` : 'all time'

	const save = async () => {
		const saved = await dispatch(
			createSnapshot({ reportType, startDate: range?.startDate || undefined, endDate: range?.endDate || undefined, note: note.trim() || undefined })
		)
		if (saved) {
			setOpen(false)
			setNote('')
		}
	}

	return (
		<>
			<Button color="primary" outline className="no-print" onClick={() => setOpen(true)}>
				<Save size={14} className="mr-50" />
				Save this report
			</Button>

			<Modal isOpen={open} toggle={() => setOpen(false)} centered>
				<ModalHeader toggle={() => setOpen(false)}>Save this report</ModalHeader>
				<ModalBody>
					<p>
						This keeps a permanent copy of what the report says right now, for <strong>{period}</strong>.
					</p>
					<p className="text-muted">
						Orders and expenses can still be edited after today, which changes what this screen shows next month. A saved copy does
						not change. Use it whenever you send figures to someone outside the business.
					</p>
					<FormGroup>
						<Label>What is this copy for? (optional)</Label>
						<Input
							type="textarea"
							rows="2"
							placeholder="e.g. Sent to the accountant on 21 August"
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" outline onClick={() => setOpen(false)} disabled={saving}>
						Cancel
					</Button>
					<Button color="primary" onClick={save} disabled={saving}>
						{saving ? <Spinner size="sm" /> : 'Save it'}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	)
}

export default SaveSnapshot
