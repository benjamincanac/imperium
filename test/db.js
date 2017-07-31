const shops = [
  {
    _id: '1',
    title: 'shop1'
  },
  {
    _id: '2',
    title: 'shop2'
  }
]

const users = [
  {
    _id: '1',
    positions: [
      {
        role: 'admin'
      }
    ]
  },
  {
    _id: '2',
    positions: [
      {
        role: 'user',
        user: '2'
      }
    ]
  },
  {
    _id: '3',
    positions: [
      {
        role: 'user',
        user: '3'
      },
      {
        role: 'shopOwner',
        shop: ['1', '2']
      }
    ]
  },
  {
    _id: '4',
    positions: [
      {
        role: 'user',
        user: '4'
      },
      {
        role: 'shopLogistician',
        shop: '1'
      }
    ]
  },
  {
    _id: '5',
    positions: [
      {
        role: 'user',
        user: '5'
      },
      {
        role: 'shopMember',
        shop: '2'
      }
    ]
  }
]

module.exports = { shops, users }