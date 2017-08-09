import { Router } from 'express'
import imperium from './imperium'

const router = Router()

const callback = (req, res) => { res.json() }

router.route('/users')
	.get(imperium.can('seeUser'), callback)
	.put(imperium.can(['seeUser', { action: 'manageUser' }]), callback)
	.post(imperium.is('admin'), callback)
	.delete(imperium.is(['admin', 'moderator']), callback)

router.route('/users/:userId')
	.get(imperium.can({ action: 'seeUser', user: ':userId' }), callback)
	.put(imperium.can([{ action: 'manageUser', user: ':userId' }]), callback)
	.post(imperium.is('friend'))
	.delete(imperium.can('manageUser'), callback)

export default router
