<template>
  <a v-if="file_loaded" target="_blank" @click="showFile">
    <vs-button v-if="file_type == 'file'" icon-pack="feather" class="chat-file-preview" icon="icon-file-text" size="medium" color="#fff" type="border">{{file.filename}}</vs-button>
    <img v-else class="chat-image-preview" :src="file.signed_url">
  </a>
</template>
<script>
  import axios from "axios";

  export default {
    props: ['file_type','file_id','guest_token'],
    data() {
      return {
        file: null,
        file_loaded: false
      }
    },
    methods: {
      showFile() {
        let this_app = this;

        this.getFile(function() {
          window.open(this_app.file.signed_url, "_blank")
        });
      },
      getFile(onDone = null) {
        const params = {
          "guest_token": this.guest_token,
          "file_id": this.file_id
        };

        axios.post(process.env.api_url + "/files/get", params).then(function (res) {
          if (res.data.success) {
            this.file = res.data.data;
            this.file_loaded = true
            if(onDone != null) {
              onDone()
            }
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
  .chat-file-preview {
    margin: 0 !important;
    font-size: 12px;
  }
  img.chat-image-preview {
    max-width: 200px;
    display: block;
    background-color: #fff;
    border-radius: 5px;
  }
</style>
