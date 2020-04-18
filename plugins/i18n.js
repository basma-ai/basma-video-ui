import Vue from "vue";
import VueI18n from "vue-i18n";

// const messages = {
//   en: {
//     helloMsg: "HELLOO"
//   },
//   ar: {
//     hellowMsg: "هلا"
//   }
// };

const i18n = new VueI18n({
  locale: "en", // set locale
  fallbackLocale: "ar" // set fallback locale
  //   messages // set locale messages
});

Vue.use(i18n);
