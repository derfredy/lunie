<template>
  <transition v-if="show" name="slide-fade">
    <div v-focus-last class="action-modal" tabindex="0" @keyup.esc="close">
      <ActionModalHeader
        :title="title"
        :requires-sign-in="requiresSignIn"
        :steps="steps"
        :step="step"
        @close-action-modal="close"
      />
      <div v-if="requiresSignIn" class="action-modal-form">
        <p>You need to sign in to submit a transaction.</p>
      </div>
      <div v-else-if="step === `details`" class="action-modal-form">
        <slot />
      </div>
      <ActionFees
        v-else-if="step === `fees`"
        :session="session"
        :step="step"
        :amount="amount"
        :balance="balance"
        :gas-price="gasPrice"
        :gas-estimate="gasEstimate"
      />
      <SignStep
        v-else-if="step === `sign`"
        class="action-modal-form"
        :session="session"
        :sign-methods="signMethods"
        :selected-sign-method="selectedSignMethod"
        :sending="sending"
        @on-change-password="onChangePassword"
      />
      <ActionModalFooter
        :session="session"
        :requires-sign-in="requiresSignIn"
        :balance="balance"
        :step="step"
        :sending="sending"
        :selected-sign-method="selectedSignMethod"
        :connected="connected"
        :validate-change-step="validateChangeStep"
        :submission-error="submissionError"
        @go-to-session="goToSession"
      />
    </div>
  </transition>
</template>

<script>
import ActionModalHeader from "./ActionModalHeader"
import ActionModalFooter from "./ActionModalFooter"
import ActionFees from "./ActionFees"
import SignStep from "./SignStep"
import { mapGetters } from "vuex"
import { uatoms, atoms, viewDenom } from "../../scripts/num.js"
import { between, requiredIf } from "vuelidate/lib/validators"
import { track } from "scripts/google-analytics.js"
import config from "src/config"

import ActionController from "./controller/ActionController.js"
const actionController = new ActionController()

const defaultStep = `details`
const feeStep = `fees`
const signStep = `sign`

const signWithLedger = `ledger`
const signWithLocalKeystore = `local`

export default {
  name: `action-modal`,
  components: {
    ActionModalHeader,
    ActionModalFooter,
    ActionFees,
    SignStep
  },
  props: {
    title: {
      type: String,
      required: true
    },
    validate: {
      type: Function,
      default: undefined
    },
    submissionErrorPrefix: {
      type: String,
      default: `Transaction failed`
    },
    amount: {
      type: [String, Number],
      default: `0`
    },
    transactionData: {
      type: Object,
      default: () => {}
    },
    notifyMessage: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    steps: ["Details", "Fees", "Sign"],
    step: defaultStep,
    signMethod: null,
    password: null,
    sending: false,
    gasEstimate: null,
    gasPrice: config.default_gas_price.toFixed(9),
    submissionError: null,
    show: false,
    track,
    atoms,
    uatoms,
    viewDenom
  }),
  computed: {
    ...mapGetters([
      `connected`,
      `session`,
      `bondDenom`,
      `wallet`,
      `ledger`,
      `liquidAtoms`
    ]),
    requiresSignIn() {
      return !this.session.signedIn
    },
    balance() {
      return this.liquidAtoms
    },
    invoiceTotal() {
      return (
        Number(this.amount) + Number(this.gasPrice) * Number(this.gasEstimate)
      )
    },
    isValidChildForm() {
      // here we trigger the validation of the child form
      if (this.validate) {
        return this.validate()
      }
      return true
    },
    selectedSignMethod() {
      if (
        this.session.sessionType === `ledger` ||
        this.session.sessionType === `explore`
      ) {
        return signWithLedger
      }
      return signWithLocalKeystore
    },
    signMethods() {
      if (this.session.sessionType === `ledger`) {
        return [
          {
            key: `Ledger Nano S`,
            value: signWithLedger
          }
        ]
      }
      return [
        {
          key: `(Unsafe) Local Account`,
          value: signWithLocalKeystore
        }
      ]
    }
  },
  methods: {
    open() {
      this.track(`event`, `modal`, this.title)
      this.gasPrice = config.default_gas_price.toFixed(9)
      this.show = true
    },
    close() {
      this.submissionError = null
      this.password = null
      this.step = defaultStep
      this.show = false

      // reset form
      this.$v.$reset()
      this.$emit(`close`)
    },
    onChangePassword(newPassword) {
      console.log("password change", newPassword)
      this.password = newPassword
    },
    goToSession() {
      this.close()

      this.$store.commit(`setSessionModalView`, `welcome`)
      this.$store.commit(`toggleSessionModal`, true)
    },
    isValidInput(property) {
      this.$v[property].$touch()

      return !this.$v[property].$invalid
    },
    async validateChangeStep() {
      // An ActionModal is only the prototype of a parent modal
      switch (this.step) {
        case defaultStep:
          if (!this.isValidChildForm) {
            return
          }
          this.sending = true
          await this.simulate() // simulate to get gas estimation
          this.sending = false
          return
        case feeStep:
          if (!this.isValidInput(`gasPrice`)) {
            return
          }
          if (!this.isValidInput(`invoiceTotal`)) {
            return
          }
          this.step = signStep
          return
        case signStep:
          if (!this.isValidInput(`password`)) {
            return
          }
          // submit transaction
          this.sending = true
          await this.submit()
          this.sending = false
          return
        default:
          return
      }
    },
    async simulate() {
      try {
        const { type, ...properties } = this.transactionData
        this.gasEstimate = await actionController.simulate(type, properties)
        this.step = feeStep
      } catch ({ message }) {
        this.submissionError = `${this.submissionErrorPrefix}: ${message}.`
      }
    },
    async submit() {
      this.submissionError = null
      track(`event`, `submit`, this.title, this.selectedSignMethod)

      if (this.selectedSignMethod === signWithLedger) {
        await this.connectLedger()
      }

      const { type, ...properties } = this.transactionData

      const gasPrice = {
        amount: this.gasPrice,
        denom: this.bondDenom
      }
      console.log(gasPrice)
      try {
        await actionController.send(
          type,
          properties,
          this.gasEstimate,
          gasPrice,
          this.selectedSignMethod,
          this.password
        )
        track(`event`, `successful-submit`, this.title, this.selectedSignMethod)
        // this.close()
        this.$store.commit(`notify`, this.notifyMessage)
      } catch ({ message }) {
        this.submissionError = `${this.submissionErrorPrefix}: ${message}.`
        track(`event`, `failed-submit`, this.title, message)

        setTimeout(() => {
          this.submissionError = null
        }, 5000)
      }
    },
    async connectLedger() {
      try {
        await this.$store.dispatch(`connectLedgerApp`)
      } catch (error) {
        this.submissionError = `${this.submissionErrorPrefix}: ${error}.`
      }
    }
  },
  validations() {
    return {
      password: {
        required: requiredIf(
          () =>
            this.selectedSignMethod === signWithLocalKeystore &&
            this.step === signStep
        )
      },
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

<style>
.action-modal {
  background: var(--app-nav-light);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  right: 1rem;
  padding: 1.5rem 1.5rem 2rem 1.5rem;
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 564px;
  z-index: var(--z-modal);
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(200, 200, 200, 0.1);
}

.action-modal-header {
  align-items: center;
  text-align: center;
  display: flex;
  padding-bottom: 1.5rem;
}

.action-modal-atom {
  height: 3rem;
  width: 3rem;
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

.action-modal-form .tm-form-group {
  display: block;
  padding: 0.75rem 0;
}

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

.form-message {
  font-size: var(--sm);
  font-weight: 500;
  font-style: italic;
  color: var(--dim);
}

.slide-fade-enter-active {
  transition: all 0.1s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(2rem);
  opacity: 0;
}

@media screen and (max-width: 1023px) {
  .row {
    flex-direction: column;
  }

  .action-modal {
    right: 0;
    top: 0;
  }
}
</style>
