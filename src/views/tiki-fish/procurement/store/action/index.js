import { apiRequest, swal } from '@utils'

const toQuery = (params = {}) => {
	const q = new URLSearchParams()
	Object.entries(params).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') q.append(k, v)
	})
	const s = q.toString()
	return s ? `?${s}` : ''
}

const fail = (response, fallback) =>
	swal('Oops!', response?.data?.message || response?.data?.errors?.[0]?.msg || fallback, 'error')

export const getFishPurchases = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_PROCUREMENT_LOADING', loading: true })
		const response = await apiRequest({ url: `/fish-purchases${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_FISH_PURCHASES', data: response.data.data, params })
		} else {
			fail(response, 'Could not load fish purchases.')
		}
		dispatch({ type: 'SET_PROCUREMENT_LOADING', loading: false })
	}
}

/**
 * `quiet` refetches without the spinner. Saving a line has to re-read the purchase to pick up
 * the recomputed totals, and flipping the loading flag would tear the table down mid-entry.
 */
export const getFishPurchase = (id, { quiet = false } = {}) => {
	return async (dispatch) => {
		if (!quiet) dispatch({ type: 'SET_PROCUREMENT_LOADING', loading: true })
		const response = await apiRequest({ url: `/fish-purchases/get-detail/${id}`, method: 'GET' }, dispatch)
		if (!quiet) dispatch({ type: 'SET_PROCUREMENT_LOADING', loading: false })
		if (response && response.data?.status) {
			dispatch({ type: 'GET_FISH_PURCHASE', data: response.data.data })
			return response.data.data
		}
		fail(response, 'Could not load that purchase.')
		return null
	}
}

export const createFishPurchase = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/fish-purchases/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return response.data.data
		}
		fail(response, 'Could not create that purchase.')
		return null
	}
}

export const updateFishPurchase = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/update/${id}`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not update that purchase.')
		return false
	}
}

export const savePurchaseLine = (purchaseId, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/${purchaseId}/lines`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) return true
		// The refusals here are the useful part: "nothing survives", "deductions exceed the
		// quantity delivered". Both name the numbers.
		fail(response, 'Could not save that line.')
		return false
	}
}

export const removePurchaseLine = (purchaseId, lineId) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/${purchaseId}/lines/${lineId}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) return true
		fail(response, 'Could not remove that line.')
		return false
	}
}

/** Puts net quantity into the stock ledger. Books no money. Cannot be undone. */
export const receiveFishPurchase = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/${id}/receive`, method: 'POST', body: JSON.stringify({}) }, dispatch)
		if (response && response.data?.status) {
			swal('Received', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not receive that purchase.')
		return false
	}
}

export const payFishPurchase = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/${id}/pay`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Recorded', response.data.message, 'success')
			return true
		}
		// Includes the overpayment refusal, which names the outstanding figure.
		fail(response, 'Could not record that payment.')
		return false
	}
}

export const deleteFishPurchase = (id, reason) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/${id}`, method: 'DELETE', body: JSON.stringify({ reason }) }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not remove that purchase.')
		return false
	}
}

export const getPurchaseSummary = (params = {}) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/summary${toQuery(params)}`, method: 'GET' }, dispatch)
		// Manager and above. A clerk gets 403, which is expected, not an error worth
		// interrupting them with.
		if (response && response.data?.status) dispatch({ type: 'GET_PURCHASE_SUMMARY', data: response.data.data })
	}
}

export const getFishCashOut = (params = {}) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/fish-purchases/cash-out${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) dispatch({ type: 'GET_FISH_CASH_OUT', data: response.data.data })
	}
}

export const getProcurementReference = () => {
	return async (dispatch) => {
		const [suppliers, departments, categories, grades, accounts] = await Promise.all([
			apiRequest({ url: '/suppliers', method: 'GET' }, dispatch),
			apiRequest({ url: '/departments', method: 'GET' }, dispatch),
			apiRequest({ url: '/expense-categories', method: 'GET' }, dispatch),
			apiRequest({ url: '/fish-grades', method: 'GET' }, dispatch),
			apiRequest({ url: '/payment-accounts', method: 'GET' }, dispatch),
		])
		dispatch({
			type: 'GET_PROCUREMENT_REFERENCE',
			data: {
				suppliers: suppliers?.data?.data || [],
				departments: departments?.data?.data || [],
				categories: categories?.data?.data || [],
				grades: grades?.data?.data || [],
				paymentAccounts: accounts?.data?.data || [],
			},
		})
	}
}
