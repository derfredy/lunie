<template>
  <div class="tm-modal__wrapper">
    <div class="tm-modal">
      <div class="tm-modal__icon"><i class="material-icons">camera</i></div>
      <div class="tm-modal__title">Sign With Signer App</div>
      <div class="tm-modal__body">
        <vue-qr :size="400" :text="message"></vue-qr>
      </div>
      <div class="tm-modal__footer">
        <tm-btn
          id="tm-modal__btn"
          size="lg"
          icon="close"
          value="Close"
          @click.native="close"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TmBtn from "common/TmBtn"
import { mapGetters } from "vuex"
import VueQr from "vue-qr"
export default {
  name: `modal-qr-code`,
  components: { VueQr, TmBtn },
  computed: {
    ...mapGetters([`config`, `nodeURL`, `send`]),
    message() {
      return JSON.stringify(this.send.qr)
    }
  },
  mounted() {
    // const firebase = require("firebase")
    // var config = {
    //   apiKey: "AIzaSyDEgSQAg3er0dulYzRqI63IdN2Pc1Gh_D0",
    //   authDomain: "voyager-broker.firebaseapp.com",
    //   databaseURL: "https://voyager-broker.firebaseio.com",
    //   projectId: "voyager-broker",
    //   storageBucket: "voyager-broker.appspot.com",
    //   messagingSenderId: "1064638067900"
    // }
    // firebase.initializeApp(config)
    // // Initialize Cloud Firestore through Firebase
    // var db = firebase.firestore()
    // // Disable deprecated features
    // db.settings({
    //   timestampsInSnapshots: true
    // })
  },
  methods: {
    close() {
      // HACK
      this.$store.state.send.qr = null
    }
    // storeOnFirebase({ to, tx, endpoint }) {
    //   let docRef = db.collection(`txs`).add({
    //     to,
    //     endpoint,
    //     tx
    //   })
    //   let url = `https://firestore.googleapis.com/v1beta1/projects/voyager-broker/databases/(default)/documents/txs/${
    //     docRef.id
    //   }`
    //   return JSON.stringify({
    //     type: `url`,
    //     consumer: `cosmos-signer`,
    //     url
    //   })
    // }
  }
}
</script>
<style>
.tm-modal__wrapper {
  position: absolute;
  top: 0;
  left: 0;
  z-index: var(--z-modalError);
  background: var(--app-bg);
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tm-modal-error {
  padding: 1.5rem;
  max-width: 40rem;
}

.tm-modal__icon {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-below);
}

.tm-modal__icon i.material-icons {
  font-size: 50vw;
  line-height: 1;
  color: var(--bc-dim);
}

.tm-modal__title {
  font-size: var(--h1);
  font-weight: 500;
  line-height: 1;
  margin-bottom: 1.5rem;
}

.tm-modal__body {
  font-size: var(--lg);
  color: var(--dim);
  margin-bottom: 3rem;
}

.tm-modal__footer .tm-btn {
  width: 100%;
  margin-right: 1.5rem;
  margin-bottom: 1rem;
  max-width: 14rem;
}

.tm-modal__footer .tm-btn:last-child {
  margin-bottom: 0;
}
</style>
