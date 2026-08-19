import { apiRequest, swal } from '@utils'

// Same shape as the expenses store: only send filters that are set, so an untouched filter
// bar produces `/workers` rather than a URL of empty parameters the API has to ignore.
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

/* ------------------------------------------------------------------ workers */

export const getWorkers = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: true })
		const response = await apiRequest({ url: `/workers${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			// payVisible comes from the server, which decides it from the capability - the
			// screen must not infer it from the local capability list, or a stale token would
			// have it render columns the API never sent.
			dispatch({ type: 'GET_WORKERS', data: response.data.data, params })
		} else {
			fail(response, 'Could not load the worker register.')
		}
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: false })
	}
}

export const createWorker = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/workers/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not add that worker.')
		return false
	}
}

export const updateWorker = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/workers/update/${id}`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not update that worker.')
		return false
	}
}

export const deleteWorker = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/workers/${id}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		// The refusal for a worker who appears on a pay run is the useful message here - it
		// names the number of runs and tells you to set them inactive instead.
		fail(response, 'Could not remove that worker.')
		return false
	}
}

/* ----------------------------------------------------------------- pay runs */

export const getPayRuns = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: true })
		const response = await apiRequest({ url: `/pay-runs${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_PAY_RUNS', data: response.data.data || [], params })
		} else {
			fail(response, 'Could not load pay runs.')
		}
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: false })
	}
}

/**
 * `quiet` refetches without touching the loading flag. Saving a line has to re-read the run
 * to pick up the rebuilt month split, and flipping the spinner would unmount the amount
 * inputs mid-entry and throw away the clerk's focus on the next row.
 */
export const getPayRun = (id, { quiet = false } = {}) => {
	return async (dispatch) => {
		if (!quiet) dispatch({ type: 'SET_PAYROLL_LOADING', loading: true })
		const response = await apiRequest({ url: `/pay-runs/${id}`, method: 'GET' }, dispatch)
		if (!quiet) dispatch({ type: 'SET_PAYROLL_LOADING', loading: false })
		if (response && response.data?.status) {
			dispatch({ type: 'GET_PAY_RUN', data: response.data.data })
			return response.data.data
		}
		fail(response, 'Could not load that pay run.')
		return null
	}
}

export const createPayRun = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/pay-runs/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return response.data.data
		}
		// Two refusals worth reading verbatim: "a weekly run starts on a Monday" names the
		// Monday, and the clash message names the reference of the run already covering it.
		fail(response, 'Could not open that pay run.')
		return null
	}
}

/**
 * The amount is passed through exactly as given - no `|| 0` fallback. Coercing an
 * unparseable value to zero here would reintroduce on the client the very thing the API was
 * fixed to refuse: a line silently set to nothing, and a worker who quietly does not get
 * paid. An amount the API cannot read comes back as an error the person can see.
 */
export const updatePayRunItem = (itemId, body) => {
	return async (dispatch) => {
		const response = await apiRequest(
			{ url: `/pay-runs/items/${itemId}`, method: 'POST', body: JSON.stringify(body) },
			dispatch
		)
		if (response && response.data?.status) return true
		fail(response, 'Could not save that line.')
		return false
	}
}

export const removePayRunItem = (itemId) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/pay-runs/items/${itemId}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) return true
		fail(response, 'Could not remove that line.')
		return false
	}
}

export const approvePayRun = (id, paymentAccountId) => {
	return async (dispatch) => {
		const response = await apiRequest(
			{ url: `/pay-runs/${id}/approve`, method: 'POST', body: JSON.stringify({ paymentAccountId: paymentAccountId || null }) },
			dispatch
		)
		if (response && response.data?.status) {
			swal('Approved', response.data.message, 'success')
			return true
		}
		// Includes the reconciliation refusal - "line N does not reconcile" - which is the one
		// message nobody should ever see, and the one they must read if they do.
		fail(response, 'Could not approve that pay run.')
		return false
	}
}

/* -------------------------------------------------------------- staff cost */

export const getStaffCost = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: true })
		const response = await apiRequest({ url: `/payroll/staff-cost${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_STAFF_COST', data: response.data.data, params })
		} else {
			fail(response, 'Could not load staff cost.')
		}
		dispatch({ type: 'SET_PAYROLL_LOADING', loading: false })
	}
}

/* --------------------------------------------------------------- reference */

// Departments for the register, payment accounts for approval. Payment accounts are
// owner-only, so a manager gets 403 there; that is expected and must not raise an alert on a
// screen that otherwise works.
export const getPayrollReference = () => {
	return async (dispatch) => {
		const [departments, accounts] = await Promise.all([
			apiRequest({ url: '/departments', method: 'GET' }, dispatch),
			apiRequest({ url: '/payment-accounts', method: 'GET' }, dispatch),
		])
		dispatch({
			type: 'GET_PAYROLL_REFERENCE',
			data: {
				departments: departments?.data?.data || [],
				paymentAccounts: accounts?.data?.data || [],
			},
		})
	}
}
