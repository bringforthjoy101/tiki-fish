// ** React Imports
import { useState, useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'

// ** Third Party Components
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Label,
  FormGroup,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  FormFeedback,
  InputGroup,
  InputGroupAddon,
  InputGroupText
} from 'reactstrap'
import { User, Phone, MapPin, CreditCard, Briefcase, FileText, Check, X } from 'react-feather'

// ** Store & Actions
import { updateSupplier } from '../store/action'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { apiRequest } from '@utils'

// ** Debounce utility
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const SupplierInfo = ({ selectedSupplier }) => {
  // ** Store Vars
  const dispatch = useDispatch()
  const history = useHistory()

  // ** States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneAvailable, setPhoneAvailable] = useState(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // ** Form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      name: selectedSupplier.name || '',
      phone: selectedSupplier.phone || '',
      address: selectedSupplier.address || '',
      accountNumber: selectedSupplier.accountNumber || '',
      bankName: selectedSupplier.bankName || '',
      accountName: selectedSupplier.accountName || '',
      status: selectedSupplier.status || 'active'
    }
  })

  const watchedPhone = watch('phone')

  // ** Check phone availability with debounce
  const checkPhoneAvailability = useCallback(
    debounce(async (phone) => {
      if (!phone || phone === selectedSupplier.phone) {
        setPhoneAvailable(null)
        return
      }

      setCheckingPhone(true)
      try {
        const response = await apiRequest(
          {
            url: `/suppliers/check-phone?phone=${encodeURIComponent(phone)}&excludeId=${selectedSupplier.id}`,
            method: 'GET'
          },
          dispatch
        )

        if (response && response.data) {
          setPhoneAvailable(response.data.data.available)
        }
      } catch (error) {
        console.error('Error checking phone:', error)
      } finally {
        setCheckingPhone(false)
      }
    }, 500),
    [selectedSupplier.id, selectedSupplier.phone]
  )

  // ** Watch phone changes
  useEffect(() => {
    if (watchedPhone && watchedPhone !== selectedSupplier.phone) {
      checkPhoneAvailability(watchedPhone)
    } else {
      setPhoneAvailable(null)
    }
  }, [watchedPhone, checkPhoneAvailability, selectedSupplier.phone])

  // ** Update form values when selectedSupplier changes
  useEffect(() => {
    if (selectedSupplier) {
      setValue('name', selectedSupplier.name || '')
      setValue('phone', selectedSupplier.phone || '')
      setValue('address', selectedSupplier.address || '')
      setValue('accountNumber', selectedSupplier.accountNumber || '')
      setValue('bankName', selectedSupplier.bankName || '')
      setValue('accountName', selectedSupplier.accountName || '')
      setValue('status', selectedSupplier.status || 'active')
    }
  }, [selectedSupplier, setValue])

  // ** Update supplier
  const onSubmit = (data) => {
    // Prevent submit if phone is not available
    if (phoneAvailable === false) {
      return
    }

    setIsSubmitting(true)
    dispatch(
      updateSupplier({
        id: selectedSupplier.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        accountName: data.accountName,
        status: data.status
      })
    )
      .then(() => {
        setIsSubmitting(false)
        setShowSuccess(true)
        setTimeout(() => {
          history.push('/suppliers/list')
        }, 1500)
      })
      .catch(() => {
        setIsSubmitting(false)
      })
  }

  // ** Render phone validation indicator
  const renderPhoneValidation = () => {
    if (checkingPhone) {
      return <Spinner size="sm" color="primary" />
    }
    if (phoneAvailable === true) {
      return <Check size={18} className="text-success" />
    }
    if (phoneAvailable === false) {
      return <X size={18} className="text-danger" />
    }
    return null
  }

  // Nigerian Banks List
  const nigerianBanks = [
    { value: '', label: 'Select Bank' },
    { value: 'Access Bank', label: 'Access Bank' },
    { value: 'GTBank', label: 'GTBank' },
    { value: 'First Bank', label: 'First Bank' },
    { value: 'UBA', label: 'UBA' },
    { value: 'Zenith Bank', label: 'Zenith Bank' },
    { value: 'Fidelity Bank', label: 'Fidelity Bank' },
    { value: 'Union Bank', label: 'Union Bank' },
    { value: 'Sterling Bank', label: 'Sterling Bank' },
    { value: 'Wema Bank', label: 'Wema Bank' },
    { value: 'Stanbic IBTC', label: 'Stanbic IBTC' },
    { value: 'Polaris Bank', label: 'Polaris Bank' },
    { value: 'Keystone Bank', label: 'Keystone Bank' },
    { value: 'Ecobank', label: 'Ecobank' },
    { value: 'FCMB', label: 'FCMB' },
    { value: 'Heritage Bank', label: 'Heritage Bank' },
    { value: 'Kuda Bank', label: 'Kuda Bank' },
    { value: 'Opay', label: 'Opay' },
    { value: 'Moniepoint', label: 'Moniepoint' },
    { value: 'PalmPay', label: 'PalmPay' },
    { value: 'Other', label: 'Other' }
  ]

  return (
    <Row>
      {showSuccess && (
        <Col sm="12">
          <Alert color="success">Supplier updated successfully! Redirecting...</Alert>
        </Col>
      )}

      <Col sm="12">
        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* Contact Information Section */}
          <Card className="mb-2">
            <CardHeader className="pb-1">
              <CardTitle tag="h5">
                <User size={18} className="mr-50" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="6" sm="12">
                  <FormGroup>
                    <Label for="name">
                      Supplier Name <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="name"
                      control={control}
                      rules={{
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      }}
                      render={({ field }) => (
                        <Input id="name" placeholder="John Doe / Company Name" invalid={!!errors.name} {...field} />
                      )}
                    />
                    {errors.name && <FormFeedback>{errors.name.message}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md="6" sm="12">
                  <FormGroup>
                    <Label for="phone">
                      Phone <span className="text-danger">*</span>
                    </Label>
                    <InputGroup>
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText>
                          <Phone size={14} />
                        </InputGroupText>
                      </InputGroupAddon>
                      <Controller
                        name="phone"
                        control={control}
                        rules={{
                          required: 'Phone is required',
                          pattern: {
                            value: /^[0-9+\-\s()]+$/,
                            message: 'Invalid phone number format'
                          }
                        }}
                        render={({ field }) => (
                          <Input
                            id="phone"
                            placeholder="08012345678"
                            invalid={!!errors.phone || phoneAvailable === false}
                            {...field}
                          />
                        )}
                      />
                      <InputGroupAddon addonType="append">
                        <InputGroupText>{renderPhoneValidation()}</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {errors.phone && <FormFeedback className="d-block">{errors.phone.message}</FormFeedback>}
                    {phoneAvailable === false && (
                      <small className="text-danger">This phone number is already in use</small>
                    )}
                  </FormGroup>
                </Col>
                <Col sm="12">
                  <FormGroup>
                    <Label for="address">
                      <MapPin size={14} className="mr-50" />
                      Address
                    </Label>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="textarea"
                          id="address"
                          placeholder="123 Main St, City, State"
                          rows={2}
                          {...field}
                        />
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Banking Information Section */}
          <Card className="mb-2">
            <CardHeader className="pb-1">
              <CardTitle tag="h5">
                <CreditCard size={18} className="mr-50" />
                Banking Information
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="4" sm="12">
                  <FormGroup>
                    <Label for="bankName">
                      <Briefcase size={14} className="mr-50" />
                      Bank Name
                    </Label>
                    <Controller
                      name="bankName"
                      control={control}
                      render={({ field }) => (
                        <Input type="select" id="bankName" {...field}>
                          {nigerianBanks.map((bank) => (
                            <option key={bank.value} value={bank.value}>
                              {bank.label}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                  </FormGroup>
                </Col>
                <Col md="4" sm="12">
                  <FormGroup>
                    <Label for="accountNumber">Account Number</Label>
                    <Controller
                      name="accountNumber"
                      control={control}
                      rules={{
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Account number must be 10 digits'
                        }
                      }}
                      render={({ field }) => (
                        <Input
                          id="accountNumber"
                          placeholder="1234567890"
                          maxLength={10}
                          invalid={!!errors.accountNumber}
                          {...field}
                        />
                      )}
                    />
                    {errors.accountNumber && <FormFeedback>{errors.accountNumber.message}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md="4" sm="12">
                  <FormGroup>
                    <Label for="accountName">Account Name</Label>
                    <Controller
                      name="accountName"
                      control={control}
                      render={({ field }) => <Input id="accountName" placeholder="Account Holder Name" {...field} />}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Status Section */}
          <Card className="mb-2">
            <CardHeader className="pb-1">
              <CardTitle tag="h5">
                <FileText size={18} className="mr-50" />
                Status
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="6" sm="12">
                  <FormGroup>
                    <Label for="status">Supplier Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Input type="select" id="status" {...field}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Input>
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <Col className="d-flex flex-sm-row flex-column mt-2 px-0" sm="12">
            <Button.Ripple
              className="mb-1 mb-sm-0 mr-0 mr-sm-1"
              type="submit"
              color="primary"
              disabled={isSubmitting || phoneAvailable === false || !isDirty}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" color="white" className="mr-50" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button.Ripple>
            <Button.Ripple color="secondary" outline onClick={() => history.push('/suppliers/list')} disabled={isSubmitting}>
              Cancel
            </Button.Ripple>
            {isDirty && (
              <Badge color="warning" className="ml-2 align-self-center">
                Unsaved changes
              </Badge>
            )}
          </Col>
        </Form>
      </Col>
    </Row>
  )
}

export default SupplierInfo
