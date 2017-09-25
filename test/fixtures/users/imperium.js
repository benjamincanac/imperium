const imperium = require('../../../lib')
const db = require('./db')

imperium.role('admin', (req) => {
	return new Promise((resolve) => {
		const userId = parseInt(req.headers.userid)
		const user = db.users[userId]

		resolve(user.role === 'admin')
	})
})

imperium.role('moderator', (req) => {
	return new Promise((resolve) => {
		const userId = parseInt(req.headers.userid)
		const user = db.users[userId]

		resolve(user.role === 'moderator')
	})
})

imperium.role('user', (req) => {
	return new Promise((resolve) => {
		const userId = parseInt(req.headers.userid)
		const user = db.users[userId]

		resolve({ user: String(user._id) })
	})
})

imperium.role('user')
	.can('seeUser', { user: '@' })
	.can('manageUser', { user: '@' })

imperium.role('admin')
	.is('user', { user: '*' })

module.exports = imperium
