<template>
    <div id="component-chat-log" class="m-8">
        <div v-for="(msg, index) in chatData" class="msg-grp-container" :key="index">

<!--          call_id: 1552-->
<!--          message_type: "text"-->
<!--          time: 1588386907959-->
<!--          user_id: 12-->
<!--          user_type: "vu"-->
<!--          value: "sd"-->

            <div class="flex items-start" :class="[{'flex-row-reverse' : isMe(msg.user_type)}]">
                <div class="msg break-words relative shadow-md rounded py-3 px-4 mb-2 rounded-lg max-w-sm" :class="{'bg-primary-gradient text-white': isMe(msg.user_type), 'border border-solid border-transparent bg-white': !isMe(msg.user_type)}">
                    <span>{{ msg.value }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default{
  props: {
    // userId: {
    //   type: Number,
    //   required: true
    // },
    chatData: {
      type: Array,
      required: true
    }
  },
  computed: {

    // chatData () {
    //   return this.$store.getters['chat/chatDataOfUser'](this.userId)
    // },
    activeUserImg () {
      return this.$store.state.AppActiveUser.photoURL
    },
    senderImg () {
      // return (isSentByActiveUser) => {
      //   if (isSentByActiveUser) return this.$store.state.AppActiveUser.photoURL
      //   else return this.$store.getters['chat/contact'](this.userId).photoURL
      // }
    },
    hasSentPreviousMsg () {
      return (last_sender, current_sender) => last_sender === current_sender
    }
  },
  methods: {
    isMe(user_type){
      return user_type == 'vu'
    },
    // isSameDay (time_to, time_from) {
    //   const date_time_to = new Date(Date.parse(time_to))
    //   const date_time_from = new Date(Date.parse(time_from))
    //   return date_time_to.getFullYear() === date_time_from.getFullYear() &&
    //             date_time_to.getMonth() === date_time_from.getMonth() &&
    //             date_time_to.getDate() === date_time_from.getDate()
    // },
    // toDate (time) {
    //   const locale = 'en-us'
    //   const date_obj = new Date(Date.parse(time))
    //   const monthName = date_obj.toLocaleString(locale, {
    //     month: 'short'
    //   })
    //   return `${date_obj.getDate()  } ${   monthName}`
    // },
    scrollToBottom () {
      this.$nextTick(() => {
        this.$parent.$el.scrollTop = this.$parent.$el.scrollHeight
      })
    }
  },
  updated () {
    this.scrollToBottom()
  },
  mounted () {
    this.scrollToBottom()
  }
}
</script>
