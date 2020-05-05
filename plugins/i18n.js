// import Vue from "vue"
// import VueI18n from "vue-i18n"
// Vue.use(VueI18n)
//
// export default ({ app, store }) => {
//   // Set i18n instance on app
//   // This way we can use it in middleware and pages asyncData/fetch
//   app.i18n = new VueI18n({
//     locale: store.state.locale,
//     fallbackLocale: "en",
//     messages: {
//       en: require("@/locales/en.json"),
//       ar: require("@/locales/ar.json")
//     }
//   })
//   app.i18n.path = link => {
//     if (app.i18n.locale === app.i18n.fallbackLocale) {
//       return `/en/${link}`
//     }
//     return `/${app.i18n.locale}/${link}`
//   }
// }
//

export default function ({ app }) {
  // beforeLanguageSwitch called right before setting a new locale
  app.i18n.beforeLanguageSwitch = (oldLocale, newLocale) => {
    console.log(oldLocale, newLocale)
  }
  // onLanguageSwitched called right after a new locale has been set
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    console.log(oldLocale, newLocale)
  }
}
