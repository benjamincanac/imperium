const express = require('express')
const router = express.Router()

const imperium = require('./imperium')

process.on('unhandledRejection', (rejection) => {
  throw rejection;
})

router.route('/users')
  .get(imperium.check([{ action: 'seeUser' }]), (req, res) => { res.json({}) })

router.route('/users/:userId')
  .get(imperium.check([{ action: 'seeUser', user: ':userId' }]), (req, res) => { res.json({}) })
  .put(imperium.check([{ action: 'manageUser', user: ':userId' }]), (req, res) => { res.json({}) })

module.exports = router