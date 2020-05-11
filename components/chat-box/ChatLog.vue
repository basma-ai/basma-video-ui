<template>
  <div id="component-chat-log" class="m-8">
    <div v-for="(msg, index) in chatData" class="msg-grp-container" :key="index">

      <div class="flex items-start"
           :class="[{'flex-row-reverse animate__animated animate__fadeInLeft' : isMe(msg.user_type)}]">
        <div class="msg break-words relative shadow-md rounded px-4 mb-2 rounded-lg max-w-sm"
             :class="{'bg-primary-gradient text-white': isMe(msg.user_type), 'border border-solid border-transparent bg-white': !isMe(msg.user_type)}">
          <div class="speech-bubble">
            <span v-if="msg.message_type == 'text'">{{ msg.value }}</span>
            <span v-else><ChatFile :file_type="msg.message_type" :guest_token="user_token" :file_id="msg.value"></ChatFile></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import ChatFile from './ChatFile.vue'

  export default {
    props: {
      user_token: {
        type: String,
        required: true
      },
      chatData: {
        type: Array,
        required: true
      }
    },
    components: {
      ChatFile
    },
    computed: {},
    methods: {
      isMe(user_type) {
        return user_type == 'vu'
      },
      scrollToBottom() {
        this.$nextTick(() => {
          this.$parent.$el.scrollTop = this.$parent.$el.scrollHeight
        })
      }
    },
    updated() {
      this.scrollToBottom()
    },
    mounted() {
      this.scrollToBottom()
    }
  }
</script>

<style>
  .speech-bubble {
    display: inline-block;
    position: relative;
    background: rgba(255, 255, 255, 0.2);
    border-radius: .4em;
    padding: 5px;
  }
</style>
