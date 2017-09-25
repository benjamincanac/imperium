const users = [
	{
		_id: 0,
		role: 'admin' // admin user
	},
	{
		_id: 1, // normal user + shop owner of Shop0 + Shop1
		shop: ['0', '1']
	},
	{
		_id: 2, // normal user + shop owner of Shop0
		shop: ['1']
	},
	{
		_id: 3 // normal user
	}
]

const shops = [
	{
		_id: 0,
		name: 'Shop0',
		// owners: [1]
	},
	{
		_id: 1,
		name: 'Shop1',
		// owners: [1, 2]
	}
]

module.exports = { users, shops }
