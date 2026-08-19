import { Sliders } from 'react-feather'

// The reference-data screen. Reads are broad; the tabs inside gate their own edit buttons on
// the matching *.manage capability, so a clerk who can see a dropdown's contents still cannot
// change them.
export default [
	{
		id: 'reference',
		title: 'Reference data',
		icon: <Sliders size={20} />,
		navLink: '/reference',
	},
]
