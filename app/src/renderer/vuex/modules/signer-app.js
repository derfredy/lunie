export default ({}) => {
  const emptyState = {
    message: null
  }
  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {}

  const actions = {
    displayQr({ state, commit, rootState }, { transaction, to, type }) {
      state.message = {
        consumer: `cosmos-signer`,
        type,
        to,
        tx: transaction,
        endpoint: rootState.connection.node.remoteLcdURL + `/broadcast`
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
