<template>
  <div>
    <v-container class="text-center" v-if="initialLoading">
      <v-progress-circular :size="70" color="amber" indeterminate>
      </v-progress-circular>
    </v-container>

    <v-container v-if="inOperation && isCustomerViewEnabled">
      <!-- Check if the user is using iOS but not Safari -->
      <v-overlay :value="isItIOS && !isItMobileSafari">
        <v-card color="#FFFFFF" height="100%" width="100%">
          <!-- <v-card-title class="justify-center"> -->
          <!-- <v-icon large left>
            mdi-apple-safari
          </v-icon> -->
          <!-- <span -->
          <!-- style="text-align: center;"
          class="title font-weight-bold"
          >😁 Basma Alert 😁 -->
          <!-- </span> -->
          <!-- </v-card-title> -->

          <v-card-text class="headline">
            <p style="text-align: justify; color: black">Ooops..!</p>
            <p style="text-align: justify; color: black">
              On iOS devices, the platform can be used only in Safari browser.
              Kindly use Safari for full compatibility.
            </p>
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

      <div style="text-align: center;">
        <v-card
          :loading="loading"
          style="width: 100%; max-width: 900px; display: inline-block;"
        >
          <div class="text-center" style="padding: 20px;">
            <div v-if="screen_status != 'call_waiting_for_agent'">
              <img id="vendor-logo" :src="vendor.logo_url"/>
              <br/><br/>
            </div>

            <!-- Main Screen -->
            <div v-if="screen_status == 'main'">
              <!-- user input data -->
              <v-form v-model="formValid" ref="form">
                <v-container style="text-align: justify;">
                  <div style="display: inline-block; width: 100%;">
                    <!-- read the fields from the db, and then show them according to their type -->
                    <div
                      v-for="(field, index) in vendor.custom_fields"
                      v-bind:key="field.id"
                    >
                      <v-text-field
                        v-if="field.type === 'text'"
                        v-model="field.value"
                        :label="field.label + (field.is_mandatory ? '*' : '')"
                        :rules="field.is_mandatory ? requiredRules : []"
                      >
                      </v-text-field>

                      <v-text-field
                        v-if="field.type === 'number'"
                        v-model="field.value"
                        :label="field.label + (field.is_mandatory ? '*' : '')"
                        :rules="field.is_mandatory ? requiredRules : []"
                      >
                      </v-text-field>

                      <v-checkbox
                        v-if="field.type === 'boolean'"
                        v-model="field.value"
                        :label="field.label + (field.is_mandatory ? '*' : '')"
                        :rules="field.is_mandatory ? requiredRules : []"
                        style="text-align: justify;"
                      >
                      </v-checkbox>
                    </div>
                  </div>
                </v-container>

                <br/><br/>

                <v-btn
                  large
                  :disabled="!formValid"
                  color="success"
                  @click="request_video_token"
                >
                  <v-icon top>fas fa-video</v-icon>
                </v-btn>
              </v-form>
            </div>

            <!-- Getting Vendor Screen -->
            <div v-if="screen_status == 'getting_services'">
              Getting Services List..
            </div>

            <!-- Services List -->
            <div v-if="screen_status == 'services_list'">
              <v-btn
                v-for="service in services_list"
                :key="service.id"
                @click="start_call(service)"
                style="margin: 10px;"
              >
                {{ service.name }}
              </v-btn>

              <br/><br/><br/>

              <v-btn @click="screen_status = 'main'" outlined
              >Start Again
              </v-btn>
            </div>

            <!-- Video Connecting Screen -->
            <div v-if="screen_status == 'video_connecting'">
              Connecting you..
            </div>

            <!-- Starting a Call -->
            <div v-if="screen_status == 'starting_call'">
              Starting a call..
            </div>

            <!-- Waiting for an Agent -->
            <div v-if="screen_status == 'call_waiting_for_agent'">
              <h1 style="margin-bottom: 20px;">#{{ queue_count + 1 }}</h1>

              <p>You are now in line</p>

              <!-- This is to show the queue line -->
              <div v-if="queue_count != 0">
                <div style="margin-bottom: 20px;">
                  <b style="font-size: 23px;" v-for="n in queue_count">
                    😁
                  </b>
                  <b style="font-size: 23px;">
                    😇
                  </b>
                </div>

                <p v-if="estimated_waiting_time != 0"></p>
                <p>
                  <b style="font-size: 30px;">⏳</b>
                  <span>{{ estimated_waiting_time }}</span>
                </p>
              </div>

              <div id="breathing">
                <img :src="vendor.logo_url"/>
              </div>

              <v-btn @click="cancel_call()">
                Cancel Call
              </v-btn>
            </div>

            <!-- In Call -->
            <div v-if="screen_status == 'in_call'">
              <div
                v-if="
                  call != null &&
                    call.status == 'started' &&
                    call.connection_guest_token != null
                "
              >
                <v-chip outlined style="margin-bottom: 15px"
                >
                  <v-avatar
                  >
                    <v-icon color="#FFB600"
                    >mdi-account-circle
                    </v-icon
                    >
                  </v-avatar
                  >
                  You are being served by {{ call.vu.name }}
                </v-chip
                >

                <CallBox
                  v-if="screen_status == 'in_call'"
                  ref="call_box"
                  :connection_token="call.connection_guest_token"
                  :room_name="'call-' + call.id"
                  style="width: 100%;"
                >
                </CallBox>
                <br/><br/>

                <v-btn @click="end_call()">End Call</v-btn>
              </div>
            </div>

            <!-- Call Ended -->
            <div v-if="screen_status == 'call_ended'">
              <div style="text-align: center; font-size: 15px;">
                <div v-if="rating == 0">
                  <h3>Kindly rate our service :)</h3>
                  <br/>

                  <!-- rating component -->
                  <awesome-rating
                    @rating_set="submitRating($event)"
                  ></awesome-rating>
                  <br/>
                </div>

                <!-- show the message & button once the user completes the rating-->
                <div v-if="rating != 0">
                  <h3>Thanks for calling .. Goodbye!</h3>
                  <br/>
                  <v-btn
                    v-if="call_token == null"
                    @click="screen_status = 'main'"
                  >
                    Back to Home
                  </v-btn>
                </div>

                <br/>
                <br/><br/>
                <img
                  :src="bye_gifs[Math.floor(Math.random() * bye_gifs.length)]"
                  style="width: 100%; max-width: 300px;"
                />
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <br/>

      <div style="text-align: center; color: #626262">
        powered by
        <a
          href="http://basma.ai"
          target="_blank"
          style="color: #FFB600; text-decoration: none;"
        >basma.ai</a
        >
      </div>
    </v-container>

    <!-- <v-container v-if="!inOperation && !initialLoading">
      <v-overlay>
        <v-card color="#FFFFFF" height="100%" width="100%">
          <v-card-text class="headline">
            <p style="text-align: justify; color: black">Oooops..!</p>
            <p style="text-align: justify; color: black">
              The branch is now closed.
            </p>
          </v-card-text>
        </v-card>
      </v-overlay>
    </v-container> -->

    <v-container v-if="!isCustomerViewEnabled && !initialLoading">
      <v-overlay>
        <v-card color="#FFFFFF" height="100%" width="100%">
          <!-- <v-card-title class="justify-center"> -->
          <!-- <v-icon large left>
            mdi-apple-safari
          </v-icon> -->
          <!-- <span -->
          <!-- style="text-align: center;"
          class="title font-weight-bold"
          >😁 Basma Alert 😁 -->
          <!-- </span> -->
          <!-- </v-card-title> -->

          <v-card-text class="headline">
            <p style="text-align: justify; color: black">Ooops..!</p>
            <p style="text-align: justify; color: black">
              You can't call {{ vendor_username }}
            </p>
          </v-card-text>
        </v-card>
      </v-overlay>
    </v-container>
  </div>
</template>
<script>
  import axios from "axios";
  import CallBox from "@/components/CallBox.vue";
  import AwesomeRating from "../components/AwesomeRating";
  import {isIOS, isMobileSafari} from "mobile-device-detect";

  const humanizeDuration = require("humanize-duration");
  // const moment = require("moment");

  export default {
    data: () => ({
      isItIOS: isIOS,
      inOperation: true,
      isCustomerViewEnabled: true,
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
      call_id: 0,
      call: null,
      bye_gifs: [
        // "https://media.giphy.com/media/SV0q8t76HtGi9W9WQu/giphy.gif",
        // "https://media.giphy.com/media/fMA8fQ06Q2wHxIX9ie/giphy.gif",
        "https://media.giphy.com/media/TfdeaxOGjOGzZ1DbBW/giphy.gif",
        "https://media.giphy.com/media/IcdTrgVoYTK1PR2B6n/giphy.gif"
      ],
      rating: 0,
      call_token: null
    }),

    components: {
      CallBox,
      AwesomeRating
    },

    methods: {
      submitRating: function (event) {
        this.rating = event.rating;
        "submit rating:", this.rating;
        let this_app = this;
        axios
          .post(process.env.api_url + "/calls/submit_rating", {
            guest_token: this_app.guest_token,
            call_id: this_app.call_id,
            rating: this_app.rating,
            feedback_text: ""
          })
          .then(function (response) {
            this_app.guest_token = null;
            this_app.call_id = 0;
          })
          .catch(function (error) {
            // (error);
          });
      },

      load_data: function () {
        ("in load_data");
        this.initialLoading = true;

        // const { sortBy, descending, page, rowsPerPage } = this.pagination;

        let this_app = this;
        axios
          .post(process.env.api_url + "/guest/get_vendor", {
            vendor_username: this.vendor_username
          })
          .then(function (response) {
            if (response.data.success) {
              this_app.vendor = response.data.data.vendor;
              // this_app.checkWorkingHours();
              this_app.checkCustomerView();
              this_app.initialLoading = false;
            } else {
              // // ("it's a failure!");
            }

            this_app.initialLoading = false;
          })
          .catch(function (error) {
            // (error);
          });
      },

      checkCustomerView: function () {
        if (this.vendor.is_customer_view_enabled) {
          this.isCustomerViewEnabled = true;
        }
      },

      checkWorkingHours: function () {
        let workingHours = JSON.parse(this.vendor.working_hours);
        let today = moment()
          .format("dddd")
          .toLowerCase();
        let todayVendor = workingHours[today][0];
        let now = moment().format("hhmm");
        let isNowOpen = moment(now).isBetween(
          todayVendor["open"],
          todayVendor["close"]
        );

        if (!todayVendor["isOpen"] || (todayVendor["isOpen"] && !isNowOpen)) {
          this.inOperation = false;
        } else {
          this.inOperation = true;
        }
      },

      request_video_token: function () {
        this.screen_status = "video_connecting";
        this.loading = true;
        let this_app = this;

        axios
          .post(process.env.api_url + "/guest/request_token")
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

              this_app.screen_status = "call_waiting_for_agent";

              // call the socket
              const params = {
                user_type: "guest",
                user_token: this_app.guest_token,
                call_id: this_app.call_id
              };

              this_app.$socket.emit("start_socket", params);
            } else {
              //
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
        // this.$refs.call_box.end_call();

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
        this.loading = true;
        this.call = null;
        this.$refs.call_box.end_call();

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
          .post(process.env.api_url + "/guest/request_token")
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
                  this_app.screen_status = "call_waiting_for_agent";
                  this_app.call_id = response.data.data.call_id;

                  // call the socket
                  const params = {
                    user_type: "guest",
                    user_token: this_app.guest_token,
                    call_id: this_app.call_id
                  };

                  this_app.$socket.emit("start_socket", params);

                  this_app.on_call_update(response.data.data.call_info);
                  this_app.loading = false;
                })
                .catch(err => {
                  this_app.loading = false;
                });

              setTimeout(function () {
                // if (this_app.screen_status == 'call_waiting_for_agent' || this_app.screen_status == 'in_call') {
                this_app.refresh_call();
                // }
              }, 1000);
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
            this_app.screen_status = "call_waiting_for_agent";
            this_app.call_id = response.data.data.call_id;

            // call the socket
            const params = {
              user_type: "guest",
              user_token: this_app.guest_token,
              call_id: this_app.call_id
            };

            this_app.$socket.emit("start_socket", params);

            this_app.on_call_update(response.data.data.call_info);
            this_app.loading = false;

            setTimeout(function () {
              if (
                this_app.call.status != "started" &&
                this_app.call.status != "ended"
              ) {
                this_app.refresh_call();
              }
            }, 1000);
          })
          .catch(err => {
            this_app.loading = false;
          });
      },
      on_call_update(call_info) {
        const this_app = this;

        this_app.call = call_info.call;
        this_app.queue_count = call_info.queue_count;
        this_app.estimated_waiting_time = call_info.estimated_waiting_time;
        this_app.estimated_waiting_time = humanizeDuration(
          this_app.estimated_waiting_time,
          {
            round: true,
            units: ["h", "m"]
          }
        );

        if (this_app.call != null && this_app.call.status === "started") {
          this_app.screen_status = "in_call";
        } else if (call_info.errors != null && call_info.errors.length > 0) {
          if (call_info.errors[0] === "call_ended") {
            if (undefined !== this_app.$refs.call_box) {
              this_app.$refs.call_box.end_call();
            }
            this_app.screen_status = "call_ended";
            this_app.rating = 0;
            this_app.call = null;
            this_app.selected_service = null;
          }
        }
      }
    },
    created() {
      let this_app = this;
      this_app.call_token = this_app.$route.query.token;

      this_app.vendor_username = this_app.$route.params.vendor_username;

      // TODO: verify the vendor username first before getting the vendor data
      this_app.load_data();

      if (this_app.call_token != null) {
        this.join_call_by_token(this.$route.query.token);
      }
    },

    mounted() {
    },

    sockets: {
      connect: function () {
      },
      on_update: function (data) {
        let this_app = this;

        this_app.on_call_update(data.data);
      }
    }
  };
</script>
