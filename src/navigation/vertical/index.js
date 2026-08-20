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
import wallets from './wallets.js'
import investments from './investments.js'
import suppliers from './suppliers.js'
import expenses from './expenses.js'
import buildPayrollSection from './payroll.js'
import procurement from './procurement.js'
import production from './production.js'
import assets from './assets.js'
import reference from './reference.js'
import { getCapabilities } from '@src/utility/capabilities'

// Menus are built from the capabilities GET /me returned, not from `role`.
//
// The previous version branched on role alone and hardcoded which menu sections each of the
// three roles saw. It could not express "this admin may enter expenses but not see payroll",
// and it drifted the moment a capability changed on the server. It also had no branch for
// the finance axis at all, because that axis did not exist yet.
//
// This decides only what is rendered. Every route behind these entries is enforced
// server-side by requireCapability(), so a wrong guess here hides a link rather than opening
// anything. If a menu item is missing after a role change, the fix is to sign in again -
// capabilities are read from storage, and GET /me refreshes them at login.
// Built on every call, NOT once at module load. The menu has to reflect the capabilities the
// browser holds right now: they arrive after login, and App.js refreshes them from GET /me on
// every app load so a session that predates them, or a role changed on the server, repairs
// itself without anyone being told to sign in again.
const buildMenu = () => {
const held = new Set(getCapabilities())
const anyOf = (...caps) => caps.some((c) => held.has(c))

const menu = []

// Every signed-in admin has dashboard.read on at least one axis.
menu.push(...dashboards)

// The finance module. A clerk holds expenses.create and nothing else; a manager also reads
// everything. Placed high because for the clerk it is the only screen they use.
if (anyOf('expenses.create', 'expenses.readOwn', 'expenses.readAll')) menu.push(...expenses)

// Payroll sits with the finance module and builds its own children per capability - a
// manager sees the register and the departmental totals, never the runs.
if (anyOf('workers.read', 'workers.readPay', 'payroll.read', 'payroll.readStaffCostSummary')) menu.push(...buildPayrollSection())

if (anyOf('orders.read', 'orders.create')) menu.push(...shop, ...orders)
if (anyOf('products.read', 'products.manage')) menu.push(...products)
if (anyOf('customers.read')) menu.push(...customers)
if (anyOf('suppliers.read', 'supplies.read')) menu.push(...suppliers)
if (anyOf('investments.read')) menu.push(...investments)
if (anyOf('admins.read')) menu.push(...admins)
if (anyOf('settlements.read')) menu.push(...settlements)

// The legacy ledger. Read-only history: its create, fund, update and delete routes now
// return 410, and every withdrawal has been migrated into `expenses`.
if (anyOf('wallets.read', 'withdrawals.read')) menu.push(...withdrawals, ...transactions, ...wallets)

if (anyOf('fishPurchases.create', 'fishPurchases.readOwn', 'fishPurchases.readAll')) menu.push(...procurement)
if (anyOf('batches.read', 'batches.create')) menu.push(...production)
if (anyOf('assets.read')) menu.push(...assets)

// Reference data. Anyone who can read a master sees the screen; each tab gates its own edit
// controls, and a tab whose read capability is missing is not rendered at all.
const holdsAnyMaster = anyOf('fishGrades.read', 'packagingItems.read', 'departments.read', 'expenseCategories.read', 'paymentAccounts.read')
if (holdsAnyMaster) menu.push(...reference)

if (anyOf('reports.operations', 'reports.pnl')) menu.push(...reports)

return menu
}

export default buildMenu
