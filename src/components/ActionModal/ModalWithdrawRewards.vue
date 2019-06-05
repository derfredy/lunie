<template>
  <ActionModal
    id="modal-withdraw-rewards"
    ref="actionModal"
    title="Withdraw"
    class="modal-withdraw-rewards"
    submission-error-prefix="Withdrawal failed"
    :transaction-data="transactionData"
    :notify-message="notifyMessage"
    :post-submit="postSubmit"
    :context="context"
  >
    <TmFormGroup
      class="action-modal-form-group"
      field-id="amount"
      field-label="Amount"
    >
      <span class="input-suffix">{{ context.denom | viewDenom }}</span>
      <TmField
        id="amount"
        :value="context.totalRewards | atoms | fullDecimals"
        readonly
      />
    </TmFormGroup>
    <span v-if="!validatorAddress" class="form-message withdraw-limit">
      Note: Lunie will withdraw only the top 5 rewards in a single transaction
      due to a limitation in the Ledger Nano.
    </span>
  </ActionModal>
</template>

<script>
import { viewDenom, atoms, fullDecimals } from "../../scripts/num.js"
import ActionModal from "./ActionModal"
import TmField from "common/TmField"
import TmFormGroup from "common/TmFormGroup"
import transaction from "./controller/transactionTypes"

export default {
  name: `modal-withdraw-rewards`,
  components: {
    ActionModal,
    TmField,
    TmFormGroup
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
      default: ""
    },
    context: {
      type: Object,
      required: false,
      default: () => {}
    }
  },
  computed: {
    transactionData() {
      return {
        type: transaction.WITHDRAW,
        denom: this.context.denom,
        validatorAddress: this.validatorAddress
      }
    },
    notifyMessage() {
      return {
        title: `Successful withdrawal!`,
        body: `You have successfully withdrawn your rewards.`
      }
    }
  },
  methods: {
    open() {
      this.$refs.actionModal.open()
    },
    postSubmit() {
      this.$store.dispatch("postWithdrawAllRewards")
    }
  }
}
</script>

<style scope>
.form-message.withdraw-limit {
  white-space: normal;
}
</style>
