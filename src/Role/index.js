'use strict'

const assert = require('assert')
const { cloneDeep } = require('lodash')

class ImperiumRole {
  constructor (imperium, roleName) {
    this.imperium = imperium
    this.roleName = roleName

    this.role = this.imperium._roles[this.roleName]

    assert(this.role, `Role ${this.roleName} does not exist`)
  }

  /**
   * Associate action to role
   *
   * @param name Name of the action
   * @param params Params of the action
   *
   * @return {this} Instance of ImperiumRole (in order to be chained)
   */
  can (name, params) {
    params = params || {}

    this.role.actions.push({ name, params })

    return this
  }

  /**
   * Associate action to role
   *
   * @param childRoleName Name of the child action to inherit from
   * @param params Params to override child action
   *
   * @return {this} Instance of ImperiumRole (in order to be chained)
   */
  is (childRoleName, params) {
    params = params || {}

    const childRole = this.imperium._roles[childRoleName]

    assert(childRole, `Role ${childRoleName} does not exist`)

    this.role.actions = this.role.actions.concat(childRole.actions.slice().map((childRoleAction) => {
      const action = cloneDeep(childRoleAction)

      // Replace action params only if exists
      Object.keys(params).forEach((key) => {
        /* istanbul ignore else */
        if (typeof action.params[key] !== 'undefined') action.params[key] = params[key]
      })

      return action
    }))

    return this
  }
}

module.exports = ImperiumRole
