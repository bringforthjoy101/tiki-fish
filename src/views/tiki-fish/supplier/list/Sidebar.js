// ** React Import
import { useState } from 'react'

// ** Custom Components
import Sidebar from '@components/sidebar'

// ** Utils
import { isObjEmpty } from '@utils'

// ** Third Party Components
import classnames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { Button, FormGroup, Label, Form, Input, Spinner } from 'reactstrap'

// ** Store & Actions
import { addSupplier } from '../store/action'
import { useDispatch } from 'react-redux'

const SidebarNewSupplier = ({ open, toggleSidebar }) => {
  // ** States
  const [role, setRole] = useState('active')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ** Store Vars
  const dispatch = useDispatch()

  // ** Vars
  const { control, handleSubmit, formState: { errors } } = useForm()

  // ** Function to handle form submit
  const onSubmit = data => {
    if (isObjEmpty(errors)) {
      setIsSubmitting(true)
      dispatch(
        addSupplier({
          name: data.name,
          address: data.address,
          phone: data.phone,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          accountName: data.accountName
        })
      ).then(() => {
        setIsSubmitting(false)
        toggleSidebar()
      }).catch(() => {
        setIsSubmitting(false)
      })
    }
  }

  return (
    <Sidebar
      size='lg'
      open={open}
      title='New Supplier'
      headerClassName='mb-1'
      contentClassName='pt-0'
      toggleSidebar={toggleSidebar}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label for='name'>Name <span className='text-danger'>*</span></Label>
          <Controller
            name='name'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input
                id='name'
                placeholder='John Doe'
                invalid={errors.name && true}
                {...field}
              />
            )}
          />
        </FormGroup>
        <FormGroup>
          <Label for='phone'>Phone <span className='text-danger'>*</span></Label>
          <Controller
            name='phone'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input
                type='text'
                id='phone'
                placeholder='09123456789'
                invalid={errors.phone && true}
                {...field}
              />
            )}
          />
        </FormGroup>
        <FormGroup>
          <Label for='accountNumber'>Account Number <span className='text-danger'>*</span></Label>
          <Controller
            name='accountNumber'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input
                id='accountNumber'
                placeholder='1234567890'
                invalid={errors.accountNumber && true}
                {...field}
              />
            )}
          />
        </FormGroup>
        <FormGroup>
          <Label for='bankName'>Bank Name</Label>
          <Controller
            name='bankName'
            control={control}
            render={({ field }) => (
              <Input
                id='bankName'
                placeholder='Bank Name'
                {...field}
              />
            )}
          />
        </FormGroup>
        <FormGroup>
          <Label for='accountName'>Account Name</Label>
          <Controller
            name='accountName'
            control={control}
            render={({ field }) => (
              <Input
                id='accountName'
                placeholder='Account Name'
                {...field}
              />
            )}
          />
        </FormGroup>
        <FormGroup className='mb-2'>
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
        
        <Button type='submit' className='mr-1' color='primary' disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size='sm' color='white' className='mr-50' />
              <span>Submitting...</span>
            </>
          ) : (
            'Submit'
          )}
        </Button>
        <Button type='reset' color='secondary' outline onClick={toggleSidebar} disabled={isSubmitting}>
          Cancel
        </Button>
      </Form>
    </Sidebar>
  )
}

export default SidebarNewSupplier 