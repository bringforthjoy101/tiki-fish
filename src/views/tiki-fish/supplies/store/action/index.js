import { paginateArray, apiRequest, swal } from '@utils'

// ** Get all Supplies
export const getAllSupplies = (params = {}) => {
  return async dispatch => {
    dispatch({ type: 'SET_SUPPLIES_LOADING', loading: true })

    const queryParams = new URLSearchParams()
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params.overdueOnly) queryParams.append('overdueOnly', params.overdueOnly)
    if (params.supplierId) queryParams.append('supplierId', params.supplierId)
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)

    const queryString = queryParams.toString()
    const url = `/supplies${queryString ? `?${queryString}` : ''}`

    const response = await apiRequest({ url, method: 'GET' }, dispatch)

    if (response && response.data.data && response.data.status) {
      await dispatch({
        type: 'GET_ALL_SUPPLIES_DATA',
        data: response.data.data
      })
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }

    dispatch({ type: 'SET_SUPPLIES_LOADING', loading: false })
  }
}

// ** Get Supplies Summary
export const getSuppliesSummary = (params = {}) => {
  return async dispatch => {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)

    const queryString = queryParams.toString()
    const url = `/supplies/summary${queryString ? `?${queryString}` : ''}`

    const response = await apiRequest({ url, method: 'GET' }, dispatch)

    if (response && response.data.data && response.data.status) {
      await dispatch({
        type: 'GET_SUPPLIES_SUMMARY',
        summary: response.data.data
      })
    } else {
      swal('Oops!', 'Something went wrong fetching summary.', 'error')
    }
  }
}

// ** Get All Suppliers (for filter dropdown)
export const getAllSuppliers = () => {
  return async dispatch => {
    const response = await apiRequest({ url: '/suppliers', method: 'GET' }, dispatch)

    if (response && response.data.data && response.data.status) {
      await dispatch({
        type: 'GET_SUPPLIERS_FOR_FILTER',
        suppliers: response.data.data
      })
    }
  }
}

// ** Filtered Data for pagination
export const getFilteredData = (supplies, params) => {
  return async dispatch => {
    const { q = '', perPage = 10, page = 1, supplierId = '', paymentStatus = '', overdueOnly = false } = params

    /* eslint-disable  */
    const queryLowered = q?.toLowerCase()
    let filteredData = supplies?.filter(supply => {
      const matchesSearch =
        supply?.name?.toLowerCase()?.includes(queryLowered) ||
        supply?.supplier?.name?.toLowerCase()?.includes(queryLowered)

      const matchesSupplier = supplierId ? supply.supplierId === parseInt(supplierId) : true
      const matchesPaymentStatus = paymentStatus ? supply.paymentStatus === paymentStatus : true
      const matchesOverdue = overdueOnly ? supply.isOverdue : true

      return matchesSearch && matchesSupplier && matchesPaymentStatus && matchesOverdue
    })
    /* eslint-enable  */

    dispatch({
      type: 'GET_SUPPLIES_DATA',
      data: paginateArray(filteredData, perPage, page),
      totalPages: filteredData?.length || 0,
      params
    })
  }
}

// ** Pay Supply
export const paySupply = (supplyId, paymentData) => {
  return async dispatch => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await apiRequest({
          url: `/supplies/pay/${supplyId}`,
          method: 'POST',
          body: JSON.stringify(paymentData)
        }, dispatch)

        if (response && response.data && response.data.status) {
          dispatch({
            type: 'UPDATE_SUPPLY_PAYMENT',
            supply: response.data.data.supply
          })
          resolve(response)
          swal('Success!', response.data.message, 'success')
        } else {
          swal('Oops!', response?.data?.message || 'Something went wrong.', 'error')
          reject(response)
        }
      } catch (error) {
        swal('Oops!', error.message || 'Something went wrong.', 'error')
        reject(error)
      }
    })
  }
}
