import { apiRequest, swal } from '@utils'

// Only send the filters that are actually set, so an empty filter bar produces a clean
// `/expenses` rather than a URL full of `&categoryId=` that the API then has to ignore.
const toQuery = (params = {}) => {
	const q = new URLSearchParams()
	Object.entries(params).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') q.append(k, v)
	})
	const s = q.toString()
	return s ? `?${s}` : ''
}

export const getExpenses = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_EXPENSES_LOADING', loading: true })
		const response = await apiRequest({ url: `/expenses${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_EXPENSES', data: response.data.data, params })
		} else {
			swal('Oops!', response?.data?.message || 'Something went wrong.', 'error')
		}
		dispatch({ type: 'SET_EXPENSES_LOADING', loading: false })
	}
}

export const getExpenseSummary = (params = {}) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/expenses/summary${toQuery(params)}`, method: 'GET' }, dispatch)
		// Summary is manager-and-above. A clerk gets 403 here, which is expected, not an error
		// worth interrupting them with - the list above still works.
		if (response && response.data?.status) dispatch({ type: 'GET_EXPENSE_SUMMARY', data: response.data.data })
	}
}

export const getExpense = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/expenses/get-detail/${id}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_EXPENSE', data: response.data.data.expense, history: response.data.data.history })
			return response.data.data
		}
		swal('Oops!', response?.data?.message || 'Could not load that expense.', 'error')
		return null
	}
}

export const createExpense = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/expenses/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		// The API returns real messages worth showing: a back-dating refusal names the number
		// of days and tells the clerk to ask a manager. Swallowing that for a generic "went
		// wrong" is how people stop trusting the form.
		swal('Oops!', response?.data?.message || response?.data?.errors?.[0]?.msg || 'Could not save that expense.', 'error')
		return false
	}
}

export const updateExpense = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/expenses/update/${id}`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		swal('Oops!', response?.data?.message || 'Could not update that expense.', 'error')
		return false
	}
}

export const deleteExpense = (id, reason) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/expenses/${id}`, method: 'DELETE', body: JSON.stringify({ reason }) }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		swal('Oops!', response?.data?.message || 'Could not remove that expense.', 'error')
		return false
	}
}

export const restoreExpense = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/expenses/restore/${id}`, method: 'POST', body: JSON.stringify({}) }, dispatch)
		if (response && response.data?.status) {
			swal('Restored', response.data.message, 'success')
			return true
		}
		swal('Oops!', response?.data?.message || 'Could not restore that expense.', 'error')
		return false
	}
}

// Reference data drives the entry form. Fetched once and held, because it changes rarely and
// the form is the screen people open most.
export const getReferenceData = () => {
	return async (dispatch) => {
		const [departments, categories, accounts, suppliers, batches] = await Promise.all([
			apiRequest({ url: '/departments', method: 'GET' }, dispatch),
			apiRequest({ url: '/expense-categories', method: 'GET' }, dispatch),
			apiRequest({ url: '/payment-accounts', method: 'GET' }, dispatch),
			apiRequest({ url: '/suppliers', method: 'GET' }, dispatch),
			// Drafts only, matching what the API will accept. A posted batch froze its cost when
			// it posted, so tagging one now would look counted and change nothing — createExpense
			// refuses it by name. Offering it here would just produce that error later.
			apiRequest({ url: '/batches?status=draft', method: 'GET' }, dispatch),
		])
		dispatch({
			type: 'GET_EXPENSE_REFERENCE',
			data: {
				departments: departments?.data?.data || [],
				categories: categories?.data?.data || [],
				paymentAccounts: accounts?.data?.data || [],
				suppliers: suppliers?.data?.data || [],
				draftBatches: batches?.data?.data?.batches || [],
			},
		})
	}
}
