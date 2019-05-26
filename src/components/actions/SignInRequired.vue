<template>
  <div>
    <div v-if="session.signedIn" class="action-modal-form">
      <ActionModalHeader title="Sign in required" />
      <p>You need to sign in to submit a transaction.</p>
      <ActionModalFooter :requires-sign-in="session.signedIn" />
      <!-- <TmBtn
        v-if="requiresSignIn"
        value="Sign In"
        color="primary"
        @click.native="$emit('go-to-session')"
      /> -->
    </div>
    <slot v-if="!session.signedIn" name="action-modal-content"></slot>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import ActionModalHeader from "./ActionModalHeader"
import ActionModalFooter from "./ActionModalFooter"

export default {
  name: "action-requires-sign-in",
  components: {
    ActionModalHeader,
    ActionModalFooter
  },
  computed: {
    ...mapGetters([
      `session`,
    ])
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

.action-modal-atom {
  height: 3rem;
  width: 3rem;
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
