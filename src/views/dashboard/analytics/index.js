import { useContext, useState, useEffect } from 'react'
import { apiRequest, swal, kFormatter, isUserLoggedIn } from '@utils'
import { ThemeColors } from '@src/utility/context/ThemeColors'
import { Row, Col, Spinner } from 'reactstrap'
import ContactsCount from '@src/views/ui-elements/cards/statistics/ContactsCountInfo'
import CardCongratulations from '@src/views/ui-elements/cards/advance/CardCongratulations'
import StatsCard from '@src/views/ui-elements/cards/statistics/StatsCard'
import StatsVertical from '@components/widgets/stats/StatsVertical'
import { DollarSign, Eye, TrendingUp } from 'react-feather'

import '@styles/react/libs/charts/apex-charts.scss'

const AnalyticsDashboard = () => {
	const { colors } = useContext(ThemeColors)

	const [userData, setUserData] = useState(null)
	const [dashData, setDashData] = useState({})

	useEffect(() => {
		if (isUserLoggedIn) {
			setUserData(JSON.parse(localStorage.getItem('userData')))
		}
	}, [])

	// ** Get all Dashboard Data
	const dashboardData = async () => {
		const response = await apiRequest({ url: '/dashboard', method: 'GET' })
		if (response) {
			if (response?.data?.data && response?.data?.status) {
				await setDashData(response.data.data)
			} else {
				console.log(response.error)
			}
		} else {
			swal('Oops!', 'Somthing went wrong with your network.', 'error')
		}
	}

	// ** Get admin activities
	useEffect(() => {
		dashboardData()
	}, [])

	// Renders a naira figure, or a spinner while the dashboard is still loading.
	// Deliberately distinguishes "not loaded yet" from a genuine zero: the previous tiles
	// used a truthiness check, so a real ₦0 rendered as a spinner that never resolved.
	const money = (value) => {
		if (value === undefined || value === null) return <Spinner className="mr-25" size="sm" />
		return Number(value).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
	}

	// The figure is shown even when the cost side is short — the owner asked for that. What must
	// NOT happen is showing it bare: 10 of 25 months have no recorded spending, holding 44% of
	// all revenue, so the all-time figure reads about +NGN 19.9m where the truth is nearer
	// -NGN 382m. The caveat below the tile is the only thing standing between those two numbers.
	const provisional = dashData?.departments?.netProfitProvisional
	const netProfitStat = money(dashData?.departments?.netProfit)

	const numFormatter = (num) => {
		if (num > 999 && num < 1000000) {
			return `${(num / 1000).toFixed(2)}K`
		} else if (num > 1000000) {
			return `${(num / 1000000).toFixed(2)}M`
		} else if (num < 900) {
			return num
		}
	}

	console.log({ dashData })
	return (
		<div id="dashboard-analytics">
			<Row className="match-height">
				<Col lg="5" md="6" sm="12">
					<CardCongratulations userData={userData} />
				</Col>
				<Col lg="7" md="6" sm="12">
					{dashData.sales ? <StatsCard cols={{ xl: '4', sm: '6' }} statsData={dashData?.sales.topSelling} /> : <Spinner className="mr-25" size="l" />}
				</Col>
			</Row>
			{/*
			  These six tiles used to render the SALES / LOGISTICS / PACKAGING / PROFIT /
			  SMOKE_HOUSE wallet balances. Those balances stopped moving on 2 April 2026 when
			  order completion stopped booking to the ledger, and they are additionally
			  overstated by historical double-bookings (SALES by roughly 57%). They were shown
			  here with no indication of either problem.

			  These now render `dashData.departments`, recomputed by the API directly from
			  completed and delivered orders. The wallet figures are still in the API response
			  for the legacy ledger screen, flagged with walletsStale / walletsAsOf.
			*/}
			<Row className="match-height">
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="success"
						stats={money(dashData?.departments?.revenue)}
						statTitle="Revenue Earned"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="success"
						stats={netProfitStat}
						statTitle={provisional ? 'Net Profit — incomplete costs' : 'Net Profit'}
					/>
					{/* Shown with the figure, never instead of it. Without this line the number
					    reads as a measurement rather than an estimate over missing months. */}
					{provisional && (
						<small className="text-warning d-block mt-n1 mb-1 px-1">{dashData?.departments?.coverage}</small>
					)}
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="warning"
						stats={money(dashData?.departments?.costOfGoods)}
						statTitle="Cost of Goods Sold"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="info"
						stats={money(dashData?.departments?.logistics)}
						statTitle="Logistics Recovered"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="info"
						stats={money(dashData?.departments?.packaging)}
						statTitle="Packaging Recovered"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<DollarSign size={21} />}
						color="info"
						stats={money(dashData?.departments?.smokeHouse)}
						statTitle="Smokehouse Recovered"
					/>
				</Col>
			</Row>
			<Row className="match-height">
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.stock ? Number(dashData?.stock.stockVolume).toLocaleString() : <Spinner className="mr-25" size="s" />}
						statTitle="Total Stocks Available"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.stock.stockValue)}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Available Stocks"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.stock.stockProfit)}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Available Stocks Profits"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.smokeHouseAvailableStock)}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Available Stocks - Smoke House"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.profitToday)}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Profit Today"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.totalProfit?.toFixed(0))}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Profit So Far"
					/>
				</Col>
			</Row>
			<Row className="match-height">
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesToday) || 0}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Today"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesYesterday) || 0}` : <Spinner className="mr-25" size="sm" />}
						statTitle="Yesterday"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesThisWeek) || 0}` : <Spinner className="mr-25" size="sm" />}
						statTitle="This Week"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesThisMonth) || 0}` : <Spinner className="mr-25" size="sm" />}
						statTitle="This Month"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesThisYear) || 0}` : <Spinner className="mr-25" size="sm" />}
						statTitle="This Year"
					/>
				</Col>
				<Col xl="4" md="6" sm="12">
					<StatsVertical
						icon={<TrendingUp size={21} />}
						color="primary"
						stats={dashData.sales ? `₦${numFormatter(dashData.sales?.salesSoFar.toFixed(0))}` : <Spinner className="mr-25" size="sm" />}
						statTitle="So Far"
					/>
				</Col>
			</Row>
		</div>
	)
}

export default AnalyticsDashboard
