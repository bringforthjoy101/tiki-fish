// ** Initial State
const initialState = {
  allData: [],
  data: [],
  total: 1,
  params: {},
  selectedSupplier: null,
  supplyHistory: []
}

const suppliers = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_ALL_SUPPLIER_DATA':
      return { ...state, allData: action.data }
    case 'GET_SUPPLIER_DATA':
      return {
        ...state,
        data: action.data,
        total: action.totalPages,
        params: action.params
      }
    case 'GET_SUPPLIER':
      return { ...state, selectedSupplier: action.selectedSupplier, supplyHistory: action.selectedSupplier.supplies }
    case 'ADD_SUPPLIER':
      return { ...state }
    case 'UPDATE_SUPPLIER':
      return { ...state }
    case 'DELETE_SUPPLIER':
      return { ...state }
    case 'GET_SUPPLIER_SUPPLY_HISTORY':
      return { ...state, supplyHistory: action.supplyHistory }
    default:
      return { ...state }
  }
}
export default suppliers 