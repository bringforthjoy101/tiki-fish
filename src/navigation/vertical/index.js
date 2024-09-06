// ** Navigation sections imports
import admins from './admins'
import customers from './customers.js'
import shop from './shop.js'
import dashboards from './dashboards'
import products from './products.js'
import orders from './orders'
import settlements from './settlements.js'
import reports from './reports.js'
import withdrawals from './withdrawals.js'
import transactions from './transactions.js'

const userData = JSON.parse(localStorage.getItem('userData'))

// ** Merge & Export
export default userData?.role === 'admin' ? [...dashboards, ...shop, ...products, ...orders, ...customers, ...admins, ...withdrawals, ...transactions, ...reports] : userData?.role === 'store' ? [...dashboards, ...shop, ...customers, ...withdrawals, ...transactions] : userData?.role === 'sales-rep' ? [...dashboards, ...shop, ...customers, ...orders, ...withdrawals, ...transactions, ...reports] : [...dashboards, ...shop, ...withdrawals]