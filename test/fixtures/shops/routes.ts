import { Router } from 'express'
import imperium from './imperium'

const router = Router()

const callback = (req, res) => { res.json() }

router.route('/shops')
	.get(imperium.can('seeShop'), callback)
	.post(imperium.can('addShop'), callback)

router.route('/shops/:shopId')
	.get(imperium.can({ action: 'seeShop', shop: ':shopId' }), callback)
	.put(imperium.can([{ action: 'manageShop', shop: ':shopId' }]), callback)
	.delete(imperium.can([{ action: 'manageShop', shop: ':' }]), callback)

router.route('/bills')
	.get(imperium.can({ action: 'seeBill', stock: ':shopId/:orderId' }), callback)

// assuming that we can pass query.userId and/or query.shopId
router.route('/orders')
	.get(imperium.can([
		{ action: 'seeOrder', when: (req) => !req.query.userId && !req.query.shopId },
		{ action: 'seeOrder', user: ':userId', when: (req) => !!req.query.userId },
		{ action: 'seeOrder', shop: ':shopId', when: (req) => !!req.query.shopId }
	]), callback)

export default router
