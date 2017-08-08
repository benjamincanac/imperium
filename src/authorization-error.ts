class AuthorizationError extends Error {
	public statusCode

	constructor(statusCode: number, m: string) {
		super(m)

		this.statusCode = statusCode || 500

		Object.setPrototypeOf(this, AuthorizationError.prototype)
	}
}

export default AuthorizationError
