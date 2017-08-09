import * as assert from 'assert'
import { cloneDeep } from 'lodash'

interface Role {
	children: any[]
	actions: any[]
}

export class ImperiumRole {
	private role: Role

	constructor(private imperium, private roleName: string) {
		this.role = this.imperium.roles[this.roleName]

		assert(this.role, `Role ${this.roleName} does not exist`)
	}

	public can(action: string, params: object = {}) {
		this.role.actions.push({ action, params })

		return this
	}

	public is(childRoleName: string, params: object = {}) {
		const childRole = this.imperium.roles[childRoleName]

		assert(childRole, `Role ${childRoleName} does not exist`)

		this.role.actions = this.role.actions.concat(childRole.actions.slice().map((childRoleAction) => {
			const action = cloneDeep(childRoleAction)

			// Replace action params only if exists
			Object.keys(params).forEach((key) => {
				if (typeof action.params[key] !== 'undefined') action.params[key] = params[key]
			})

			return action
		}))

		return this
	}
}
