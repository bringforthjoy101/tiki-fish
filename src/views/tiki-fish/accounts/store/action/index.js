import { apiRequest, swal } from '@utils'

// The derived cash position. Balances are opening balance + the sum of movements — never a
// stored figure — which is why this is a read of an aggregate rather than a column.
export const getAccountBalances = () => {
	return async (dispatch) => {
		dispatch({ type: 'ACCOUNTS_LOADING', loading: true })
		const response = await apiRequest({ url: '/payment-accounts/balances', method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({
				type: 'GET_ACCOUNT_BALANCES',
				accounts: response.data.data.accounts || [],
				cashPosition: response.data.data.cashPosition,
				// The API says plainly whether money coming IN is tracked. Orders carry no
				// paymentAccountId yet, so today it is false and the screen must not present the
				// total as the full cash position.
				inflowTracked: Boolean(response.data.data.inflowTracked),
			})
		} else {
			dispatch({ type: 'ACCOUNTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load balances.', 'error')
		}
	}
}

export const getAccountMovements = (id, params = {}) => {
	return async (dispatch) => {
		const search = new URLSearchParams()
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') search.append(k, v)
		})
		const q = search.toString()

		// Clear FIRST. The movements list is keyed on nothing, so a failed or slow fetch would
		// otherwise leave the previous account's transactions on screen under the new account's
		// name — the worst kind of wrong, because it looks like an answer.
		dispatch({ type: 'GET_ACCOUNT_MOVEMENTS', movements: [], pagination: {} })

		const response = await apiRequest({ url: `/payment-accounts/${id}/movements${q ? `?${q}` : ''}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({
				type: 'GET_ACCOUNT_MOVEMENTS',
				movements: response.data.data.movements || [],
				pagination: response.data.data.pagination || {},
			})
			return response.data.data.movements || []
		}
		swal('Oops!', response?.data?.message || 'Could not load movements.', 'error')
		return null
	}
}

// Stating what was in an account on a given day. This is the figure every balance is built on
// top of, so it is deliberately a separate action from funding: one says what was already
// there, the other records money moving.
export const setOpeningBalance = (id, payload) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/payment-accounts/${id}/opening-balance`, method: 'POST', body: JSON.stringify(payload) }, dispatch)
		if (response?.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		const validation = response?.data?.errors?.map((e) => e.msg).join(', ')
		swal('Oops!', validation || response?.data?.message || 'Could not set the opening balance.', 'error')
		return false
	}
}

// Signed: a positive amount puts money in, a negative takes it out, and both land in the same
// ledger. The screen asks for a direction and a positive number rather than expecting somebody
// to type a minus sign.
export const fundAccount = (id, payload) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/payment-accounts/${id}/fund`, method: 'POST', body: JSON.stringify(payload) }, dispatch)
		if (response?.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		const validation = response?.data?.errors?.map((e) => e.msg).join(', ')
		swal('Oops!', validation || response?.data?.message || 'Could not record that.', 'error')
		return false
	}
}
