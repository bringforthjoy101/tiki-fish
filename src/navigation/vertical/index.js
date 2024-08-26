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

const userData = JSON.parse(localStorage.getItem('userData'))

// ** Merge & Export
export default userData?.role === 'admin' ? [...dashboards, ...shop, ...products, ...orders, ...customers, ...admins, ...withdrawals, ...reports] : userData?.role === 'store' ? [...dashboards, ...shop, ...customers, ...withdrawals] : userData?.role === 'sales-rep' ? [...dashboards, ...shop, ...customers, ...orders, ...withdrawals, ...reports] : [...dashboards, ...shop, ...withdrawals]