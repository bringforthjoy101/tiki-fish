import { apiRequest, swal } from '@utils'

// Stock on hand for the fish and packaging ledgers. Until now the only way to see a ledger
// balance was to open a draft production batch and read one grade at a time; packaging had no
// reader at all.
export const getStockOnHand = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'INVENTORY_LOADING', loading: true })
		const search = new URLSearchParams()
		if (params.ledger) search.append('ledger', params.ledger)
		if (params.asAt) search.append('asAt', params.asAt)
		const query = search.toString()

		const response = await apiRequest({ url: `/inventory/stock-on-hand${query ? `?${query}` : ''}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({
				type: 'GET_STOCK_ON_HAND',
				lines: response.data.data.lines || [],
				totals: response.data.data.totals || {},
				asAt: response.data.data.asAt,
				// The server strips valuation for anyone without inventory.readValuation, so the
				// screen must be told whether the columns exist rather than inferring it from a
				// missing field, which would look identical to stock worth nothing.
				showValue: Boolean(response.data.data.showValue),
			})
		} else {
			dispatch({ type: 'INVENTORY_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load stock on hand.', 'error')
		}
	}
}

export const getMovements = (params = {}) => {
	return async (dispatch) => {
		const search = new URLSearchParams()
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') search.append(key, value)
		})
		const query = search.toString()
		const response = await apiRequest({ url: `/inventory/movements${query ? `?${query}` : ''}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_INVENTORY_MOVEMENTS', movements: response.data.data || [] })
			return response.data.data
		}
		swal('Oops!', response?.data?.message || 'Could not load movements.', 'error')
		return null
	}
}

// Returns true/false rather than throwing, so the caller can keep the modal open on failure and
// the operator does not lose what they keyed.
export const adjustStock = (payload) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/inventory/adjust', method: 'POST', body: JSON.stringify(payload) }, dispatch)
		if (response?.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		const validation = response?.data?.errors?.map((e) => e.msg).join(', ')
		swal('Oops!', validation || response?.data?.message || 'Could not post the adjustment.', 'error')
		return false
	}
}
