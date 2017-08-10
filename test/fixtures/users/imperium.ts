import imperium from '../../../src'
import db from './db'

imperium.role('admin', (req) => {
	return new Promise((resolve, reject) => {
		const userId: number = parseInt(req.headers.userid, 10)
		const user: any = db.users[userId]

		resolve(user.role === 'admin')
	})
})

imperium.role('moderator', (req) => {
	return new Promise((resolve, reject) => {
		const userId: number = parseInt(req.headers.userid, 10)
		const user: any = db.users[userId]

		resolve(user.role === 'moderator')
	})
})

imperium.role('user', (req) => {
	return new Promise((resolve, reject) => {
		const userId: number = parseInt(req.headers.userid, 10)
		const user: any = db.users[userId]

		resolve({ user: user._id })
	})
})

imperium.role('user')
	.can('seeUser', { user: '@' })
	.can('manageUser', { user: '@' })

imperium.role('admin')
	.is('user', { user: '*' })

export default imperium
