'use strict'

const { map, find, compact, forIn, chain, keys, some } = require('lodash')

class ImperiumDoor {
  constructor (imperium, ctx) {
    this.imperium = imperium
    this.ctx = ctx
  }

  /**
   * Check if action matches any of user roles action
   *
   * @param name Name of the action
   * @param params Params of the action
   *
   * @return {boolean}
   */
  async can (name, params) {
    const routeAction = { name, ...params }

    // Transform imperium stored roles object into an array with only matching action
    const roles = compact(map(this.imperium._roles, ({ process, actions }, role) => {
      const action = find(actions, { name })
      if (!action) return null

      return {
        role,
        action,
        process
      }
    }))

    for (const role of roles) {
      /* istanbul ignore else */
      if (await this._roleMatchRouteAction(role, routeAction)) return true
    }

    return false
  }

  /**
   * Inverse of `can` method (code must always be affirmative)
   *
   * @param name Name of the action
   * @param params Params of the action
   *
   * @return {boolean}
   */
  async cannot (name, params) {
    return !(await this.can(name, params))
  }

  /**
   * Check if user has role
   *
   * @param name Name of the role
   *
   * @return {boolean}
   */
  async is (name, params = {}) {
    const role = this.imperium._roles[name]
    /* istanbul ignore if */
    if (!role) return false

    const processedRole = await role.process(this.ctx)
    if (!processedRole) return false
    if (typeof processedRole === 'boolean') return processedRole

    const processedRoles = Array.isArray(processedRole) ? processedRole : [processedRole]

    return some(processedRoles, (processedRoleParams) => {
      return this._matchActions(processedRoleParams, params)
    })
  }

  /**
   * Inverse of `is` method (code must always be affirmative)
   *
   * @param name Name of the role
   *
   * @return {boolean}
   */
  async isnot (name) {
    return !(await this.is(name))
  }

  /**
   * Check if processed role matches route action
   * The role is processed using the current route context (auth)
   *
   * @private
   *
   * @param role Role to check
   * @param routeAction Action required by the route
   *
   * @return {boolean}
   */
  async _roleMatchRouteAction (role, routeAction) {
    const processedRole = await role.process(this.ctx)
    if (!processedRole) return false
    if (typeof processedRole === 'boolean') return processedRole

    const processedRoles = Array.isArray(processedRole) ? processedRole : [processedRole]

    return some(processedRoles, (params) => {
      const roleAction = { name: role.action.name }

      forIn(role.action.params, (value, key) => {
        if (value === '@') roleAction[key] = params[key]
        else roleAction[key] = value
      })

      return this._matchActions(roleAction, routeAction)
    })
  }

  /**
   * Check if roleAction matches routeAction
   *
   * @private
   *
   * @param roleAction Action of the current role loop
   * @param routeAction Action required by the route
   *
   * @return {boolean}
   */
  _matchActions (roleAction, routeAction) {
    const actionsKeys = chain(keys(routeAction)).concat(keys(roleAction)).uniq().value()

    for (const key of actionsKeys) {
      const roleActionValue = roleAction[key]
      const routeActionValue = routeAction[key] || '*'

      if (roleActionValue !== '*') {
        if (Array.isArray(roleActionValue)) {
          if (roleActionValue.indexOf(routeActionValue) === -1) return false
        } else if (roleActionValue !== routeActionValue) return false
      }
    }

    return true
  }
}

module.exports = ImperiumDoor
