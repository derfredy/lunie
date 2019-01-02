export default ({}) => {
  const emptyState = {
    message: null
  }
  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {}

  const actions = {
    displayQr(
      { state, commit, rootState },
      { transaction, to, type, base_req }
    ) {
      state.message = {
        consumer: `cosmos-signer`,
        type,
        to,
        base_req,
        address: rootState.wallet.address,
        tx: transaction,
        endpoint: rootState.connection.node.remoteLcdURL + `/tx/broadcast`
      }
      commit(`setModalQr`, true)
    }
  }

  return {
    state,
    actions,
    mutations
  }
}
