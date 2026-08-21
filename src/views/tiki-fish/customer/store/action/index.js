import { paginateArray, sortCompare, apiRequest, swal, textMatches } from '@utils'
import moment from 'moment'

export const apiUrl = process.env.REACT_APP_API_ENDPOINT

// ** Get all User Data
export const getAllData = (role) => {
	return async (dispatch) => {
		const url = role === 'store' ? '/customers/kitchen' : '/customers'
		const response = await apiRequest({ url, method: 'GET' }, dispatch)
		if (response && response.data.data && response.data.status) {
			await dispatch({
				type: 'GET_ALL_DATA',
				data: response.data.data,
			})
			// Returned as well as dispatched, so the CSV/PDF export can use the rows immediately
			// instead of racing a redux update it cannot await.
			return response.data.data
		}
		console.log(response)
		swal('Oops!', 'Something went wrong.', 'error')
		return []
	}
}

/**
 * Search and page the customer list on the SERVER.
 *
 * The list used to download all 4,109 customers on every visit and filter them in the browser.
 * That is why one row with a null location could break search for the whole page, and why the
 * page cost ~500KB and a 1.7s wait before anything could be typed.
 *
 * It dispatches the same GET_FILTERED_CUSTOMER_DATA the client-side filter did, so the table
 * reads `store.data` / `store.total` exactly as before — only the source of truth moved.
 *
 * `getAllData` is deliberately left alone: ecommerce/checkout/steps/Cart.js builds its customer
 * picker from the unpaginated endpoint, and quietly truncating that to 25 would make most
 * customers unselectable when creating an order.
 */
export const searchCustomers = (params = {}) => {
	return async (dispatch) => {
		const { page = 1, perPage = 25, q = '', status = '', sort = 'name' } = params
		const search = new URLSearchParams({ page, perPage, sort })
		if (q) search.append('q', q)
		if (status) search.append('status', status)

		const response = await apiRequest({ url: `/customers?${search.toString()}`, method: 'GET' }, dispatch)
		const payload = response?.data?.data
		if (response?.data?.status && payload) {
			dispatch({
				type: 'GET_FILTERED_CUSTOMER_DATA',
				// `total` is the count of everything MATCHING, not the page length — the pager
				// needs the full count or it renders one page and hides the rest.
				data: payload.data ?? payload,
				totalPages: payload.total ?? (Array.isArray(payload) ? payload.length : 0),
				params: { page, perPage, q, status, sort },
			})
		} else {
			swal('Oops!', response?.data?.message || 'Could not load customers.', 'error')
		}
	}
}

/** Re-run whatever search is currently on screen — after a create, edit or delete. */
export const refreshCustomers = () => {
	return async (dispatch, getState) => {
		await dispatch(searchCustomers(getState().customers.params || {}))
	}
}

// All Users Filtered Data
export const getFilteredData = (customers, params) => {
	return async (dispatch) => {
		const { q = '', perPage = 10, number = '', page = 1, status = null } = params

		/* eslint-disable  */
		const filteredData = customers.filter(
			(customer) =>
				(textMatches(customer.fullName, q) || textMatches(customer.phone, q) || textMatches(customer.location, q)) &&
				customer.status === (status || customer.status)
		)

		/* eslint-enable  */

		dispatch({
			type: 'GET_FILTERED_CUSTOMER_DATA',
			data: paginateArray(filteredData, perPage, page),
			totalPages: filteredData.length,
			params,
		})
	}
}

// get user details
export const getCustomerDetails = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/customers/get-detail/${id}`, method: 'GET' }, dispatch)
		// console.log(response)
		if (response && response.data && response.data.status) {
			await dispatch({
				type: 'GET_CUSTOMER_DETAILS',
				customerDetails: response.data.data,
			})
		} else {
			console.log(response)
			swal('Oops!', 'Something went wrong.', 'error')
		}
	}
}

export const editCustomer = (customerId, customerData) => {
	return async (dispatch) => {
		const body = JSON.stringify(customerData)
		const response = await apiRequest({ url: `/customers/update/${customerId}`, method: 'POST', body }, dispatch)
		if (response) {
			if (response.data.status) {
				swal('Good!', `${response.data.message}.`, 'success')
				dispatch(getAllData())
			} else {
				swal('Oops!', `${response.data.message}.`, 'error')
			}
		} else {
			console.log(response)
			swal('Oops!', 'Somthing went wrong with your network.', 'error')
		}
	}
}

// Delete Customer
export const deleteCustomer = (customerId) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/customers/delete/${customerId}`, method: 'GET' }, dispatch)
		if (response && response.data.status) {
			return response.data
		} else {
			console.log(response)
			swal('Oops!', response.data.message, 'error')
		}
	}
}


// Filtered Utility Transactions
export const getFilteredCustomerOrders = (orders, params) => {
	return async (dispatch) => {
		const { q = '', perPage = 10, page = 1 } = params
		/* eslint-enable */

		const filteredData = orders.filter(
			(order) => textMatches(order.orderNumber, q) || textMatches(moment(order.createdAt).format('lll'), q)
		)
		/* eslint-enable  */
		await dispatch({
			type: 'GET_CUSTOMER_ORDERS',
			data: paginateArray(filteredData, perPage, page),
			totalPages: filteredData.length,
			params,
		})
	}
}

// Filtered Books
export const getFilteredCustomerBooks = (books, params) => {
	return async (dispatch) => {
		const { q = '', perPage = 10, page = 1 } = params
		/* eslint-enable */

		const filteredData = books.filter((book) => textMatches(book.name, q))
		/* eslint-enable  */
		await dispatch({
			type: 'GET_CUSTOMER_ORDERS',
			data: paginateArray(filteredData, perPage, page),
			totalPages: filteredData.length,
			params,
		})
	}
}

// update customer status
export const updateCustomerStatus = (customerId, status) => {
	return async (dispatch) => {
		const body = JSON.stringify({ status })
		const response = await apiRequest({ url: `/customers/update/${customerId}`, method: 'POST', body }, dispatch)
		if (response) {
			console.log(response)
			if (response.data.status) {
				await dispatch(getAllData())
				await dispatch(getCustomerDetails(customerId))
				swal('Good!', `${response.data.message}.`, 'success')
			} else {
				swal('Oops!', `${response.data.message}.`, 'error')
			}
		} else {
			swal('Oops!', 'Something went wrong with your network.', 'error')
		}
	}
}

// deactivate User account
export const deactivateUser = (users, id) => {
	const user = users.find((i) => i.user_id === id)
	return async (dispatch) => {
		const response = await apiRequest({ url: `/admin/users/deactivate/${user.user_id}`, method: 'GET' }, dispatch)
		if (response) {
			if (response.data.success) {
				dispatch({
					type: 'GET_USER',
					selectedUser: { ...user, status: 'Inactive' },
				})
				swal('Good!', `${response.data.message}.`, 'success')
				dispatch(getAllData())
			} else {
				swal('Oops!', `${response.data.message}.`, 'error')
			}
		} else {
			swal('Oops!', 'Something went wrong with your network.', 'error')
		}
	}
}

//  Reset User Password
export const passwordReset = ({ user_id }) => {
	return async (dispatch) => {
		const body = JSON.stringify({ user_id })
		const response = await apiRequest({ url: `/admin/users/reset/`, method: 'POST', body }, dispatch)
		if (response && response.data.success) {
			swal('Good!', `User password reset Sucessfully.`, 'success')
		} else {
			console.log(response)
			swal('Oops!', 'Somthing went wrong with your network.', 'error')
		}
	}
}
