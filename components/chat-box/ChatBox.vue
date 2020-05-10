<template>
  <div id="chat-app" class="border border-solid d-theme-border-grey-light rounded relative overflow-hidden">
    <div class="chat__bg chat-content-area" >
      <template>
        <VuePerfectScrollbar class="chat-content-scroll-area" :settings="settings">
          <div class="chat__log" ref="chatLog">
            <chat-log :user_token="user_token" :chatData="chatData"></chat-log>
          </div>
        </VuePerfectScrollbar>
        <div class="chat__input flex p-4 bg-white">
          <vs-input class="flex-1" placeholder="Type Your Message.." v-model="typedMessage" @keyup.enter="sendMsg" />
          <vs-button radius icon="send" type="filled" @click="sendMsg" color="secondary"></vs-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import ChatLog             from './ChatLog.vue'
  import VuePerfectScrollbar from 'vue-perfect-scrollbar'

  import axios from "axios";

  export default {
    props: ['user_token','call_id'],
    data () {
      return {
        typedMessage         : '',
        settings             : {
          maxScrollbarLength : 60,
          wheelSpeed         : 0.70
        },
        chatData: []
      }
    },
    watch: {
    },
    computed: {
    },
    methods: {
      fileUploaded(file) {
        this.postMessage(file.type, file.id);
      },
      sendMsg() {
        let this_app = this;

        if (!this.typedMessage) return

        this.postMessage('text', this.typedMessage, function() {
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
          if(onDone != null) {
            onDone()
          }
        }.bind(this));
      },
      addChat(chat){
        this.chatData.push(chat)
      },
    },
    components: {
      VuePerfectScrollbar,
      ChatLog
    },
    created () {
    },
  }
</script>
