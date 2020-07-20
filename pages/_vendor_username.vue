<template>
  <div :class="{'in-call': screen_status == 'in_call'}">
    <!-- initial loading is used to show loading animation until all vendor data is retrieved from db -->
    <v-container class="text-center" v-if="initialLoading">
      <v-progress-circular style="margin-top: 20px" :size="70" color="amber" indeterminate></v-progress-circular>
    </v-container>

    <!-- Check if the user is using iOS but not Safari -->
    <v-container v-if="isItIOS && !isItMobileSafari">
      <v-overlay>
        <v-card color="#FFFFFF" height="100%" width="100%">
          <v-card-text class="headline">
            <p style="text-align: justify; color: black">{{$t('ooops')}}</p>
            <p style="text-align: justify; color: black">{{$t('unsupportedBrowser')}}</p>
          </v-card-text>

          <v-layout justify-center>
            <v-card-actions class="justify-center">
              <v-list-item class="grow">
                <v-list-item-avatar size="100">
                  <v-img
                    class="elevation-6"
                    src="https://www.apple.com/v/safari/k/images/overview/safari_icon__ep64chrczuky_large_2x.jpg"
                  ></v-img>
                </v-list-item-avatar>
              </v-list-item>
            </v-card-actions>
          </v-layout>
        </v-card>
      </v-overlay>
    </v-container>

    <!-- Check if is within working hours -->
    <v-container v-if="!inOperation && !initialLoading">
      <v-overlay>
        <v-card color="#FFFFFF" height="100%" width="100%">
          <v-card-text class="headline">
            <p style="text-align: justify; color: black">{{$t('ooops')}}</p>
            <p style="text-align: justify; color: black">{{$t('branchClosed')}}</p>
          </v-card-text>
        </v-card>
      </v-overlay>
    </v-container>

    <!-- Check if customer view is enabled -->
    <v-container v-if="!isCustomerViewEnabled && !initialLoading && call_token == null">
      <v-overlay>
        <v-card color="#FFFFFF" height="100%" width="100%">
          <v-card-text class="headline">
            <p style="text-align: justify; color: black">{{$t('ooops')}}</p>
            <p style="text-align: justify; color: black">{{$t('cantCall')}}</p>
          </v-card-text>
        </v-card>
      </v-overlay>
    </v-container>

    <v-container v-if="!initialLoading">
      <div style="text-align: center;">
        <v-card :loading="loading" style="width: 100%; max-width: 900px; display: inline-block;">

          <div v-if="false" id="change-lang">
            <vs-button color="secondary" size="small" type="border" v-if="$i18n.locale === 'en'" flat
                       @click="switchLang('ar')">عربي
            </vs-button>
            <vs-button color="secondary" size="small" type="border" v-if="$i18n.locale === 'ar'" flat
                       @click="switchLang('en')">English
            </vs-button>
          </div>

          <div class="text-center" style="padding: 20px;">
            <div id="vendor-logo" v-if="screen_status != 'waiting_for_agent' && screen_status != 'calling' && screen_status != 'waiting_for_agent_no_ring'">
              <img :src="vendor.logo_url"/>
            </div>

            <!-- Step 1: Custom Fields -->
            <div v-if="screen_status == 'main'">
              <custom-fields :is_agent_view="false" v-if="vendor.custom_fields != null"
                             :custom_fields="vendor.custom_fields" @submit="request_video_token"></custom-fields>
            </div>

            <!-- Getting Vendor Screen -->
            <div v-if="screen_status == 'getting_services'">{{$t('gettingServices')}}</div>

            <!-- Services List -->
            <div v-if="screen_status == 'services_list'">
              <vs-row vs-align="flex-end"
                      vs-type="flex" vs-justify="flex-start" vs-w="12">
                <vs-col vs-type="flex" vs-justify="center" vs-align="center" vs-lg="4" vs-sm="6" vs-xs="12"
                        v-for="service in services_list"
                        :key="service.id">

                  <vs-button color="dark" type="border" size="large" class="w-full mb-3 mr-3"
                             @click="start_call(service)">
                    <h3>
                      {{ service.name }}
                    </h3>
                  </vs-button>
                </vs-col>
              </vs-row>

              <vs-button type="border" @click="screen_status = 'main'">{{$t('startAgain')}}</vs-button>
            </div>

            <!-- Video Connecting Screen -->
            <div v-if="screen_status == 'video_connecting'">{{$t('videoConnecting')}}</div>

            <!-- Starting a Call -->
            <div v-if="screen_status == 'starting_call'">{{$t('startingCall')}}</div>

            <!-- Waiting for an Agent -->
            <div v-if="screen_status == 'waiting_for_agent' || screen_status == 'calling'">
              <p>{{$t('callWaiting')}}</p>

              <h1 style="margin-bottom: 20px;">#{{ queue_count + 1 }}</h1>

              <!-- This is to show the queue line -->
              <div v-if="queue_count != 0">
                <div style="margin-bottom: 20px;">
                  <b style="font-size: 23px;" v-for="n in queue_count">😁</b>
                  <b style="font-size: 23px;">😇</b>
                </div>

                <p v-if="estimated_waiting_time != 0"></p>
                <p>
                  <b style="font-size: 30px;">⏳</b>
                  <span>{{ estimated_waiting_time }}</span>
                </p>
              </div>

              <div class="breathing">
                <img :src="vendor.logo_url"/>
              </div>

              <v-btn @click="cancel_call()">{{$t('endCall')}}</v-btn>
            </div>

            <!-- Waiting for an Agent No Ring -->
            <div v-if="screen_status == 'waiting_for_agent_no_ring'">
              <p>{{$t('callWaitingNoRing')}}</p>

              <div class="breathing">
                <img :src="vendor.logo_url"/>
              </div>

              <v-btn @click="cancel_call()">{{$t('endCall')}}</v-btn>
            </div>

            <!-- In Call -->
            <div id="in-call" v-if="screen_status == 'in_call'">
              <div
                v-if="
                  call != null &&
                    call.status == 'started' &&
                    call.connection_guest_token != null
                "
              >
                <v-chip outlined style="margin-bottom: 15px; direction: rtl;">
                  <v-avatar>
                    <v-icon color="#FFB600">mdi-account-circle</v-icon>
                  </v-avatar>
                  {{$t('servedBy')}} {{ call.vu.name }}
                </v-chip>

                <CallBox
                  v-if="screen_status == 'in_call'"
                  ref="call_box"
                  :connection_token="call.connection_guest_token"
                  :room_name="'call-' + call.id"
                  :can_end_call="true"
                  style="width: 100%;"
                  @endCall="end_call"
                ></CallBox>
                <ChatBox ref="chatbox" :user_token="guest_token" :call_id="call.id"
                         style="margin-bottom: 15px"></ChatBox>
              </div>
            </div>

            <!-- Call Ended -->
            <div v-if="screen_status == 'call_ended'">
              <div style="text-align: center; font-size: 15px;">
                <div v-if="show_rating">
                  <!-- <h3>{{$t('ratingHeader')}}</h3> -->
                  <br/>

                  <!-- rating component -->
                  <h3>{{$t('ratingMsg')}}</h3>
                  <br/>
                  <awesome-rating @rating_set="setRating($event)"></awesome-rating>
                  <br/>
                  <br/>

                  <v-textarea
                    v-model="feedback"
                    counter
                    :rules="feedbackRule"
                    :label="$t('feedbackMsg')"
                    rows="3"
                    row-height="20"
                    :auto-grow="true"
                    :clearable="true"
                    :outlined="true"
                    :rounded="true"
                    :solo="true"
                  ></v-textarea>

                  <v-btn
                    large
                    :disabled="feedback.length >300"
                    color="success"
                    @click="submitRating()"
                  >{{$t('submit')}}
                  </v-btn>
                </div>

                <!-- show the message & button once the user completes the rating-->
                <div v-if="!show_rating">
                  <h3>{{$t('thankYou')}}</h3>
                  <br/>
                  <v-btn
                    v-if="call_token == null"
                    @click="backToMain"
                  >{{$t('backToMain')}}
                  </v-btn>
                  <br>
                  <img
                    :src="bye_gifs[Math.floor(Math.random() * bye_gifs.length)]"
                    style="width: 100%; max-width: 300px;"
                  />
                </div>

              </div>
            </div>
          </div>
        </v-card>
      </div>

      <div :class="{'hide-on-mobile': screen_status == 'in_call'}" style="text-align: center; color: #626262; margin-top: 20px">
        powered by
        <a
          href="http://basma.ai"
          target="_blank"
          style="color: #FFB600; text-decoration: none;"
        >basma.ai</a>
      </div>
    </v-container>
  </div>
</template>
<script>
  import axios from "axios";
  import CallBox from "@/components/CallBox.vue";
  import ChatBox from '@/components/chat-box/ChatBox.vue'
  import AwesomeRating from "../components/AwesomeRating";
  import CustomFields from "../components/CustomFields";
  import {isIOS, isMobileSafari} from "mobile-device-detect";
  import {type} from "vuesax";
  import Vue from "vue";

  const humanizeDuration = require("humanize-duration");
  const moment = require("moment");

  export default {
    data: () => ({
      isItIOS: isIOS,
      inOperation: false,
      isCustomerViewEnabled: false,
      isItMobileSafari: isMobileSafari,
      formValid: false,
      nameRules: [v => !!v || "Customer Name is required!"],
      requiredRules: [v => !!v || "This field is required!"],
      phoneRules: [
        v => /[0-9]/.test(v) || "Phone is invalid, enter digits only",
        v => v.length == 8 || "Phone must be 8 digits only",
        v => !!v || "Phone is required!"
      ],
      initialLoading: false,
      loading: false,
      vendor: {},
      screen_status: "main",
      guest_token: null,
      services_list: [],
      test_variable: null,
      vendor_username: 0,
      queue_count: 100,
      estimated_waiting_time: 0,
      selected_service: null,
      show_rating: false,
      call_id: 0,
      call: null,
      bye_gifs: [
        // "https://media.giphy.com/media/SV0q8t76HtGi9W9WQu/giphy.gif",
        // "https://media.giphy.com/media/fMA8fQ06Q2wHxIX9ie/giphy.gif",
        "https://media.giphy.com/media/TfdeaxOGjOGzZ1DbBW/giphy.gif",
        "https://media.giphy.com/media/IcdTrgVoYTK1PR2B6n/giphy.gif"
      ],
      ringtone_audio: null,
      rating: 0,
      feedback: "",
      feedbackRule: [v => v.length <= 300 || "Max 300 characters"],
      call_token: null
    }),

    components: {
      CallBox,
      ChatBox,
      AwesomeRating,
      CustomFields
    },

    methods: {
      backToMain() {
        if(process.client) {
          location.reload();
        }
      },

      startRingtone() {
        this.ringtone_audio = new Audio('https://basma-cdn.s3.me-south-1.amazonaws.com/assets/audio/customer_default_ringtone.mp3');

        if (this.ringtone_audio != null) {
          this.ringtone_audio.play();
        }

        this.ringtone_audio.loop = true;
        this.ringtone_audio.volume = 1;
      },

      switchLang(locale) {
        console.log('navigator.language', navigator.language.slice(0, 2));

        if (locale === this.$store.state.i18n.locale) {
          return;
        }

        // update store info
        this.$store.commit('SET_LANG', locale);

        // fetch new locale file
        import(`../locales/${locale}`).then(module => {
          // update i18n's locale instance
          this.$i18n.locale = locale;
          // set new messages from new locale file
          this.$i18n.setLocaleMessage(locale, module.default);
          // update url to point to new path, without reloading the page
          window.history.replaceState('', '', this.switchLocalePath(locale));
        });
      },

      setRating: function (event) {
        this.rating = event.rating;
      },

      submitRating: function () {
        let this_app = this;

        axios
          .post(process.env.api_url + "/calls/submit_rating", {
            guest_token: this_app.guest_token,
            call_id: this_app.call_id,
            rating: this_app.rating,
            feedback_text: this_app.feedback
          })
          .then(function (response) {
            this_app.guest_token = null;
            this_app.call_id = 0;
            this_app.rating = 0;
            this_app.feedback = "";
            this_app.show_rating = false;
          })
          .catch(function (error) {
          });
      },

      load_data: function (onDone = null) {
        this.initialLoading = true;

        let this_app = this;
        axios
          .post(process.env.api_url + "/guest/get_vendor", {
            vendor_username: this.vendor_username
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.vendor = response.data.data.vendor;
              this_app.checkWorkingHours();
              this_app.checkCustomerView();
              this_app.initialLoading = false;
              if (onDone != null) {
                onDone()
              }
            } else {
            }

            this_app.initialLoading = false;
          })
          .catch(function (error) {
          });
      },

      checkCustomerView: function () {
        if (this.vendor.is_customer_view_enabled) {
          this.isCustomerViewEnabled = true;
        }
      },

      checkWorkingHours: function () {
        let vendorWorkingHours = JSON.parse(this.vendor.working_hours);
        let today = moment()
          .format("dddd")
          .toLowerCase();
        let now = moment().format("HHmm");

        let vendorTodayHours = vendorWorkingHours[today];

        for (let timeSlot of vendorTodayHours) {
          //if vendor is open today, then check its open and close hours
          if (timeSlot["isOpen"]) {
            if (
              (timeSlot["open"] == "24hrs" && timeSlot["close"] == "24hrs") ||
              (timeSlot["open"] == "" && timeSlot["close"] == "")
            ) {
              this.inOperation = true;
              break;
            }
            //if vendor is open, but not for 24hrs, then check if current time is between open & close?
            else if (moment(now).isBetween(timeSlot["open"], timeSlot["close"])) {
              this.inOperation = true;
              break;
            }
          } else {
            //do nothing, go to next timeSlot
          }
        }
      },

      request_video_token: function () {
        this.screen_status = "video_connecting";
        this.loading = true;
        let this_app = this;

        axios
          .post(process.env.api_url + "/guest/request_token", {"vendor_id": this.vendor.id})
          .then(function (response) {
            if (response.data.success) {
              this_app.guest_token = response.data.data.token;
              this_app.get_services();
            } else {
              //
            }

            this_app.loading = false;
          })
          .catch(function (error) {
          });
      },

      get_services: function () {
        this.screen_status = "getting_services";
        this.loading = true;

        let this_app = this;
        axios
          .post(process.env.api_url + "/calls/get_services", {
            guest_token: this.guest_token,
            vendor_id: this.vendor.id
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.services_list = response.data.data.services;
              this_app.screen_status = "services_list";
            } else {
            }

            this_app.loading = false;
          })
          .catch(function (error) {
          });
      },

      start_call: function (service = null) {
        if (service != null) {
          this.selected_service = service;
        }

        this.screen_status = "starting_call";
        this.loading = true;

        let this_app = this;
        axios
          .post(process.env.api_url + "/calls/start_call", {
            guest_token: this.guest_token,
            service_id: this.selected_service.id,
            custom_fields_values: this.vendor.custom_fields
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.call_id = response.data.data.call_id;

              this_app.call = response.data.data.call_info.call;
              this_app.queue_count = response.data.data.call_info.queue_count;
              this_app.estimated_waiting_time =
                response.data.data.call_info.estimated_waiting_time;
              this_app.estimated_waiting_time = humanizeDuration(
                this_app.estimated_waiting_time,
                {
                  round: true,
                  units: ["h", "m"]
                }
              );

              this_app.screen_status = "waiting_for_agent";

              // call the socket
              const params = {
                user_type: "guest",
                user_token: this_app.guest_token,
                call_id: this_app.call_id
              };

              this_app.$socket.emit("start_socket", params);
            } else {
            }

            this_app.loading = false;
          })
          .catch(function (error) {
          });
      },

      //cancel call is used only when the call has not been connected yet.
      cancel_call: function () {
        this.loading = true;
        this.call = null;

        let this_app = this;

        axios
          .post(process.env.api_url + "/calls/end_call", {
            guest_token: this.guest_token,
            call_id: this.call_id
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.screen_status = "services_list";
              this_app.loading = false;
              this_app.selected_service = null;
            } else {
            }
          })
          .catch(function (error) {
            this_app.loading = false;
          });
      },

      // end_call is used when both parties are actually in the call.
      end_call: function () {
        this.rating = 0;
        this.show_rating = true;
        this.loading = true;
        this.call = null;
        this.$refs.call_box.end_call();

        this.$socket.disconnect();
        let this_app = this;

        axios
          .post(process.env.api_url + "/calls/end_call", {
            guest_token: this.guest_token,
            call_id: this.call_id
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.screen_status = "call_ended";
              this_app.loading = false;
              this_app.selected_service = null;
            } else {
            }
          })
          .catch(function (error) {
            this_app.loading = false;
          });
      },
      join_call_by_token(token) {
        const this_app = this;

        this.screen_status = "video_connecting";
        this.loading = true;

        axios
          .post(process.env.api_url + "/guest/request_token", {"vendor_id": this.vendor.id})
          .then(function (response) {
            if (response.data.success) {
              this_app.guest_token = response.data.data.token;

              const params = {
                guest_token: this_app.guest_token,
                request_call_token: token
              };

              axios
                .post(process.env.api_url + "/calls/join", params)
                .then(response => {
                  this_app.call_id = response.data.data.call_id;

                  // call the socket
                  const params = {
                    user_type: "guest",
                    user_token: this_app.guest_token,
                    call_id: this_app.call_id
                  };

                  this_app.$socket.emit("start_socket", params);

                  this_app.on_call_update(response.data.data);
                  this_app.loading = false;
                })
                .catch(err => {
                  this_app.loading = false;
                });

              // setTimeout(function () {
              //   this_app.refresh_call();
              //   // }
              // }, 1000);
            } else {
              this_app.loading = false;
            }
          })
          .catch(function (error) {
          });
      },

      refresh_call() {
        let this_app = this;

        axios
          .post(process.env.api_url + "/calls/join", {
            guest_token: this.guest_token,
            request_call_token: this.$route.query.token
          })
          .then(response => {
            this_app.screen_status = "waiting_for_agent";
            this_app.call_id = response.data.data.call_id;

            // call the socket
            // const params = {
            //   user_type: "guest",
            //   user_token: this_app.guest_token,
            //   call_id: this_app.call_id
            // };

            // this_app.$socket.emit("start_socket", params);

            this_app.on_call_update(response.data.data);
            this_app.loading = false;

            setTimeout(function () {
              if (null != this_app.call) {
                if (
                  this_app.call.status != "started" &&
                  this_app.call.status != "ended"
                ) {
                  this_app.refresh_call();
                }
              }
            }, 1000);
          })
          .catch(err => {
            this_app.loading = false;
          });
      },
      on_call_update(data) {
        const this_app = this;

        if (undefined != data.call_info) {
          this_app.call = data.call_info.call;
          this_app.screen_status = this_app.call.status;
          this_app.queue_count = data.call_info.queue_count;
          this_app.estimated_waiting_time = data.call_info.estimated_waiting_time;
          this_app.estimated_waiting_time = humanizeDuration(
            this_app.estimated_waiting_time,
            {
              round: true,
              units: ["h", "m"]
            }
          );
        }

        if (undefined != data.call) {
          this_app.call = data.call;
        }

        if (this_app.call != null && this_app.call.status === "started") {
          this_app.screen_status = "in_call";
          return;
        } else if (this_app.call != null && this_app.call.status === "ended") {
          if (undefined !== this_app.$refs.call_box) {
            this_app.$refs.call_box.end_call();
          }
          this_app.screen_status = "call_ended";
          this_app.rating = 0;
          this_app.show_rating = true;
          this_app.call = null;
          this_app.selected_service = null;
          return;
        }

        if (undefined != data.call_info) {
          if (
            undefined != data.call_info.errors &&
            data.call_info.errors.length > 0 &&
            data.call_info.errors[0] === "call_ended"
          ) {
            this_app.screen_status = "call_ended";
            this_app.rating = 0;
            this_app.show_rating = data.show_rating;
            this_app.call = null;
            this_app.selected_service = null;
          }
        }

      }
    },

    created() {
      let this_app = this;

      this_app.switchLang(navigator.language.slice(0, 2));

      this_app.call_token = this_app.$route.query.token;

      this_app.vendor_username = this_app.$route.params.vendor_username;

      // TODO: verify the vendor username first before getting the vendor data
      this_app.load_data(function(){
        if (this_app.call_token != null) {
          this_app.join_call_by_token(this_app.$route.query.token);
        }
      });

    },

    beforeDestroy() {
      this.$socket.disconnect();
    },

    watch: {
      screen_status: function (val) {
        if (val == 'waiting_for_agent') {
          this.startRingtone();
        } else {
          if (null != this.ringtone_audio) {
            this.ringtone_audio.pause();
            this.ringtone_audio = null;
          }
        }
      }
    },

    mounted() {
    },

    sockets: {
      connect: function () {
      },
      on_update: function (data) {
        let this_app = this;

        if (data.type == "call_info") {
          this_app.on_call_update(data.data);
        } else if (data.type == "message") {
          if (data.data.message_type == "signature_request"){
            this_app.$refs.chatbox.openSignature();
          } else {
            this_app.$refs.chatbox.addChat(data.data);
          }
        }
      }
    }
  };
</script>

<style lang="scss">
  div#controls {
    bottom: 50px !important;
    /*margin-bottom: 0 !important;*/
    z-index: 1;
  }

  #in-call {
    position: relative;
  }

  #chat-app {
    bottom: 0;
    margin-bottom: 0 !important;
    padding-bottom: 10px !important;
    position: absolute;
    width: 100%;
    background: rgb(0, 0, 0);
    background: -moz-linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 95%);
    background: -webkit-linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 95%);
    background: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 95%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#000000", endColorstr="#000000", GradientType=1);

    .chat-content-scroll-area {
      min-height: 40px;
      max-height: 210px;
      overflow-y: scroll;
      .msg-grp-container {
        text-align: left;
        color: #fff;
        span {
          /*font-size: 14px;*/
        }
        .flex-row-reverse {
          color: #FFB600;
        }
      }
    }
    .vs-input-primary {
      float: left;
      /*left: 10px;*/
      margin-left: 10px;
      /*margin-right: 10px;*/
      /* Firefox */
      width: -moz-calc(100% - 130px);
      /* WebKit */
      width: -webkit-calc(100% - 130px);
      /* Opera */
      width: -o-calc(100% - 130px);
      /* Standard */
      width: calc(100% - 130px);

      input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #aaa !important;
        border-radius: 30px !important;
        color: #fff;
        padding-left: 20px;
        height: 44px;
      }

      .input-span-placeholder {
        color: #ffffff75;
        padding: 12px 20px;
        text-align: left;
      }
    }

    button {
      float: right;
      margin-right: 11px;
      right: 0;
    }
  }

  @media only screen and (max-width: 600px) {
    .in-call {
      height: 100%;

      #vendor-logo {
        z-index: 1;
        position: absolute;
        width: 100%;
        top: 10px;
        margin: 0;

        img {
          max-height: 36px;
          opacity: 0.5;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 5px;
          padding: 5px;
        }
      }

      > .container {
        padding: 0;
        height: inherit;

        > div:first-child {
          height: inherit;

          > .v-card {
            height: inherit;

            > div {
              height: inherit;
              padding: 0 !important;

              #in-call {
                height: inherit;

                > div {
                  height: inherit;
                }

                .call_box {
                  height: 100%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  background: #000;
                  overflow: hidden;
                  border: none !important;

                  #timer {
                    opacity: 0.8;
                  }

                  #controls {
                    position: absolute !important;
                  }

                  #local-media {
                    top: 10px;
                    left: 10px;

                    video {
                      border: none;
                      border-radius: 8px;
                      -webkit-box-shadow: 2px 3px 12px -6px rgba(0, 0, 0, 0.6);
                      -moz-box-shadow: 2px 3px 12px -6px rgba(0, 0, 0, 0.6);
                      box-shadow: 2px 3px 12px -6px rgba(0, 0, 0, 0.6);
                    }
                  }

                  #remote-media-div {
                    height: inherit;
                    div.participant {
                      height: inherit;
                    }
                    video {
                      max-height: 100% !important;
                    }
                  }
                }
              }
            }
          }
        }
      }

    }
  }
</style>
