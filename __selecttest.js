const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true })
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator
global.MutationObserver = dom.window.MutationObserver
const React = require('react'); const ReactDOM = require('react-dom')

// Mirrors ExpenseForm: value is a batch id that is NOT among the (draft-only) options.
const el = React.createElement('select', { value: 7, onChange: () => {}, id: 'productionBatchId' }, [
  React.createElement('option', { key: 'none', value: '' }, 'No — this is a general cost'),
  React.createElement('option', { key: 9, value: 9 }, 'BATCH-9 — 20 Aug'),
])
ReactDOM.render(el, document.getElementById('root'))
const s = document.getElementById('productionBatchId')
console.log('React state value : 7 (BATCH-7, since posted)')
console.log('selectedIndex     :', s.selectedIndex)
console.log('DOM select.value  :', JSON.stringify(s.value))
console.log('VISIBLE TO CLERK  :', JSON.stringify(s.options[s.selectedIndex] && s.options[s.selectedIndex].text))
