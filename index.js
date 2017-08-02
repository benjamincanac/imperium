const _ = require('lodash')
const assert = require('assert')

class ImperiumRole {
  constructor(imperium, roleName) {
    this.imperium = imperium
    this.roleName = roleName
    this.role = this.imperium.roles[this.roleName]

    assert(this.role, `Role ${this.roleName} does not exist`)
  }

  can(perms) {
    perms.forEach((perm) => {
      const actionName = perm.action

      assert(this.imperium.actions[actionName], `Action ${actionName} does not exist`)

      this.role.perms.push(perm)
    })

    return this
  }

  is(childRoleName, childRolePerm) {
    const child = this.imperium.roles[childRoleName]

    assert(child, `Role ${childRoleName} does not exist`)

    this.role.children.push(_.merge({ role: childRoleName }, childRolePerm))

    return this
  }
}

class Imperium {
  constructor(options) {
    this.roles = []
    this.actions = []
    this.getUserAcl = options.getUserAcl
    this.context = options.context || ['params', 'query', 'headers', 'body', 'session']

    assert(typeof this.getUserAcl === 'function', `getUserAcl must be defined`)
  }

  addRoles(roleNames) {
    roleNames.forEach((roleName) => {
      assert(!this.roles[roleName], `Role ${roleName} already exists`)

      this.roles[roleName] = { children: [], perms: [] }
    })
  }

  addActions(actionNames) {
    actionNames.forEach((actionName) => {
      assert(!this.actions[actionName], `Action ${actionName} already exists`)

      this.actions[actionName] = true
    })
  }

  evaluateUserPerm(perm, context) {
    const evaluatedPerm = {}

    _.forIn(perm, (value, key) => {
      if (value === '@') evaluatedPerm[key] = context[key]
      else if (value[0] === '@') evaluatedPerm[key] = context[value.substr(1)]
      else evaluatedPerm[key] = value

      if (typeof evaluatedPerm[key] === 'undefined') {
        throw new Error(`User acl key "${key}" in "${context.role}" role is not defined`)
      }
    })

    return evalutedPerm
  }

  evaluateUserPerms(userAcl) {
    const evaluatedPerms = []

    userAcl.forEach((acl) => {
      const perms = this.roles[acl.role].perms

      perms.forEach((perm) => {
        evaluatedPerms.push(this.evaluateUserPerm(perm, acl))
      })
    })

    return evaluatedPerms
  }

  evaluateRoutePerm(req, expr, context) {
    if (!(typeof expr === 'string' && expr[0] === ':')) return expr

    const exprKey = expr.substr(1)

    for (const key of context) {
      if (req[key] && req[key][exprKey]) {
        return req[key][exprKey]
      }
    }

    return null
  }

  evaluateRoutePerms(req, perms, context) {
    return (perms || [])
      .filter((perm) => !perm.when || perm.when(req))
      .map((perm) => {
        return _.chain(perm)
          .mapValues((expr) => this.evaluateRoutePerm(req, expr, context))
          .omit('when')
          .value()
      })
  }

  getUserAclChildren(userAcl, childrenAcl) {
    childrenAcl = childrenAcl || []

    userAcl.forEach((acl) => {
      childrenAcl.push(acl)

      const aclRole = this.roles[acl.role]

      if (aclRole) {
        const children = aclRole.children

        if (children.length) this.getUserAclChildren(children, childrenAcl)
      }
    })

    return childrenAcl
  }

  matchPerm(routePerm, userPerm) {
    // get all params from route and user
    const keys = _.chain(_.keys(routePerm)).concat(_.keys(userPerm)).uniq().without('action').value()

    for (const key of keys) {
      const userPermValue = userPerm[key]
      const routePermValue = routePerm[key] || '*'

      if (userPermValue !== '*') {
        if (Array.isArray(userPermValue) && userPermValue.indexOf(routePermValue) === -1) return false
        else if (userPermValue !== routePermValue) return false
      }
    }

    return true
  }

  // check if user has every perm required by the route
  checkPerms(routePerms, userPerms) {
    return _.every(routePerms, (routePerm) => {
      return _.some(userPerms, (userPerm) => {
        return this.matchPerm(routePerm, userPerm)
      })
    })
  }

  check(perms, context) {
    context = context || this.context

    return async (req, res, next) => {
      try {
        const userAcl = await this.getUserAcl(req)
        const userAclChildren = this.getUserAclChildren(userAcl)
        const userPerms = this.evaluateUserPerms(userAclChildren)
        const routePerms = this.evaluateRoutePerms(req, perms, context)
      } catch (err) {
        return next(err)
      }

      if (!this.checkPerms(routePerms, userPerms)) return next(new Error('invalid-perms'))

      return next()
    }
  }

  role(roleName) {
    return new ImperiumRole(this, roleName)
  }
}

module.exports = (options) => new Imperium(options)

module.exports.Imperium = Imperium