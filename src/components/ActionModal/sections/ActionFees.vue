<template>
  <div class="action-modal-form">
    <ExperimentalFees
      v-if="session.experimentalMode"
      :step="step"
      :gas-price="gasPrice"
      :balance="balance"
      :denom="denom"
      :session="session"
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
import ExperimentalFees from "./ExperimentalFees"
import TableInvoice from "src/components/common/TableInvoice"
import TmFormMsg from "src/components/common/TmFormMsg"
import { atoms } from "src/scripts/num"
import { between, requiredIf } from "vuelidate/lib/validators"

const feeStep = `fees`

export default {
  name: `action-fees`,
  components: {
    ExperimentalFees,
    TableInvoice,
    TmFormMsg
  },
  props: {
    session: {
      type: Object,
      required: true
    },
    step: {
      type: String,
      required: true
    },
    gasPrice: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    balance: {
      type: String,
      required: true
    },
    gasEstimate: {
      type: Number,
      required: true
    },
    denom: {
      type: String,
      required: true
    }
  },
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
