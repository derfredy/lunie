export default ({ node }) => {
  let lock = null

  let state = {
    nonce: `0`,
    tx: null,
    qr: null
  }

  const mutations = {
    setNonce(state, nonce) {
      // we may query an account state that still has a nonce older then the one we locally have
      // this is because the nonce only updates after txs where incorporated in a block
      if (state.nonce < nonce) state.nonce = nonce
    }
  }

  async function doSend({ state, dispatch, commit, rootState }, args) {
    if (!rootState.connection.connected) {
      throw Error(
        `Currently not connected to a secure node. Please try again when Voyager has secured a connection.`
      )
    }

    await dispatch(`queryWalletBalances`) // the nonce was getting out of sync, this is to force a sync
    let requestMetaData = {
      sequence: state.nonce,
      name: rootState.user.account,
      password: args.password,
      account_number: rootState.wallet.accountNumber, // TODO move into LCD?
      chain_id: rootState.connection.lastHeader.chain_id
    }
    args.base_req = requestMetaData

    // extract type
    let type = args.type || `send`
    delete args.type

    // extract "to" address
    let to = args.to
    delete args.to
    args.gas = `50000000`

    args.generate_only = true

    // submit to LCD to build, sign, and broadcast
    let req = to ? node[type](to, args) : node[type](args)

    let res = await req.catch(err => {
      let message
      // TODO: get rid of this logic once the appended message is actually included inside the object message
      if (!err.response.data.message) {
        let idxColon = err.response.data.indexOf(`:`)
        let indexOpenBracket = err.response.data.indexOf(`{`)
        if (idxColon < indexOpenBracket) {
          // e.g => Msg 0 failed: {"codespace":4,"code":102,"abci_code":262246,"message":"existing unbonding delegation found"}
          message = JSON.parse(err.response.data.substr(idxColon + 1)).message
        } else {
          message = err.response.data
        }
      } else {
        message = err.response.data.message
      }
      throw new Error(message)
    })

    // check response code
    assertOk(res)

    commit(`setNonce`, (parseInt(state.nonce) + 1).toString())
  }

  let actions = {
    // `lock` is a Promise which is set if we are in the process
    // of sending a transaction, so that we can ensure only one send
    // happens at once. otherwise, we might try to send 2 transactions
    // using the same sequence number, which means 1 of them won't be valid.
    async sendTx(...args) {
      actions.sendWithSigner(...args)
      return

      // wait to acquire lock
      while (lock != null) {
        // eslint-disable-line no-unmodified-loop-condition
        await lock
      }

      try {
        // send and unlock when done
        lock = doSend(...args)
        // wait for doSend to finish
        let res = await lock
        return res
      } catch (error) {
        throw error
      } finally {
        // get rid of lock whether doSend throws or succeeds
        lock = null
      }
    },
    resetSessionData({ state }) {
      state.nonce = `0`
    },
    async sendWithSigner(...args) {
      let { state, rootState } = args[0]
      let request = args[1]
      let requestMetaData = {
        sequence: state.nonce,
        name: rootState.user.account,
        password: rootState.user.password,
        account_number: rootState.wallet.accountNumber, // TODO move into LCD?
        chain_id: rootState.connection.lastHeader.chain_id
      }
      request.base_req = requestMetaData

      // extract type
      let type = request.type || `send`
      delete request.type

      // extract "to" address
      let to = request.to
      delete request.to
      request.gas = `50000000`

      // only build the request and return it
      request.generateOnly = true

      // submit to LCD to build, sign, and broadcast
      let req = to ? node[type](to, request) : node[type](request)

      let res = await req.catch(err => {
        // TODO
        throw new Error(err)
      })

      console.log(res)

      state.qr = {
        consumer: `cosmos-signer`,
        type,
        to,
        tx: res.value,
        endpoint: rootState.connection.node.remoteLcdURL + `/broadcast`
      }
    }
  }

  return {
    state,
    mutations,
    actions
  }
}

function assertOk(res) {
  if (Array.isArray(res)) {
    if (res.length === 0) throw new Error(`Error sending transaction`)

    return res.forEach(assertOk)
  }

  if (res.check_tx.code || res.deliver_tx.code) {
    let message = res.check_tx.log || res.deliver_tx.log
    throw new Error(message)
  }
}
