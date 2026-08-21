import { apiRequest, swal } from '@utils'

const qs = (params = {}) => {
	const search = new URLSearchParams()
	Object.entries(params).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') search.append(k, v)
	})
	const s = search.toString()
	return s ? `?${s}` : ''
}

export const getProfitAndLoss = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/pnl${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_PNL', pnl: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the report.', 'error')
		}
	}
}

export const getRestatement = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/restatement${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_RESTATEMENT', restatement: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the restatement.', 'error')
		}
	}
}

export const getProcurementReport = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/procurement${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_PROCUREMENT_REPORT', procurement: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the procurement report.', 'error')
		}
	}
}

export const getSalesReport = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/sales${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_SALES_REPORT', sales: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the sales report.', 'error')
		}
	}
}

export const getDepartments = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/departments${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_DEPARTMENTS_REPORT', departments: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the departmental report.', 'error')
		}
	}
}

/**
 * Freeze the report currently on screen.
 *
 * The server re-runs the report rather than accepting figures from the browser. A snapshot the
 * client could supply the numbers for would be worth nothing as evidence.
 */
export const createSnapshot = (body) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_SAVING', saving: true })
		const response = await apiRequest({ url: '/reports/snapshots', method: 'POST', body: JSON.stringify(body) }, dispatch)
		dispatch({ type: 'REPORTS_SAVING', saving: false })
		if (response?.data?.status) {
			swal('Saved', response.data.message, 'success')
			return response.data.data
		}
		swal('Oops!', response?.data?.message || 'The report could not be saved.', 'error')
		return null
	}
}

export const getSnapshots = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/snapshots${qs(params)}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_SNAPSHOTS', snapshots: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load the saved reports.', 'error')
		}
	}
}

export const getSnapshot = (id) => {
	return async (dispatch) => {
		dispatch({ type: 'REPORTS_LOADING', loading: true })
		const response = await apiRequest({ url: `/reports/snapshots/${id}`, method: 'GET' }, dispatch)
		if (response?.data?.status) {
			dispatch({ type: 'GET_SNAPSHOT', snapshot: response.data.data })
		} else {
			dispatch({ type: 'REPORTS_LOADING', loading: false })
			swal('Oops!', response?.data?.message || 'Could not load that saved report.', 'error')
		}
	}
}

export const clearSnapshot = () => (dispatch) => dispatch({ type: 'GET_SNAPSHOT', snapshot: null })
