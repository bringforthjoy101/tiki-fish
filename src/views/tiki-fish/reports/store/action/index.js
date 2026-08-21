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
