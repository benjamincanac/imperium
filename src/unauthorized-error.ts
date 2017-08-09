class UnauthorizedError extends Error {
	public statusCode

	constructor(statusCode: number, m: string) {
		super(m)

		this.statusCode = statusCode || 500

		Object.setPrototypeOf(this, UnauthorizedError.prototype)
	}
}

export default UnauthorizedError
