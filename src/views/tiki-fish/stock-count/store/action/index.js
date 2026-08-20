import { apiRequest, swal } from '@utils'

export const getStockCounts = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'STOCK_COUNT_LOADING', loading: true })
		const search = new URLSearchParams()
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') search.append(k, v)
		})
		const q = search.toString()
		const response = await apiRequest({ url: `/stock-counts${q ? `?${q}` : ''}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_STOCK_COUNTS', counts: response.data.data || [] })
		} else {
			dispatch({ type: 'STOCK_COUNT_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load counts.', 'error')
		}
	}
}

// `quiet` exists so saving a single line can refresh the sheet without flashing a spinner over
// a screen somebody is typing into.
export const getStockCount = (id, { quiet = false } = {}) => {
	return async (dispatch) => {
		if (!quiet) dispatch({ type: 'STOCK_COUNT_LOADING', loading: true })
		const response = await apiRequest({ url: `/stock-counts/${id}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({
				type: 'GET_STOCK_COUNT',
				count: response.data.data.count,
				lines: response.data.data.lines || [],
				totals: response.data.data.totals || {},
			})
		} else {
			dispatch({ type: 'STOCK_COUNT_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the count.', 'error')
		}
	}
}

export const createStockCount = (payload) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/stock-counts/create', method: 'POST', body: JSON.stringify(payload) }, dispatch)
		if (response?.data?.status) return response.data.data
		const validation = response?.data?.errors?.map((e) => e.msg).join(', ')
		swal('Oops!', validation || response?.data?.message || 'Could not open the count.', 'error')
		return null
	}
}

export const populateStockCount = (id, ledgers) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/stock-counts/${id}/populate`, method: 'POST', body: JSON.stringify({ ledgers }) }, dispatch)
		if (response?.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		swal('Oops!', response?.data?.message || 'Could not build the sheet.', 'error')
		return false
	}
}

// Returns the server's recomputed figures rather than true/false: the book quantity is
// re-snapshotted on save, so the row has to show what the server actually stored, not what the
// browser assumed.
export const saveCountLine = (id, lineId, payload) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/stock-counts/${id}/lines/${lineId}`, method: 'POST', body: JSON.stringify(payload) }, dispatch)
		if (response?.data?.status) return response.data.data
		const validation = response?.data?.errors?.map((e) => e.msg).join(', ')
		swal('Oops!', validation || response?.data?.message || 'Could not save that line.', 'error')
		return null
	}
}

export const postStockCount = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/stock-counts/${id}/post`, method: 'POST', body: JSON.stringify({}) }, dispatch)
		if (response?.data?.status) {
			swal('Posted', response.data.message, 'success')
			return true
		}
		swal('Not posted', response?.data?.message || 'Could not post the count.', 'error')
		return false
	}
}

export const cancelStockCount = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/stock-counts/${id}/cancel`, method: 'POST', body: JSON.stringify({}) }, dispatch)
		if (response?.data?.status) {
			swal('Cancelled', response.data.message, 'success')
			return true
		}
		swal('Oops!', response?.data?.message || 'Could not cancel.', 'error')
		return false
	}
}
