const imperium = require('../../../lib')
const db = require('./db')

imperium.role('admin', (req) => {
	const userId = parseInt(req.headers.userid)
	const user = db.users[userId]

	return user.role === 'admin'
})

imperium.role('userOwner', (req) => {
	const userId = parseInt(req.headers.userid)
	const user = db.users[userId]

	return { user: String(user._id) }
})

imperium.role('shopOwner', (req) => {
	const userId = parseInt(req.headers.userid)
	const user = db.users[userId]
	// const shopId = parseInt(req.query.shopId || req.params.shopId)

	// if (isNaN(shopId)) return false

	// const shop = db.shops[shopId]

	// if (shop.owners.indexOf(userId) !== -1) return { shop: String(shop._id) }

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

module.exports = imperium
