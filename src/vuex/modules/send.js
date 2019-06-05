import { uatoms } from "../../scripts/num.js"

export default ({ node }) => {
  const state = {
    node
  }

  const mutations = {}

  const actions = {
    postSubmitSend({ state, commit }, transactionData, transactionFees) {
      const { toAddress } = transactionData
      const { gasEstimate, gasPrice } = transactionFees
      const fees = gasEstimate * gasPrice

      // if we send to ourselves, we don't loose tokens
      let liquidityChangeAmount =
        toAddress === state.session.address ? 0 : transactionData.amount
      commit("updateWalletBalance", {
        amount: this.balance - uatoms(liquidityChangeAmount + fees),
        denom: state.bonDenom
      })
    }
  }

  return {
    state,
    mutations,
    actions
  }
}
