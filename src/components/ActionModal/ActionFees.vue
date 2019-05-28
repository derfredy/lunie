<template>
  <div class="action-modal-form">
    <DevTransaction
      v-if="session.experimentalMode"
      :step="step"
      :gas-price="gasPrice"
      :balance="balance"
    />
    <TableInvoice
      :amount="Number(amount)"
      :gas-estimate="Number(gasEstimate)"
      :gas-price="Number(gasPrice)"
    />
    <TmFormMsg
      v-if="$v.invoiceTotal.$invalid"
      name="Total"
      type="between"
      min="0"
      :max="atoms(balance)"
    />
  </div>
</template>

<script>
import DevTransaction from "./DevTransaction"
import TableInvoice from "../common/TableInvoice"
import TmFormMsg from "../common/TmFormMsg"
import { atoms } from "../../scripts/num"
import { between, requiredIf } from "vuelidate/lib/validators"

const feeStep = `fees`

export default {
  name: `action-fees`,
  components: {
    DevTransaction,
    TableInvoice,
    TmFormMsg
  },
  props: ["session", "step", "gasPrice", "amount", "balance", "gasEstimate"],
  validations() {
    return {
      gasPrice: {
        required: requiredIf(
          () => this.step === feeStep && this.session.experimentalMode
        ),
        // we don't use SMALLEST as min gas price because it can be a fraction of uatom
        // min is 0 because we support sending 0 fees
        between: between(0, atoms(this.balance))
      },
      invoiceTotal: {
        between: between(0, atoms(this.balance))
      }
    }
  }
}
</script>

<style scoped>
.action-modal-header {
  align-items: center;
  text-align: center;
  display: flex;
  padding-bottom: 1.5rem;
}

.action-modal-title {
  flex: 1;
  font-size: var(--h3);
  font-weight: 500;
  color: var(--bright);
  padding-left: 1rem;
}

.action-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-modal-icon i {
  font-size: var(--lg);
}

.action-modal-icon.action-modal-close {
  cursor: pointer;
}

.action-modal-icon.action-modal-close:hover i {
  color: var(--link);
}
</style>
