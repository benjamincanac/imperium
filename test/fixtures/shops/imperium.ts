import imperium from '../../../src'
import db from './db'

imperium.role('admin', (req) => {
	const userId: number = parseInt(req.headers.userid, 10)
	const user: any = db.users[userId]

	return user.role === 'admin'
})

imperium.role('userOwner', (req) => {
	const userId: number = parseInt(req.headers.userid, 10)
	const user: any = db.users[userId]

	return { user: user._id.toString() }
})

imperium.role('shopOwner', (req) => {
	const userId: number = parseInt(req.headers.userid, 10)
	const user: any = db.users[userId]
	// const shopId: number = parseInt(req.query.shopId || req.params.shopId, 10)

	// if (isNaN(shopId)) return false

	// const shop: any = db.shops[shopId]

	// if (shop.owners.indexOf(userId) !== -1) return { shop: shop._id.toString() }

	return { shop: user.shop }
})

imperium.role('userOwner')
	.can('seeOrder', { user: '@' })

imperium.role('shopOwner')
	.can('seeShop', { shop: '@' })
	.can('manageShop', { shop: '@shop' })
	.can('seeOrder', { shop: '@' })

imperium.role('admin')
	.is('userOwner', { user: '*' })
	.is('shopOwner', { shop: '*' })
	.can('addShop')

export default imperium
