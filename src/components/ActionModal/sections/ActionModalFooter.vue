<template>
  <div name="action-modal-footer">
    <TmFormGroup class="action-modal-group">
      <div>
        <TmBtn
          v-if="!session.signedIn"
          value="Sign In"
          color="primary"
          @click.native="$emit('go-to-session')"
        />
        <TmBtn
          v-else-if="sending"
          :value="
            step === `sign` && selectedSignMethod === `ledger`
              ? `Waiting for Ledger`
              : `Sending...`
          "
          disabled="disabled"
          color="primary"
        />
        <TmBtn
          v-else-if="!connected"
          value="Connecting..."
          disabled="disabled"
          color="primary"
        />
        <TmBtn
          v-else-if="step !== `sign`"
          color="primary"
          value="Next"
          :disabled="step === `fees` && $v.invoiceTotal.$invalid"
          @click.native="$emit('validate-change-step')"
        />
        <TmBtn
          v-else
          color="primary"
          value="Submit"
          :disabled="!session.browserWithLedgerSupport"
          @click.native="$emit('validate-change-step')"
        />
      </div>
    </TmFormGroup>
    <p
      v-if="submissionError"
      class="tm-form-msg sm tm-form-msg--error submission-error"
    >
      {{ submissionError }}
    </p>
  </div>
</template>

<script>
import { between } from "vuelidate/lib/validators"
import { viewDenom, atoms } from "src/scripts/num.js"
import TmFormGroup from "src/components/common/TmFormGroup"
import TmBtn from "src/components/common/TmBtn"

export default {
  name: `action-modal-footer`,
  components: {
    TmFormGroup,
    TmBtn
  },
  filters: {
    viewDenom
  },
  props: {
    session: {
      type: Object,
      required: true
    },
    balance: {
      type: String,
      required: true
    },
    step: {
      type: String,
      required: true
    },
    sending: {
      type: Boolean,
      required: true
    },
    selectedSignMethod: {
      type: String,
      required: true
    },
    connected: {
      type: Boolean,
      required: true
    },
    submissionError: {
      type: String,
      required: false,
      default: null
    }
  },
  validations() {
    return {
      invoiceTotal: {
        between: between(0, atoms(this.balance))
      }
    }
  }
}
</script>

<style>
.action-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.5rem 0 1rem;
}

.action-modal-footer .tm-form-group {
  padding: 0;
}

.submission-error {
  position: absolute;
  left: 1.5rem;
  bottom: 1rem;
}
</style>
