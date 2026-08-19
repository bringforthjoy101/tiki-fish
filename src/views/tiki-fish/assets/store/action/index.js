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

export const getAssets = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_ASSETS_LOADING', loading: true })
		const response = await apiRequest({ url: `/assets${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_ASSETS', data: response.data.data, params })
		} else {
			fail(response, 'Could not load the asset register.')
		}
		dispatch({ type: 'SET_ASSETS_LOADING', loading: false })
	}
}

// Capex that was paid for but never registered. This is migration 010's POST-CHECK query,
// which existed only as a comment nobody runs.
export const getUnregisteredCapex = () => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/assets/unregistered-capex', method: 'GET' }, dispatch)
		if (response && response.data?.status) dispatch({ type: 'GET_UNREGISTERED_CAPEX', data: response.data.data })
	}
}

export const createAsset = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/assets/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not add that asset.')
		return false
	}
}

export const updateAsset = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/assets/update/${id}`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not update that asset.')
		return false
	}
}

export const disposeAsset = (id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/assets/${id}/dispose`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not record that disposal.')
		return false
	}
}

export const deleteAsset = (id, reason) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/assets/${id}`, method: 'DELETE', body: JSON.stringify({ reason }) }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not remove that asset.')
		return false
	}
}

export const getAssetReference = () => {
	return async (dispatch) => {
		const [departments, categories, suppliers] = await Promise.all([
			apiRequest({ url: '/departments', method: 'GET' }, dispatch),
			apiRequest({ url: '/expense-categories', method: 'GET' }, dispatch),
			apiRequest({ url: '/suppliers', method: 'GET' }, dispatch),
		])
		dispatch({
			type: 'GET_ASSET_REFERENCE',
			data: {
				departments: departments?.data?.data || [],
				categories: categories?.data?.data || [],
				suppliers: suppliers?.data?.data || [],
			},
		})
	}
}
