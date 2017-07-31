const Imperium = require('../index')

const db = require('./db');

module.exports = Imperium({
  // MongoDB Example

  // async getPositions(req) {
  //   const users = mongo.db.collection('users')

  //   const user = await users.findOne({ _id: mongo.oid(req.session.userId) }, { positions: 1 })

  //   if (!user) throw new Error('user-not-found')

  //   return user.positions
  // }

  async getPositions(req) {
    return db.users[0].positions;
  }
})