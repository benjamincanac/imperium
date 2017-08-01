const Imperium = require('../index')

const db = require('./db');

module.exports = Imperium({
  // MongoDB Example

  // async getUserAcl(req) {
  //   const users = mongo.db.collection('users')

  //   const user = await users.findOne({ _id: mongo.oid(req.session.userId) }, { acl: 1 })

  //   if (!user) throw new Error('user-not-found')

  //   return user.acl
  // }

  async getUserAcl(req) {
    return db.users[1].acl;
  }
})