import Vue from 'vue'
import Vuesax from 'vuesax'
import 'material-icons/iconfont/material-icons.css';
import 'vuesax/dist/vuesax.css' //Vuesax styles

Vue.use(Vuesax, {
  theme:{
    colors:{
      primary : '#FFB600',
      secondary : '#4783af',
      success : '#28C76F',
      danger  : '#EA5455',
      warning : '#FF9F43',
      dark    : '#4a4a4a',
    }
  }
})
