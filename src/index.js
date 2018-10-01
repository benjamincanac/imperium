'use strict'

const assert = require('assert')
const { map } = require('lodash')

const ImperiumRole = require('./Role')
const ImperiumDoor = require('./Door')

class Imperium {
  constructor () {
    this._roles = {}
  }

  /**
   * Define new role
   *
   * @param name Name of the role
   * @param process Function to be executed with context
   *
   * @return {ImperiumRole} Instance of ImperiumRole
   */
  role (name, process) {
    // Create role if it doesn't exist already and process is defined
    if (!this._roles[name] && process) this._addRole(name, process)

    return new ImperiumRole(this, name)
  }

  /**
   * Create instance of ImperiumDoor
   *
   * @param ctx Adonis context
   *
   * @return {ImperiumDoor} Instance of ImperiumDoor with current route context
   */
  door (ctx) {
    return new ImperiumDoor(this, ctx)
  }

  /**
   * Returns stored roles.
   *
   *
   * @return {array}
   */
  roles () {
    return map(this._roles, ({ actions }, name) => ({ name, actions }))
  }

  /**
   * Store role in Imperium singleton
   *
   * @private
   *
   * @param name Name of the role
   * @param process Function to be executed with context
   */
  _addRole (name, process) {
    assert(!this._roles[name], `Role ${name} already exists`)

    this._roles[name] = { actions: [], process }

    return this._roles[name]
  }
}

module.exports = Imperium
