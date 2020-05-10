<template>
  <div>
    <a target="_blank" :href="file_url">
      <img class="chat-image-preview" v-if="file_loaded" :src="file_url">
    </a>
  </div>
</template>
<script>
  import axios from "axios";

  export default {
    props: ['file_id','guest_token'],
    data() {
      return {
        file_url: '',
        file_loaded: false
      }
    },
    methods: {
      getFile() {
        const params = {
          "guest_token": this.guest_token,
          "file_id": this.file_id
        };

        axios.post(process.env.api_url + "/files/get", params).then(function (res) {
          if (res.data.success) {
            this.file_url = res.data.data.signed_url;
            this.file_loaded = true
          }

        }.bind(this));
      },
    },
    created() {
      if(null != this.file_id) {
        this.getFile()
      }
    },
  }
</script>

<style>
  img.chat-image-preview {
    max-width: 200px;
    display: block;
  }
</style>
