const express = require('express')
const router = express.Router()

const imperium = require('./imperium')

router.route('/users/:userId')
  .get(imperium.check([{ action: 'seeUser', user: ':userId' }]), (req, res) => { res.json({}) })
  .put(imperium.check([{ action: 'manageUser', user: ':userId' }]), (req, res) => { res.json({}) })

module.exports = router