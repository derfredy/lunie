<template>
  <div class="action-modal-form">
    <TmFormGroup
      v-if="signMethods.length > 1"
      class="action-modal-form-group"
      field-id="sign-method"
      field-label="Signing Method"
    >
      <TmField
        id="sign-method"
        v-model="selectedSignMethod"
        :options="signMethods"
        type="select"
      />
    </TmFormGroup>
    <HardwareState
      v-if="selectedSignMethod === `ledger`"
      :icon="session.browserWithLedgerSupport ? 'usb' : 'info'"
      :loading="!!sending"
    >
      <div v-if="session.browserWithLedgerSupport">
        {{
          sending
            ? `Please verify and sign the transaction on your Ledger`
            : `Please plug in your Ledger&nbsp;Nano&nbsp;S and open
        the Cosmos app`
        }}
      </div>
      <div v-else>
        Please use Chrome, Brave, or Opera. Ledger is not supported in your
        current browser.
      </div>
    </HardwareState>
    <TmFormGroup
      v-else-if="selectedSignMethod === `local`"
      :error="$v.password.$error && $v.password.$invalid"
      class="action-modal-group"
      field-id="password"
      field-label="Password"
    >
      <TmField
        id="password"
        v-model="password"
        type="password"
        placeholder="Password"
        @change="$emit('onChangePassword', password)"
      />
      <TmFormMsg
        v-if="$v.password.$error && !$v.password.required"
        name="Password"
        type="required"
      />
    </TmFormGroup>
  </div>
</template>

<script>
const signWithLocalKeystore = `local`
import HardwareState from '../common/TmHardwareState'
import TmFormGroup from '../common/TmFormGroup'
import TmField from '../common/TmField'
import TmFormMsg from '../common/TmFormMsg'

export default {
  name: `action-sign-step`,
  components: {
    HardwareState
  },
  props: [`signMethods`, `selected-sign-method`, `session`, `sending`, `password-change`],
  data: () => ({
    password: null
  }),
  validations() {
    return {
      password: {
        required: requiredIf(
          () =>
            this.selectedSignMethod === signWithLocalKeystore &&
            this.step === signStep
        )
      }
    }
  }
}
</script>

<style scoped>

</style>
