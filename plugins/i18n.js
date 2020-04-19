import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: "en", // set locale
  fallbackLocale: "en", // set fallback locale
  // set locale messages
  messages: {
    en: require("@/translations/locales/en.js"),
    ar: require("@/translations/locales/ar.js")
  }
});
