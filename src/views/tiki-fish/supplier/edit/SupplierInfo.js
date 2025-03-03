// ** React Imports
import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

// ** Third Party Components
import { Media, Row, Col, Button, Form, Input, Label, FormGroup, CustomInput, Spinner } from 'reactstrap'

// ** Store & Actions
import { updateSupplier } from '../store/action'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'

const SupplierInfo = ({ selectedSupplier }) => {
  // ** Store Vars
  const dispatch = useDispatch()
  const history = useHistory()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ** Form
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: selectedSupplier.name || '',
      email: selectedSupplier.email || '',
      contact: selectedSupplier.contact || selectedSupplier.phone || '',
      company: selectedSupplier.company || '',
      address: selectedSupplier.address || '',
      status: selectedSupplier.status || 'active'
    }
  })

  // ** Update form values when selectedSupplier changes
  useEffect(() => {
    if (selectedSupplier) {
      setValue('name', selectedSupplier.name || '')
      setValue('email', selectedSupplier.email || '')
      setValue('contact', selectedSupplier.contact || selectedSupplier.phone || '')
      setValue('company', selectedSupplier.company || '')
      setValue('address', selectedSupplier.address || '')
      setValue('status', selectedSupplier.status || 'active')
    }
  }, [selectedSupplier, setValue])

  // ** Update supplier
  const onSubmit = data => {
    setIsSubmitting(true)
    dispatch(
      updateSupplier({
        id: selectedSupplier.id,
        ...data
      })
    ).then(() => {
      setIsSubmitting(false)
      history.push('/suppliers/list')
    }).catch(() => {
      setIsSubmitting(false)
    })
  }

  return (
    <Row>
      <Col sm='12'>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='name'>Name</Label>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='name'
                      placeholder='John Doe'
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='email'>Email</Label>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input
                      type='email'
                      id='email'
                      placeholder='john@example.com'
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='contact'>Contact</Label>
                <Controller
                  name='contact'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='contact'
                      placeholder='+1 (234) 567-8901'
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='company'>Company</Label>
                <Controller
                  name='company'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='company'
                      placeholder='Company Name'
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='address'>Address</Label>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='address'
                      placeholder='123 Main St, City, Country'
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md='6' sm='12'>
              <FormGroup>
                <Label for='status'>Status</Label>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <Input
                      type='select'
                      id='status'
                      {...field}
                    >
                      <option value='active'>Active</option>
                      <option value='inactive'>Inactive</option>
                      <option value='pending'>Pending</option>
                    </Input>
                  )}
                />
              </FormGroup>
            </Col>
            <Col className='d-flex flex-sm-row flex-column mt-2' sm='12'>
              <Button.Ripple className='mb-1 mb-sm-0 mr-0 mr-sm-1' type='submit' color='primary' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size='sm' color='white' className='mr-50' />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button.Ripple>
              <Button.Ripple color='secondary' outline onClick={() => history.push('/suppliers/list')} disabled={isSubmitting}>
                Cancel
              </Button.Ripple>
            </Col>
          </Row>
        </Form>
      </Col>
    </Row>
  )
}
export default SupplierInfo 