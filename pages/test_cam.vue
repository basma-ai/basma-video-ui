<template>
  <div>
    OS: {{myOS}}
  </div>
</template>

<script>
  import { osName } from 'mobile-device-detect';



  export default {
    name: "App",
    components: {

    },
    data() {
      return {
        myOS: osName
      };
    },
    computed: {

    },
    watch: {

    },
    methods: {

    }
  };
</script>
