import { Imperium } from '../../../src'
import db from './db'

const imperium = new Imperium({
	async getUserAcl(req) {
		const index = Number(req.headers.userid || 1) - 1
		return db.users[index].acl
	}
})

imperium.addRoles([
	'admin',
	'user'
])

imperium.addActions([
	'seeUser',
	'manageUser'
])

imperium.role('user')
	.can([
		{ action: 'seeUser', user: '@' },
		{ action: 'manageUser', user: '@' }
	])

imperium.role('admin')
	.is('user', { user: '*' })

export default imperium
