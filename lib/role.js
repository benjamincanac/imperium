const assert = require('assert')
const { cloneDeep } = require('lodash')

module.exports = class ImperiumRole {
	constructor(imperium, roleName) {
		this.imperium = imperium
		this.roleName = roleName

		this.role = this.imperium.roles[this.roleName]

		assert(this.role, `Role ${this.roleName} does not exist`)
	}

	can(action, params) {
		params = params || {}

		this.role.actions.push({ action, params })

		return this
	}

	is(childRoleName, params) {
		params = params || {}

		const childRole = this.imperium.roles[childRoleName]

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
