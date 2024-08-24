// ** Navigation sections imports
import admins from './admins'
import customers from './customers.js'
import shop from './shop.js'
import dashboards from './dashboards'
import products from './products.js'
import orders from './orders'
import settlements from './settlements.js'
import reports from './reports.js'

const userData = JSON.parse(localStorage.getItem('userData'))

// ** Merge & Export
export default userData?.role === 'admin' ? [...dashboards, ...shop, ...products, ...orders, ...customers, ...admins, ...reports] : userData?.role === 'store' ? [...dashboards, ...shop, ...customers] : userData?.role === 'sales-rep' ? [...dashboards, ...shop, ...customers, ...orders, ...reports] : [...dashboards, ...shop]