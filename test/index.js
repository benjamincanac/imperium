const express = require('express')
const app = express()

require('./users.init')
require('./shops.init')

app.use(require('./users.routes'))

app.listen(3000, function () {
  console.log('Listening on port 3000!')
})
