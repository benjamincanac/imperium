import { Router } from 'express'
import imperium from './imperium'

const router = Router()

router.route('/users')
	.get(imperium.check([{ action: 'seeUser' }]), (req, res) => { res.json({}) })

router.route('/users/:userId')
	.get(imperium.check([{ action: 'seeUser', user: ':userId' }]), (req, res) => { res.json({}) })
	.put(imperium.check([{ action: 'manageUser', user: ':userId' }]), (req, res) => { res.json({}) })

export default router
