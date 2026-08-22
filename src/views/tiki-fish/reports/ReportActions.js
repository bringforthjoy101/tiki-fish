import { useState, useContext } from 'react'
import { useDispatch } from 'react-redux'
import {
	Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
	Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Spinner
} from 'reactstrap'
import { Download, Mail, FileText, Printer } from 'react-feather'
import { AbilityContext } from '@src/utility/context/Can'
import { apiRequest, swal, apiUrl, Storage } from '@utils'

/**
 * Download and email, on every report screen.
 *
 * The file is built by the SERVER from the same handler that rendered this screen, so a
 * spreadsheet cannot disagree with what the reader is looking at. Generating it in the browser
 * from the redux payload would be a second code path over the same figures, and the drift would
 * only show up when a file met a screen.
 */
const ReportActions = ({ reportType, range, label }) => {
	const dispatch = useDispatch()
	const ability = useContext(AbilityContext)
	const [emailOpen, setEmailOpen] = useState(false)
	const [recipients, setRecipients] = useState('')
	const [note, setNote] = useState('')
	const [sending, setSending] = useState(false)
	const [downloading, setDownloading] = useState(false)

	const canEmail = ability.can('email', 'reports')
	const period = range?.startDate || range?.endDate ? `${range.startDate || 'the start'} to ${range.endDate || 'today'}` : 'all time'

	const qs = (extra = {}) => {
		const s = new URLSearchParams()
		if (range?.startDate) s.append('startDate', range.startDate)
		if (range?.endDate) s.append('endDate', range.endDate)
		Object.entries(extra).forEach(([k, v]) => s.append(k, v))
		return s.toString()
	}

	/**
	 * Fetched with the auth header and turned into a blob, NOT window.open on the URL.
	 * The route requires a session, and a plain link carries no Authorization header — it would
	 * download a 401 body saved as an .xlsx, which opens as a corrupt file rather than an error.
	 */
	const download = async (format) => {
		setDownloading(true)
		try {
			const userData = Storage.getItem('userData')
			const response = await fetch(`${apiUrl}/reports/${reportType}/export?${qs({ format })}`, {
				headers: { Authorization: `Bearer ${userData?.accessToken || ''}` }
			})
			if (!response.ok) {
				const text = await response.text()
				let message = `The export failed (${response.status}).`
				try {
					message = JSON.parse(text).message || message
				} catch (e) {
					// A non-JSON body means the server did not get as far as the handler.
				}
				return swal('Not downloaded', message, 'error')
			}
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `tiki-${reportType}-${range?.startDate || 'all'}_${range?.endDate || 'time'}.${format}`
			link.click()
			window.URL.revokeObjectURL(url)
		} catch (error) {
			swal('Not downloaded', error.message, 'error')
		} finally {
			setDownloading(false)
		}
	}

	const send = async () => {
		setSending(true)
		const response = await apiRequest(
			{
				url: `/reports/${reportType}/email`,
				method: 'POST',
				body: JSON.stringify({ recipients, note: note.trim() || undefined, startDate: range?.startDate, endDate: range?.endDate })
			},
			dispatch
		)
		setSending(false)
		if (response?.data?.status) {
			const copied = response.data.data?.blindCopiedTo || []
			const extra = copied.length ? ` This server also blind-copies ${copied.join(', ')}.` : ''
			swal('Sent', `${response.data.message}${extra}`, 'success')
			setEmailOpen(false)
			setRecipients('')
			setNote('')
		} else {
			swal('Not sent', response?.data?.message || 'The report could not be sent.', 'error')
		}
	}

	return (
		<>
			<UncontrolledDropdown className="no-print">
				<DropdownToggle color="secondary" outline caret disabled={downloading}>
					{downloading ? <Spinner size="sm" /> : <Download size={14} className="mr-50" />}
					Download
				</DropdownToggle>
				<DropdownMenu right>
					<DropdownItem onClick={() => download('xlsx')}>
						<FileText size={14} className="mr-50" /> Excel (all sections)
					</DropdownItem>
					<DropdownItem onClick={() => download('csv')}>
						{/* Stated, because a CSV cannot hold more than one sheet and silently
						    dropping the rest would be the wrong kind of surprise. */}
						<FileText size={14} className="mr-50" /> CSV (first section only)
					</DropdownItem>
					<DropdownItem divider />
					<DropdownItem onClick={() => window.print()}>
						<Printer size={14} className="mr-50" /> Print / save as PDF
					</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>

			{canEmail && (
				<Button color="secondary" outline className="no-print ml-50" onClick={() => setEmailOpen(true)}>
					<Mail size={14} className="mr-50" /> Email
				</Button>
			)}

			<Modal isOpen={emailOpen} toggle={() => setEmailOpen(false)} centered>
				<ModalHeader toggle={() => setEmailOpen(false)}>Email this report</ModalHeader>
				<ModalBody>
					<p>
						Sends <strong>{label}</strong> for <strong>{period}</strong> as a spreadsheet attachment.
					</p>
					<FormGroup>
						<Label for="recipients">Send to *</Label>
						<Input
							id="recipients"
							placeholder="accountant@firm.com, auditor@firm.com"
							value={recipients}
							onChange={(e) => setRecipients(e.target.value)}
						/>
						<small className="text-muted">Separate several addresses with commas. Check them — a report sent to the wrong address cannot be recalled.</small>
					</FormGroup>
					<FormGroup>
						<Label for="note">Add a note (optional)</Label>
						<Input id="note" type="textarea" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" outline onClick={() => setEmailOpen(false)} disabled={sending}>
						Cancel
					</Button>
					<Button color="primary" onClick={send} disabled={sending || !recipients.trim()}>
						{sending ? <Spinner size="sm" /> : 'Send it'}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	)
}

export default ReportActions
