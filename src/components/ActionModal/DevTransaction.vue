<template>
  <TmFormGroup
    :error="$v.gasPrice.$error && $v.gasPrice.$invalid"
    class="action-modal-group"
    field-id="gasPrice"
    field-label="Gas Price"
  >
    <span class="input-suffix">{{ bondDenom | viewDenom }}</span>
    <TmField
      id="gas-price"
      v-model="gasPrice"
      step="0.000000001"
      type="number"
      min="0"
    />
    <TmFormMsg
      v-if="balance === 0"
      :msg="`doesn't have any ${bondDenom}s`"
      name="Wallet"
      type="custom"
    />
    <TmFormMsg
      v-else-if="$v.gasPrice.$error && !$v.gasPrice.required"
      name="Gas price"
      type="required"
    />
    <TmFormMsg
      v-else-if="$v.gasPrice.$error && !$v.gasPrice.between"
      :max="$v.gasPrice.$params.between.max"
      :min="0"
      name="Gas price"
      type="between"
    />
  </TmFormGroup>
</template>

<script>
import { mapGetters } from "vuex"
import { between, requiredIf } from "vuelidate/lib/validators"
import { viewDenom, atoms } from "../../scripts/num.js"
import TmFormGroup from "common/TmFormGroup"
import TmField from "common/TmField"
import TmFormMsg from "common/TmFormMsg"

const feeStep = `fees`

export default {
  name: `dev-data`,
  components: {
    TmFormGroup,
    TmField,
    TmFormMsg
  },
  filters: {
    viewDenom
  },
  props: {
    step: {
      type: String,
      default: ""
    },
    gasPrice: {
      type: String,
      default: ""
    },
    balance: {
      type: String,
      default: ""
    }
  },
  computed: {
    ...mapGetters([`session`, `bondDenom`])
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
      }
    }
  }
}
</script>
