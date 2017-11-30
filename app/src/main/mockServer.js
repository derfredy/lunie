let express = require('express')
let proxy = require('express-http-proxy')
let randomBytes = require('crypto').pseudoRandomBytes
let casual = require('casual')

let randomPubkey = () => ({
  type: 'ed25519',
  data: randomBytes(32).toString('hex')
})

module.exports = function (port = 8999) {
  let app = express()

  // log all requests
  app.use((req, res, next) => {
    console.log('REST request:', req.method, req.originalUrl, req.body)
    next()
  })

  // delegation mock API
  let candidates = new Array(50).fill(0).map(randomPubkey)
  app.get('/query/stake/candidate', (req, res) => {
    res.json({
      height: 10000,
      data: candidates
    })
  })
  app.get('/query/stake/candidate/:pubkey', (req, res) => {
    res.json({
      height: 10000,
      data: {
        pubkey: randomPubkey(),
        owner: {
          chain: 'gaia-1',
          app: 'sig',
          address: randomBytes(20).toString('hex')
        },
        shares: Math.floor(Math.random() * 1e7),
        voting_power: Math.floor(Math.random() * 1e5),
        description: JSON.stringify({
          description: casual.sentences(3),
          commission: casual.double(0.005, 0.05),
          commissionMax: casual.double(0.05, 0.25),
          commissionMaxRate: casual.double(0.005, 0.05),
          url: casual.url,
          keybaseID: casual.username,
          country: casual.country,
          startDate: casual.date('YYYY-MM-DD')
        })
      }
    })
  })
  app.post('/tx/stake/delegate/:pubkey/:amount', (req, res) => {
    res.json({
      'type': 'sigs/one',
      'data': {
        'tx': {
          'type': 'chain/tx',
          'data': {
            'chain_id': 'gaia-1',
            'expires_at': 0,
            'tx': {
              'type': 'nonce',
              'data': {
                'sequence': 1,
                'signers': [
                  {
                    'chain': '',
                    'app': 'sigs',
                    'addr': '84A057DCE7E1DB8EBE3903FC6B2D912E63EF9BEA'
                  }
                ],
                'tx': {
                  'type': 'coin/send',
                  'data': {
                    'inputs': [
                      {
                        'address': {
                          'chain': '',
                          'app': 'sigs',
                          'addr': '84A057DCE7E1DB8EBE3903FC6B2D912E63EF9BEA'
                        },
                        'coins': [
                          {
                            'denom': 'atom',
                            'amount': 1
                          }
                        ]
                      }
                    ],
                    'outputs': [
                      {
                        'address': {
                          'chain': '',
                          'app': 'sigs',
                          'addr': '84A057DCE7E1DB8EBE3903FC6B2D912E63EF9BEA'
                        },
                        'coins': [
                          {
                            'denom': 'atom',
                            'amount': 1
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        'signature': {
          'Sig': null,
          'Pubkey': null
        }
      }
    })
  })

  // proxy everything else to light client
  app.use(proxy('http://localhost:8998'))

  app.listen(port)
}
