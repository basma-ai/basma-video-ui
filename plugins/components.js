import Vue from 'vue'
import VuePhoneNumberInput from 'vue-phone-number-input';
import 'vue-phone-number-input/dist/vue-phone-number-input.css';

Vue.component('vue-phone-number-input', VuePhoneNumberInput);

import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css';
Vue.component('multiselect', Multiselect)

// adding moment globally
Vue.use(require('vue-moment'))

import FeatherIcon  from '../components/FeatherIcon.vue'
Vue.component(FeatherIcon.name, FeatherIcon)

import VueSignaturePad from 'vue-signature-pad';
Vue.use(VueSignaturePad);
