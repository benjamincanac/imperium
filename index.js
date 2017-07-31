const _ = require('lodash')
const assert = require('assert')

class ImperiumRole {
  constructor(imperium, rname) {
    this.imperium = imperium
    this.rname = rname
    this.role = this.imperium.roles[this.rname]

    assert(this.role, `Role ${this.rname} does not exist`)
  }

  can(perms) {
    // perms.forEach((perm) => {
    //   const aname = perm.action

    //   assert(this.imperium.actions[aname], `Action ${aname} does not exist`)
    // })

    // role.perms.push({ role })

    return this
  }

  is(rpname) {
    // const role = this.roles[this.rname]
    // const roleParent = this.roles[rpname]

    // assert(roleParent, `Role ${rpname} does not exist`)

    // a.is.push({ spec: rspec, gen: rgen })

    return this
  }
}

class Imperium {
  constructor(options) {
    this.roles = []
    this.actions = []
    this.getPositions = options.getPositions
    this.context = options.context || ['params', 'query', 'headers', 'body', 'session']

    assert(typeof this.getPositions === 'function', `getPositions must be defined`)
  }

  addRoles(rnames) {
    rnames.forEach((rname) => {
      assert(!this.roles[rname], `Role ${rname} already exists`)

      this.roles[rname] = { is: [], perms: [] }
    })
  }

  addActions(anames) {
    anames.forEach((aname) => {
      assert(!this.actions[aname], `Action ${aname} already exists`)

      this.actions[aname] = true
    })
  }

  evaluate(req, expr, context) {
    if (!(typeof expr === 'string' && expr[0] === ':')) return expr

    const exprKey = expr.substr(1)

    for (const key of context) {
      if (req[key] && req[key][exprKey]) {
        return req[key][exprKey]
      }
    }

    return null
  }

  evaluatePerm(req, perm, context) {
    return _.chain(perm)
      .mapValues((expr) => this.evaluate(req, expr, context))
      .omit('when')
      .value()
  }

  check(perms, context) {
    context = context || this.context

    return async (req, res, next) => {
      const userPositions = await this.getPositions(req)

      const evaluatedRoutePerms = (perms || [])
        .filter((perm) => !perm.when || perm.when(req))
        .map((perm) => this.evaluatePerm(req, perm, context))

      return next()
    }
  }

  role(rname) {
    return new ImperiumRole(this, rname)
  }
}

module.exports = (options) => new Imperium(options)

module.exports.Imperium = Imperium