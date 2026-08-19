import { apiRequest, swal } from '@utils'

const fail = (response, fallback) =>
	swal('Oops!', response?.data?.message || response?.data?.errors?.[0]?.msg || fallback, 'error')

/**
 * One set of thunks for every reference table.
 *
 * departments, expenseCategories, paymentAccounts, fishSpeciesGrades and packagingItems all
 * expose the same four routes in the same shape, so they get one implementation parameterised
 * by endpoint rather than five near-identical copies that drift.
 */
export const getReferenceList = (key, endpoint, includeInactive) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_REFERENCE_LOADING', key, loading: true })
		const response = await apiRequest({ url: `${endpoint}${includeInactive ? '?includeInactive=1' : ''}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_REFERENCE_LIST', key, data: response.data.data || [] })
		} else {
			fail(response, 'Could not load that list.')
		}
		dispatch({ type: 'SET_REFERENCE_LOADING', key, loading: false })
	}
}

export const createReferenceRow = (endpoint, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `${endpoint}/create`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not save that.')
		return false
	}
}

export const updateReferenceRow = (endpoint, id, body) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `${endpoint}/update/${id}`, method: 'POST', body: JSON.stringify(body) }, dispatch)
		if (response && response.data?.status) {
			swal('Great!', response.data.message, 'success')
			return true
		}
		fail(response, 'Could not update that.')
		return false
	}
}

export const deleteReferenceRow = (endpoint, id) => {
	return async (dispatch) => {
		const response = await apiRequest({ url: `${endpoint}/${id}`, method: 'DELETE' }, dispatch)
		if (response && response.data?.status) {
			swal('Done', response.data.message, 'success')
			return true
		}
		// The refusals here are the useful part: "mapped to 4 legacy name(s)", "is a system
		// grade". Both tell the owner to deactivate instead, which is what they should do.
		fail(response, 'Could not remove that.')
		return false
	}
}

/** The mapping worklist. sync=1 pulls in any supplies.name string not yet listed. */
export const getGradeAliases = (sync) => {
	return async (dispatch) => {
		dispatch({ type: 'SET_REFERENCE_LOADING', key: 'aliases', loading: true })
		const response = await apiRequest({ url: `/fish-grades/aliases${sync ? '?sync=1' : ''}`, method: 'GET' }, dispatch)
		if (response && response.data?.status) {
			dispatch({ type: 'GET_GRADE_ALIASES', data: response.data.data })
			if (sync && response.data.data.added) {
				swal('Refreshed', `${response.data.data.added} new name(s) found in supplies.`, 'success')
			}
		} else {
			fail(response, 'Could not load the name mapping.')
		}
		dispatch({ type: 'SET_REFERENCE_LOADING', key: 'aliases', loading: false })
	}
}

/** speciesGradeId null is a decision, not a blank: it records "reviewed, and not fish". */
export const mapGradeAlias = (id, speciesGradeId) => {
	return async (dispatch) => {
		const response = await apiRequest(
			{ url: `/fish-grades/aliases/${id}`, method: 'POST', body: JSON.stringify({ speciesGradeId: speciesGradeId || null }) },
			dispatch
		)
		if (response && response.data?.status) return true
		fail(response, 'Could not save that mapping.')
		return false
	}
}
