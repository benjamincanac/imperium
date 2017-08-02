const express = require('express')
const router = express.Router()

const imperium = require('./imperium')

router.route('/shops')
  .get(imperium.check([{ action: 'seeShop' }]), (req, res) => { res.json({}) })
  .post(imperium.check([{ action: 'addShop' }]), (req, res) => { res.json({}) })

router.route('/shops/:shopId')
  .get(imperium.check([{ action: 'seeShop', shop: ':shopId' }]), (req, res) => { res.json({}) })
  .put(imperium.check([{ action: 'manageShop', user: ':shopId' }]), (req, res) => { res.json({}) })

router.route('/shops/:shopId/stocks')
  .get(imperium.check([{ action: 'seeStock', shop: ':shopId' }]), (req, res) => { res.json({}) })

router.route('/shops/:shopId/stocks/:stockId')
  .put(imperium.check([{ action: 'manageStock', shop: ':shopId' }]), (req, res) => { res.json({}) })

// assuming that :userId is a query param
router.route('/shops/:shopId/orders')
  .get(imperium.check([{ action: 'seeOrder', shop: ':shopId', user: ':userId' }]), (req, res) => { res.json({}) })

// assuming that :userId is a query param
router.route('/shops/:shopId/orders/:orderId')
  .put(imperium.check([{ action: 'manageOrder', shop: ':shopId', user: ':userId' }]), (req, res) => { res.json({}) })

module.exports = router