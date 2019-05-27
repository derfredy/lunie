<template>
  <TransactionModal
    id="modal-withdraw-rewards"
    ref="TransactionModal"
    :submit-fn="submitForm"
    :simulate-fn="simulateForm"
    title="Withdraw"
    class="modal-withdraw-rewards"
    submission-error-prefix="Withdrawal failed"
  >
    <WithdrawAction />
  </TransactionModal>
</template>

<script>
import { viewDenom, atoms, fullDecimals } from "../../scripts/num.js"
import TransactionModal from "../actions/TransactionModal"
import WithdrawAction from "./WithdrawAction"

export default {
  name: `modal-withdraw-rewards`,
  components: {
    TransactionModal,
    WithdrawAction
  },
  filters: {
    atoms,
    viewDenom,
    fullDecimals
  },
  props: {
    validatorAddress: {
      type: String,
      required: false,
      default: null
    },
    rewards: {
      type: Number,
      default: 0
    },
    denom: {
      type: String,
      required: true
    }
  },
  methods: {
    open() {
      this.$refs.TransactionModal.open()
    },
    async simulateForm() {
      return await this.$store.dispatch(`simulateWithdrawAllRewards`)
    },
    async submitForm(gasEstimate, gasPrice, password, submitType) {
      await this.$store.dispatch(`withdrawAllRewards`, {
        gas: gasEstimate,
        gasPrice,
        denom: this.denom,
        validatorAddress: this.validatorAddress,
        password,
        submitType
      })

      this.$store.commit(`notify`, {
        title: `Successful withdrawal!`,
        body: `You have successfully withdrawn your rewards.`
      })
    }
  }
}
</script>

<style scope>
.form-message.withdraw-limit {
  white-space: normal;
}
</style>
