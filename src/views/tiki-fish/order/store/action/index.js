import { paginateArray, sortCompare, apiRequest, swal } from '@utils'
import moment from 'moment'

export const apiUrl = process.env.REACT_APP_API_ENDPOINT

// ** Get all User Data
export const getAllData = () => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/orders', method: 'GET' }, dispatch)
		console.log(response)
		if (response && response.data.data && response.data.status) {
			await dispatch({
				type: 'GET_ALL_ORDERS_DATA',
				data: response.data.data,
			})
			return response.data.data
		} else {
			console.log(response)
			swal('Oops!', 'Something went wrong.', 'error')
			return []
		}
	}
}

export const completeOrder = (orderId) => {
	return async dispatch => {
	  const response = await apiRequest({url:`/orders/complete/${orderId}`, method:'GET'}, dispatch)
	  if (response && response.data.status) {
		  return response.data
	  } else {
		console.log(response)
		swal('Oops!', 'Something went wrong.', 'error')
	  }
	}
}

export const nullifyOrder = (orderId) => {
	return async dispatch => {
	  const response = await apiRequest({url:`/orders/nullify/${orderId}`, method:'GET'}, dispatch)
	  if (response && response.data.status) {
		  return response.data
	  } else {
		console.log(response)
		swal('Oops!', 'Something went wrong.', 'error')
	  }
	}
}

// All Users Filtered Data
/**
 * Search and page orders on the SERVER.
 *
 * The old list called GET /orders, which was capped at `limit: 2500`, and filtered the result in
 * the browser. With 7,210 orders that meant 4,710 of them — 65%, everything before 15 Dec 2025 —
 * could not be found at all. The search box worked; the orders simply were not there.
 *
 * It also now searches customer PHONE and delivery LOCATION, neither of which the browser-side
 * filter covered. A rep with a caller's number had no way to reach their order.
 */
export const searchOrders = (params = {}) => {
	return async (dispatch) => {
		const { page = 1, perPage = 25, q = '', status = '', paymentStatus = '', startDate = '', endDate = '', sort = 'recent' } = params
		const search = new URLSearchParams({ page, perPage, sort })
		if (q) search.append('q', q)
		if (status) search.append('status', status)
		if (paymentStatus) search.append('paymentStatus', paymentStatus)
		if (startDate) search.append('startDate', startDate)
		if (endDate) search.append('endDate', endDate)

		const response = await apiRequest({ url: `/orders?${search.toString()}`, method: 'GET' }, dispatch)
		const payload = response?.data?.data
		if (response?.data?.status && payload) {
			dispatch({
				type: 'GET_FILTERED_ORDER_DATA',
				data: payload.data ?? payload,
				totalPages: payload.total ?? (Array.isArray(payload) ? payload.length : 0),
				summary: payload.summary,
				params: { page, perPage, q, status, paymentStatus, startDate, endDate, sort },
			})
		} else {
			swal('Oops!', response?.data?.message || 'Could not load orders.', 'error')
		}
	}
}

/**
 * Fetch every order matching the current filters, for export.
 *
 * Uses the unpaginated path, which the API caps at 2,500 rows. Returns `truncated` so the caller
 * can say so rather than handing someone a file that quietly stops partway.
 */
export const fetchOrdersForExport = (params = {}) => {
	return async (dispatch) => {
		const { q = '', status = '', paymentStatus = '', startDate = '', endDate = '' } = params
		const search = new URLSearchParams()
		if (q) search.append('q', q)
		if (status) search.append('status', status)
		if (paymentStatus) search.append('paymentStatus', paymentStatus)
		if (startDate) search.append('startDate', startDate)
		if (endDate) search.append('endDate', endDate)
		const qs = search.toString()

		const response = await apiRequest({ url: `/orders${qs ? `?${qs}` : ''}`, method: 'GET' }, dispatch)
		if (response?.data?.status && Array.isArray(response.data.data)) {
			return { rows: response.data.data, truncated: response.data.data.length >= 2500 }
		}
		swal('Oops!', response?.data?.message || 'Could not fetch orders to export.', 'error')
		return { rows: [], truncated: false }
	}
}

/** Re-run whatever view is on screen — after a status change or an edit. */
export const refreshOrders = () => {
	return async (dispatch, getState) => {
		await dispatch(searchOrders(getState().orders.params || {}))
	}
}

export const getFilteredData = (orders, params) => {
	return async (dispatch) => {
		const { q = '', perPage = 100, page = 1, status = '', paymentStatus = '' } = params

		/* eslint-disable  */
		const queryLowered = q?.toLowerCase()
		let filteredData = orders?.filter((order) => {
			// Text search filter
			const matchesSearch = !q || 
				order?.orderNumber?.toLowerCase()?.includes(queryLowered) ||
				order?.customer?.fullName?.toLowerCase()?.includes(queryLowered) ||
				moment(order.createdAt).format('lll').includes(q)
			
			// Status filter
			const matchesStatus = !status || order?.status === status
			
			// Payment status filter
			const matchesPaymentStatus = !paymentStatus || order?.paymentStatus === paymentStatus
			
			return matchesSearch && matchesStatus && matchesPaymentStatus
		})

		/* eslint-enable  */
		dispatch({
			type: 'GET_FILTERED_ORDER_DATA',
			data: paginateArray(filteredData, perPage, page),
			totalPages: filteredData.length,
			params,
		})
	}
}

export const getFilteredRageData = (orders, range, params) => {
	// const or = [
	// 	{ id: 683, orderNumber: '164ca075', amount: 240, createdAt: '2022-03-13T10:28:20.000Z' },
	// 	{ id: 682, orderNumber: '3526fdb4', amount: 350, createdAt: '2022-03-13T10:28:20.000Z' },
	// 	{ id: 681, orderNumber: '1c4a7825', amount: 270, createdAt: '2022-03-14T10:28:20.000Z' },
	// 	{ id: 680, orderNumber: '3801d8ad', amount: 440, createdAt: '2022-03-14T10:28:20.000Z' },
	// 	{ id: 679, orderNumber: '4357861', amount: 50, createdAt: '2022-03-01T10:28:20.000Z' },
	// 	{ id: 678, orderNumber: '1f316cac', amount: 310, createdAt: '2022-03-02T10:28:20.000Z' },
	// 	{ id: 677, orderNumber: '496e23f', amount: 310, createdAt: '2022-03-03T10:28:20.000Z' },
	// 	{ id: 676, orderNumber: '76a2661', amount: 150, createdAt: '2022-03-04T10:28:20.000Z' },
	// 	{ id: 675, orderNumber: '7f89629', amount: 500, createdAt: '2022-03-05T10:28:20.000Z' },
	// 	{ id: 674, orderNumber: '2fff0305', amount: 390, createdAt: '2022-03-06T10:28:20.000Z' },
	// ]
	// const ra = [1647126000000, 1647212400000]
	// console.log(or.filter(({ createdAt }) => new Date(createdAt).getTime() >= ra[0] && new Date(createdAt).getTime() <= ra[1]))
	// console.log(or.filter((d) => {
	//   const time = new Date(d.createdAt).getTime()
	//   return ra[0] < time && time < ra[1]
	// }))
	return async (dispatch) => {
		const { q = '', perPage = 100, page = 1 } = params
		// console.log(range)
		// orders.filter((d) => {
		// 	const time = new Date(d.createdAt).getTime()
		// 	return range[0] < time && time < range[1]
		// })
		console.log('incoming length', orders.length)
		const newOrders = orders.filter(({ createdAt }) => new Date(createdAt).getTime() >= range[0] && new Date(createdAt).getTime() <= range[1])
		console.log('outgoing length', newOrders.length)

		/* eslint-enable  */
		dispatch({
			type: 'GET_FILTERED_ORDER_DATA',
			data: paginateArray(newOrders, perPage, page),
			totalPages: newOrders.length,
			params,
		})
	}
	// return orders.filter((d) => {
	// 	const time = new Date(d.createdAt).getTime()
	// 	return range[0] < time && time < range[1]
	// })
}

//  Get User
export const getOrder = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/orders/get-detail/${id}`, method: 'GET' }, dispatch)
		if (response && response.data.data && response.data.status) {
			await dispatch({
				type: 'GET_ORDER',
				selectedOrder: response.data.data,
			})
		} else {
			console.log(response)
			swal('Oops!', 'Something went wrong.', 'error')
		}
	}
}
