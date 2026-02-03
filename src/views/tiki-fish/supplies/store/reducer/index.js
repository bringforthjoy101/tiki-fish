// ** Initial State
const initialState = {
  allData: [],
  data: [],
  total: 1,
  params: {},
  summary: null,
  suppliers: [],
  loading: false
}

const supplies = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_ALL_SUPPLIES_DATA':
      return { ...state, allData: action.data }
    case 'GET_SUPPLIES_DATA':
      return {
        ...state,
        data: action.data,
        total: action.totalPages,
        params: action.params
      }
    case 'GET_SUPPLIES_SUMMARY':
      return { ...state, summary: action.summary }
    case 'GET_SUPPLIERS_FOR_FILTER':
      return { ...state, suppliers: action.suppliers }
    case 'UPDATE_SUPPLY_PAYMENT':
      return {
        ...state,
        allData: state.allData.map(supply => (
          supply.id === action.supply.id ? { ...supply, ...action.supply } : supply
        )),
        data: state.data.map(supply => (
          supply.id === action.supply.id ? { ...supply, ...action.supply } : supply
        ))
      }
    case 'SET_SUPPLIES_LOADING':
      return { ...state, loading: action.loading }
    default:
      return { ...state }
  }
}

export default supplies
