import { useState, useEffect } from 'react'
import { isUserLoggedIn } from '@utils'
import { Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Label, FormGroup, Input } from 'reactstrap'
import { Formik, Field, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { AvForm, AvInput } from 'availity-reactstrap-validation-safe'
import { getAllData, getAdmin, editAdmin } from '../store/action'
import { store } from '@store/storeConfig/store'
import { can } from '@src/utility/capabilities'
import Row from 'reactstrap/lib/Row'
import Col from 'reactstrap/lib/Col'

export const EditAdmin = ({ selectedAdmin }) => {
	const dispatch = useDispatch()
	const { id } = useParams()
	// Changing what somebody is allowed to do is owner-only, and the server enforces it. Greying
	// the controls out means a manager sees why rather than getting a 400 on save.
	const canAssign = can('admins.assignRole')
	const [userData, setUserData] = useState({
		firstName: selectedAdmin.firstName,
		lastName: selectedAdmin.lastName,
		phone: selectedAdmin.phone,
		status: selectedAdmin.status,
		role: selectedAdmin.role,
		accessRole: selectedAdmin.accessRole || 'none',
	})
	const [formModal, setFormModal] = useState(false)

	const onSubmit = async (event, errors) => {
		event?.preventDefault()
		if (errors && !errors.length) {
			await dispatch(editAdmin(id, userData))
			dispatch(getAdmin(id))
			setFormModal(!formModal)
		}
	}

	return (
		<div>
			<Button.Ripple className="text-center mb-1" color="primary" outline block onClick={() => setFormModal(!formModal)}>
				Edit Admin
			</Button.Ripple>
			<Modal isOpen={formModal} toggle={() => setFormModal(!formModal)} className="modal-dialog-centered modal-lg">
				<ModalHeader toggle={() => setFormModal(!formModal)}>Edit Admin</ModalHeader>
				<AvForm onSubmit={onSubmit}>
					<ModalBody>
						<Row>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="firstName">First Name</Label>
									<AvInput
										type="text"
										name="firstName"
										id="firstName"
										placeholder="First Name"
										value={selectedAdmin.firstName}
										onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
										required
									/>
								</FormGroup>
							</Col>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="lastName">Last Name</Label>
									<AvInput
										type="text"
										name="lastName"
										id="lastName"
										placeholder="admin.user@mail.com"
										value={selectedAdmin.lastName}
										onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
										required
									/>
								</FormGroup>
							</Col>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="phone">Phone</Label>
									<AvInput
										type="number"
										name="phone"
										id="phone"
										placeholder="Phone"
										value={selectedAdmin.phone}
										onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
										required
									/>
								</FormGroup>
							</Col>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="role">User Role</Label>
									<AvInput
										type="select"
										id="role"
										name="role"
										value={userData.role}
										onChange={(e) => setUserData({ ...userData, role: e.target.value })}
										required
										disabled={!canAssign}
									>
										<option value="admin">Admin — runs operations</option>
										<option value="store">Store — keeps stock, counts, makes batches</option>
										<option value="sales-rep">Sales Rep — takes orders</option>
									</AvInput>
									<small className="text-muted">What they do day to day. Never shows money on its own.</small>
								</FormGroup>
							</Col>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="accessRole">Finance access</Label>
									{/* The SECOND axis. What somebody can do is the union of this and the role
									    above, which is why it has to be set here and not inferred — and why it
									    was invisible until now: nothing accepted it, so it could only ever be
									    set with SQL. That is why no storekeeper account existed. */}
									<AvInput
										type="select"
										id="accessRole"
										name="accessRole"
										value={userData.accessRole}
										onChange={(e) => setUserData({ ...userData, accessRole: e.target.value })}
										disabled={!canAssign}
									>
										<option value="none">None — cannot see money at all</option>
										<option value="clerk">Clerk — records spending, sees their own entries</option>
										<option value="manager">Manager — sees all money, pays, posts stock counts</option>
										<option value="owner">Owner — everything, including changing roles</option>
									</AvInput>
									<small className="text-muted">Separate from the role above. Set to None for farm and sales staff.</small>
								</FormGroup>
							</Col>
							<Col xl="6" lg="12">
								<FormGroup>
									<Label for="status">User Status</Label>
									<AvInput
										type="select"
										id="status"
										name="status"
										value={selectedAdmin.status}
										onChange={(e) => setUserData({ ...userData, status: e.target.value })}
										required
									>
										<option value={selectedAdmin.status}>{selectedAdmin.status}</option>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
									</AvInput>
								</FormGroup>
							</Col>
						</Row>
					</ModalBody>
					<ModalFooter>
						<Button.Ripple color="primary" type="submit">
							<span className="ml-50">Save Changes</span>
						</Button.Ripple>
					</ModalFooter>
				</AvForm>
			</Modal>
		</div>
	)
}
export default EditAdmin
