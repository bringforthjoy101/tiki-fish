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

export const getBatches = (params = {}) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_PRODUCTION_LOADING', loading: true })
		const response = await apiRequest({ url: `/batches${toQuery(params)}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_BATCHES', data: response.data.data, params })
		} else {
			fail(response, 'Could not load batches.')
		}
		dispatch({ type: 'SET_PRODUCTION_LOADING', loading: false })
	}
}

/** `quiet` refetches without the spinner, so saving a line does not tear the table down. */
export const getBatch = (id, { quiet = false } = {}) => {
	return async (dispatch) => {
		if (!quiet) dispatch({ type: 'SET_PRODUCTION_LOADING', loading: true })
		const response = await apiRequest({ url: `/batches/${id}`, method: 'GET' }, dispatch)
		if (!quiet) dispatch({ type: 'SET_PRODUCTION_LOADING', loading: false })
		if (response && response.data?.status) {
			dispatch({ type: 'GET_BATCH', data: response.data.data })
			return response.data.data
		}
		fail(response, 'Could not load that batch.')
		return null
	}
}

/**
 * What posting would do, without doing it.
 *
 * Refetched after every line change, because the split is the thing worth looking at before
 * it is committed — once posted the figures are snapshotted and the stock exists.
 */
export const getAllocationPreview = (id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${id}/allocation-preview`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_ALLOCATION_PREVIEW', data: response.data.data })
			return response.data.data
		}
		return null
	}
}

export const createBatch = (body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: '/batches/create', method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return response.data.data
		}
		fail(response, 'Could not open that batch.')
		return null
	}
}

export const saveBatchInput = (batchId, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${batchId}/inputs`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) return true
		fail(response, 'Could not save that input.')
		return false
	}
}

export const removeBatchInput = (batchId, inputId) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${batchId}/inputs/${inputId}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) return true
		fail(response, 'Could not remove that input.')
		return false
	}
}

export const saveBatchOutput = (batchId, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${batchId}/outputs`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) return true
		// The refusal worth reading: an output priced at zero would absorb none of the cost
		// and push all of it onto the other products.
		fail(response, 'Could not save that output.')
		return false
	}
}

export const removeBatchOutput = (batchId, outputId) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${batchId}/outputs/${outputId}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) return true
		fail(response, 'Could not remove that output.')
		return false
	}
}

/** acknowledgeNoConversionCost confirms there genuinely were no smokehouse expenses. */
export const postBatch = (id, acknowledgeNoConversionCost) => {
	return async (dispatch) => {
		const response = await apiRequest(
			{ url: `/batches/${id}/post`, method: 'POST', body: JSON.stringify({ acknowledgeNoConversionCost: Boolean(acknowledgeNoConversionCost) }) },
			dispatch
		)
		if (response && response.data?.status) {
			swal('Posted', response.data.message, 'success')
			return true
		}
		// Includes the shortfall refusal, which names the grade and both quantities.
		fail(response, 'Could not post that batch.')
		return false
	}
}

export const voidBatch = (id, reason) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `/batches/${id}/void`, method: 'POST', body: JSON.stringify({ reason }) }, dispatch)
		if (response && response.data?.status) {
			swal('Voided', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not void that batch.')
		return false
	}
}

export const getProductionReference = () => {
	return async (dispatch) => {
		const [departments, grades, products] = await Promise.all([
			apiRequest({ url: '/departments', method: 'GET' }, dispatch),
			apiRequest({ url: '/fish-grades', method: 'GET' }, dispatch),
			apiRequest({ url: '/products', method: 'GET' }, dispatch),
		])
		dispatch({
			type: 'GET_PRODUCTION_REFERENCE',
			data: {
				departments: departments?.data?.data || [],
				grades: grades?.data?.data || [],
				products: products?.data?.data || [],
			},
		})
	}
}
