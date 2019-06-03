<template>
  <div>
    <div class="action-modal-header">
      <span class="action-modal-title">
        {{ title }}
      </span>
      <div
        id="closeBtn"
        class="action-modal-icon action-modal-close"
        @click="$emit('close-action-modal')"
      >
        <i class="material-icons">close</i>
      </div>
    </div>
    <Steps v-if="steps" :steps="steps" :active-step="step" />
  </div>
</template>

<script>
import Steps from "./Steps"

export default {
  name: `action-modal-header`,
  components: {
    Steps
  },
  props: {
    title: {
      type: String,
      required: true
    },
    steps: {
      type: Array,
      required: true
    },
    step: {
      type: String,
      required: true
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
