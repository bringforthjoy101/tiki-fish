import axios from 'axios'
import { paginateArray, sortCompare, apiRequest, swal } from '@utils'

// ** Get all Suppliers
export const getAllData = () => {
  return async dispatch => {
    const response = await apiRequest({url:'/suppliers', method:'GET'}, dispatch)
    if (response && response.data.data && response.data.status) {
      await dispatch({
        type: 'GET_ALL_SUPPLIER_DATA',
        data: response.data.data
      })
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }
  }
}

// ** Get data on page or row change
export const getData = params => {
  return async dispatch => {
    const response = await apiRequest({url:'/suppliers/list/data', method:'GET', params}, dispatch)
    if (response && response.data.data && response.data.status) {
      dispatch({
        type: 'GET_SUPPLIER_DATA',
        data: response.data.data,
        totalPages: response.data.total,
        params
      })
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }
  }
}

// All Users Filtered Data
export const getFilteredData = (suppliers, params) => {
    return async dispatch => {
      const { q = '', perPage = 10,  page = 1 } = params
  
      /* eslint-disable  */
      const queryLowered = q?.toLowerCase()
      const filteredData = suppliers?.filter(
        supplier => 
          (supplier?.name?.toLowerCase()?.includes(queryLowered))
        )
    
      /* eslint-enable  */
  
      dispatch({
        type: 'GET_SUPPLIER_DATA',
        data: paginateArray(filteredData, perPage, page),
        totalPages: filteredData.length,
        params
      })
    }
  }

// ** Get Supplier
export const getSupplier = id => {
  return async dispatch => {
    const response = await apiRequest({url:`/suppliers/get-detail/${id}`, method:'GET'}, dispatch)
    if (response && response.data.data && response.data.status) {
      dispatch({
        type: 'GET_SUPPLIER',
        selectedSupplier: response.data.data
      })
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }
  }
}

// ** Add new supplier
export const addSupplier = supplier => {
  return async dispatch => {
    return new Promise(async (resolve, reject) => {
      try {
        const body = JSON.stringify(supplier)
        console.log(body)
        const response = await apiRequest({url:'/suppliers/create', method:'POST', body}, dispatch)
        if (response && response.data.data && response.data.status) {
          dispatch({
            type: 'ADD_SUPPLIER',
            supplier
          })
        //   dispatch(getData({page: 1, perPage: 10}))
          dispatch(getAllData())
          resolve(response)
          swal('Great job!', response.data.message, 'success')
        } else {
          swal('Oops!', 'Something went wrong.', 'error')
          reject(response)
        }
      } catch (error) {
        swal('Oops!', 'Something went wrong.', 'error')
        reject(error)
      }
    })
  }
}

// ** Update Supplier
export const updateSupplier = supplier => {
  return async dispatch => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await apiRequest({url:`/suppliers/update/${supplier.id}`, method:'POST', data:supplier}, dispatch)
        if (response && response.data.data && response.data.status) {
          dispatch({
            type: 'UPDATE_SUPPLIER',  
            supplier
          })
        //   dispatch(getData({page: 1, perPage: 10}))
          dispatch(getAllData())
          resolve(response)
        } else {
          swal('Oops!', 'Something went wrong.', 'error')
          reject(response)
        }
      } catch (error) {
        swal('Oops!', 'Something went wrong.', 'error')
        reject(error)
      }
    })
  }
}

// ** Delete Supplier
export const deleteSupplier = id => {
  return async dispatch => {
    const response = await apiRequest({url:`/suppliers/delete/${id}`, method:'GET'}, dispatch)
    if (response && response.data.data && response.data.status) {
      dispatch({
        type: 'DELETE_SUPPLIER'
      })
    //   dispatch(getData({page: 1, perPage: 10}))
      dispatch(getAllData())
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }
  }
}

// ** Get Supplier Supply History
export const getSupplierSupplyHistory = id => {
  return async dispatch => {
    const response = await apiRequest({url:`/suppliers/supply-history/${id}`, method:'GET'}, dispatch)
    if (response && response.data.data && response.data.status) {
      dispatch({
        type: 'GET_SUPPLIER_SUPPLY_HISTORY',
        supplyHistory: response.data.supplyHistory
      })
    } else {
      swal('Oops!', 'Something went wrong.', 'error')
    }
  }
} 