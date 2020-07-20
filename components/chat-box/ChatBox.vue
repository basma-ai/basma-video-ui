<template>
  <div id="chat-app" class="border border-solid d-theme-border-grey-light rounded relative overflow-hidden">
    <div class="chat__bg chat-content-area">
      <template>
        <VuePerfectScrollbar class="chat-content-scroll-area" :settings="settings">
          <div class="chat__log" ref="chatLog">
            <chat-log :user_token="user_token" :chatData="chatData"></chat-log>
          </div>
        </VuePerfectScrollbar>
        <div class="chat__input flex p-4 bg-white">
          <vs-input class="flex-1" placeholder="Type Your Message.." v-model="typedMessage" @keyup.enter="sendMsg"/>
          <vs-button size="large" radius icon="send" type="filled" @click="sendMsg" color="secondary"></vs-button>
          <FileUpload ref="file_upload" class="ml-2" belongs_to="calls" :user_token="user_token" :belongs_to_id="call_id"
                      @uploaded="fileUploaded"></FileUpload>
        </div>
      </template>
    </div>
    <vs-popup title="Please sign below" :active.sync="showPopup">
      <div id="signature_pad">
        <VueSignaturePad v-if="showSignature" width="100%" height="200px" ref="signaturePad"/>
        <vs-button size="large" color="success" type="filled" @click="saveSignature">Send</vs-button>
        <vs-button size="large" color="dark" type="border" @click="resetSignature">Reset</vs-button>
      </div>
    </vs-popup>

  </div>
</template>

<script>
  import ChatLog from './ChatLog.vue'
  import FileUpload from './FileUpload.vue'
  import VuePerfectScrollbar from 'vue-perfect-scrollbar'

  import axios from "axios";

  export default {
    props: ['user_token', 'call_id'],
    data() {
      return {
        typedMessage: '',
        settings: {
          maxScrollbarLength: 60,
          wheelSpeed: 0.70
        },
        chatData: [],
        showPopup: false,
        showSignature: false
      }
    },
    watch: {},
    computed: {},
    methods: {
      openSignature() {
        this.showPopup = true;
        let this_app = this;

        setTimeout(function() {
          this_app.showSignature = true;
          this_app.$refs.signaturePad.clearSignature();
        }, 500);
      },
      resetSignature() {
        this.$refs.signaturePad.clearSignature();
      },
      saveSignature() {
        const {isEmpty, data} = this.$refs.signaturePad.saveSignature();
        // console.log(isEmpty);
        // console.log(data);
        this.showPopup = false;
        this.showSignature = false;

        if (!isEmpty) {
          this.$refs.file_upload.upload_file(this.user_token,
            "calls",
            this.call_id, data,
            "signature.png", function (file) {
              this.postMessage(file.type, file.id);
            });
        } else {
          console.log("empty!! why???")
        }
      },
      fileUploaded(file) {
        this.postMessage(file.type, file.id);
      },
      sendMsg() {
        let this_app = this;

        if (!this.typedMessage) return

        this.postMessage('text', this.typedMessage, function () {
          this_app.typedMessage = '';
        })

      },
      postMessage(type, value, onDone = null) {
        const params = {
          "guest_token": this.user_token,
          "call_id": this.call_id,
          "message_type": type,
          "value": value
        };

        axios.post(process.env.api_url + "/calls/send_message", params).then(function (res) {
          if (onDone != null) {
            onDone()
          }
        }.bind(this));
      },
      addChat(chat) {
        this.chatData.push(chat)
      },
    },
    components: {
      VuePerfectScrollbar,
      ChatLog,
      FileUpload
    },
    created() {
    },
  }
</script>
