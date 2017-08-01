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
    acl: [
      {
        role: 'admin'
      }
    ]
  },
  {
    _id: '2',
    acl: [
      {
        role: 'user',
        user: '2',
        bucket: 'front'
      }
    ]
  },
  {
    _id: '3',
    acl: [
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
    acl: [
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
    acl: [
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