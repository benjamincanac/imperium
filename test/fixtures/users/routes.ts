import { Router } from 'express'
import imperium from './imperium'

const router = Router()

const callback = (req, res) => { res.json() }

router.route('/users')
	.get(imperium.can('seeUser'), callback)

router.route('/users/:userId')
	.get(imperium.can({ action: 'seeUser', user: ':userId' }), callback)
	.put(imperium.can([{ action: 'manageUser', user: ':userId' }]), callback)
	.delete(imperium.is('admin'), callback)

export default router
