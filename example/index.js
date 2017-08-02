const express = require('express')
const app = express()

process.on('unhandledRejection', (rejection) => {
  throw rejection
})

require('./users.init')
// require('./shops.init')

app.use(require('./users.routes'))
// app.use(require('./shops.routes'))

app.use((err, req, res, next) => {
  res.status(403).json({ message: err.message })
})

app.listen(3000, function () {
  console.log('Listening on port 3000!')
})
