// ** React Imports
import { useState, useEffect } from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

// ** Reactstrap Imports
import { Card, CardBody, CardHeader, CardTitle, Label, Alert, Spinner, Badge } from 'reactstrap'

// ** Icons
import { Folder, Tag, AlertCircle } from 'react-feather'

// ** Utils
import { apiRequest } from '@utils'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'

const animatedComponents = makeAnimated()

const CategorySelector = ({ productId, selectedCategories = [], onCategoriesUpdate }) => {
  const [categories, setCategories] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Fetch all available categories
  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest({
        url: '/categories',
        method: 'GET'
      })

      if (response.data.status) {
        const categoryOptions = response.data.data.map(cat => ({
          value: cat.id,
          label: cat.name,
          parent: cat.parentId,
          description: cat.description
        }))
        setCategories(categoryOptions)
        
        // Set initially selected categories
        const selected = categoryOptions.filter(cat => 
          selectedCategories.some(sc => sc.id === cat.value)
        )
        setSelectedOptions(selected)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  // Update product categories
  const updateProductCategories = async (selected) => {
    if (!productId) return

    setSaving(true)
    try {
      const categoryIds = selected.map(cat => cat.value)
      const response = await apiRequest({
        url: `/products/${productId}/categories`,
        method: 'PUT',
        body: JSON.stringify({ categoryIds })
      })

      if (response.data.status) {
        if (onCategoriesUpdate) {
          onCategoriesUpdate(selected)
        }
      } else {
        setError('Failed to update categories')
      }
    } catch (error) {
      console.error('Error updating categories:', error)
      setError('Failed to update categories')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleChange = (selected) => {
    setSelectedOptions(selected || [])
    updateProductCategories(selected || [])
  }

  // Custom option component to show hierarchy
  const formatOptionLabel = ({ label, parent, description }) => (
    <div className="d-flex align-items-center">
      <div>
        <span className="d-block">{label}</span>
        {description && (
          <small className="text-muted d-block">{description}</small>
        )}
      </div>
    </div>
  )

  // Group categories by parent
  const groupedOptions = categories.reduce((groups, category) => {
    const groupName = category.parent ? 'Sub-categories' : 'Main Categories'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(category)
    return groups
  }, {})

  const formattedOptions = Object.keys(groupedOptions).map(groupName => ({
    label: groupName,
    options: groupedOptions[groupName]
  }))

  if (!productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>
            <Folder size={20} className='mr-1' />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Alert color="info">
            <AlertCircle size={14} className="mr-1" />
            Please save the product first before managing categories
          </Alert>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>
          <Folder size={20} className='mr-1' />
          Product Categories
        </CardTitle>
        {selectedOptions.length > 0 && (
          <Badge color="light-primary">{selectedOptions.length} categories selected</Badge>
        )}
      </CardHeader>
      <CardBody>
        <div className="mb-2">
          <Label>Select Categories</Label>
          <small className="text-muted d-block mb-1">
            Choose multiple categories to help customers find this product
          </small>
        </div>

        {error && (
          <Alert color="danger" className="mb-2">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-3">
            <Spinner size="sm" />
            <p className="mt-2 mb-0">Loading categories...</p>
          </div>
        ) : (
          <>
            <Select
              isMulti
              name="categories"
              options={formattedOptions}
              className="react-select"
              classNamePrefix="select"
              components={animatedComponents}
              value={selectedOptions}
              onChange={handleChange}
              formatOptionLabel={formatOptionLabel}
              placeholder="Select categories..."
              isLoading={saving}
              isDisabled={saving}
              isClearable
              theme={theme => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: '#7367f01a',
                  primary: '#7367f0'
                }
              })}
            />

            {selectedOptions.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">Selected:</small>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {selectedOptions.map(cat => (
                    <Badge key={cat.value} color="light-primary" className="mr-1 mb-1">
                      <Tag size={12} className="mr-1" />
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default CategorySelector