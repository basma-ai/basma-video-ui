<template>
  <div>


    <v-container>

      <div style="text-align:center">
        <v-card :loading="loading" style="width:100%;max-width: 900px;display:inline-block">
          <div class="text-center" style="padding: 20px">

            <div v-if="screen_status != 'call_waiting_for_agent'">
              <img id="vendor-logo" :src="vendor.logo_url"/>
              <br/><br/>
            </div>


            <!-- Main Screen -->
            <div v-if="screen_status == 'main'">
              <!-- user input data -->
              <v-form v-model="formValid" ref="form">
                <v-container style="text-align: justify">

                  <div style="display: inline-block; width:100%;">

                    <!-- read the fields from the db, and then show them according to their type -->
                    <div v-for="(field, index) in vendor.custom_fields" v-bind:key="field.id"
                    >

                      <v-text-field v-if="field.type === 'text' || field.type === 'number'"
                                    v-model="field.value"
                                    :label="field.label + (field.is_mandatory? '*' : '')"
                                    :rules="field.is_mandatory ? requiredRules : []"
                      >

                      </v-text-field>

                      <v-checkbox v-if="field.type === 'boolean'"
                                  v-model="field.value"
                                  :label="field.label + (field.is_mandatory? '*' : '')"
                                  :rules="field.is_mandatory ? requiredRules : []"
                                  style="text-align: justify"
                      >
                      </v-checkbox>
                    </div>

                    <!-- v-bind is just to follow the guidelines of vue -->
                    <!--                    <v-text-field v-for="(field, index) in vendor.custom_fields" v-bind:key="field.id"-->
                    <!--                                  v-model="field.value"-->
                    <!--                                  :label="field.label"-->
                    <!--                                  :rules="field.is_mandatory ? requiredRules : []"-->
                    <!--                    >-->

                    <!--                    </v-text-field>-->

                  </div>

                </v-container>

                <div style="padding-top: 50%; width:100%; display: inline-block;">
                  <v-btn
                    large
                    :disabled="!formValid"
                    color="success"
                    @click="request_video_token">
                    <v-icon top>fas fa-video</v-icon>
                  </v-btn>
                </div>

              </v-form>


            </div>

            <!-- Getting Vendor Screen -->
            <div v-if="screen_status == 'getting_services'">
              Getting Services List
            </div>

            <!-- Services List -->
            <div v-if="screen_status == 'services_list'">

              <v-btn v-for="service in services_list" :key="service.id" @click="start_call(service)"
                     style="margin:10px">
                {{service.name}}
              </v-btn>

              <br/><br/>
              <v-btn @click="screen_status = 'main'" style="background-color: #ff3a47">Start Again</v-btn>

            </div>

            <!-- Video Connecting Screen -->
            <div v-if="screen_status == 'video_connecting'">
              Connecting You
            </div>


            <!-- Starting a Call -->
            <div v-if="screen_status == 'starting_call'">
              Starting a Call
            </div>

            <!-- Waiting for an Agent -->
            <div v-if="screen_status == 'call_waiting_for_agent'">
              <br/>

              <p>You are now in line</p>
              <h1 style="margin-bottom: 20px"> #{{queue_count+1}} </h1>

              <!-- This is to show the queue line -->
              <div v-if="queue_count != 0">
                <div style="margin-bottom: 20px">
                  <b style="font-size: 23px" v-for="n in queue_count">
                    😁
                  </b>
                  <b style="font-size: 23px">
                    😇
                  </b>
                </div>

                <p v-if="estimated_waiting_time != 0">
                <p>
                  <b style="font-size: 30px">⏳</b> <span>{{estimated_waiting_time}}</span>
                </p>
              </div>

              <div id="breathing">
                <img :src="vendor.logo_url"/>
              </div>

              <v-btn @click="cancel_call">
                Cancel Call
              </v-btn>
            </div>

            <!-- In Call -->
            <div v-if="screen_status == 'in_call'">
              <div v-if="call != null && call.status == 'started' && call.connection_guest_token != null">
                You are being served by: {{call.vu.name}}
                <div styte="height:10px"></div>

                <CallBox ref="call_box" :connection_token="call.connection_guest_token" :room_name="'call-'+call.id"
                         style="width:100%">

                </CallBox>
                <br/><br/>
                <v-btn @click="cancel_call">End Call</v-btn>
              </div>
            </div>

            <!-- Call Ended -->
            <div v-if="screen_status == 'call_ended'">

              <div style="text-align:center;font-size:15px">

                <h3>Thanks for calling!</h3>
                <h3>Kindly rate our service :)</h3>
                <br>

                <!-- rating component -->
                <awesome-rating @rating_set="submitRating($event)" v-if="rating === 0"></awesome-rating>
                <br>

                <!-- show the message once the user completes the rating-->
                <h3 v-if="rating !== 0">Call Ended, Good Bye!</h3>
                <br>

                <br>
                <!-- show back to home button once the user completes the rating-->
                <v-btn @click="screen_status = 'services_list'" v-if="rating !== 0">
                  Back to Home
                </v-btn>

                <br/><br/>
                <img :src="bye_gifs[Math.floor(Math.random() * bye_gifs.length)]"
                     style="width: 100%; max-width: 300px"/>

              </div>

            </div>

          </div>

        </v-card>
      </div>


      <br/><br/>
      <div style="text-align:center">powered by <a href="http://basma.ai" target="_blank">basma.ai</a></div>

    </v-container>


  </div>
</template>
<script>
  import axios from 'axios';
  // const { connect } = require('twilio-video');
  import CallBox from '@/components/CallBox.vue';
  import AwesomeRating from "../components/AwesomeRating";

  const humanizeDuration = require('humanize-duration')


  export default {
    data: () => ({
      //user input data
      formValid: false,
      firstName: '',
      lastName: '',
      nameRules: [
        v => !!v || 'Customer Name is required!',
        // v => v.length <= 10 || 'Name must be less than 10 characters',
      ],
      requiredRules: [
        v => !!v || 'This field is required!',
        // v => v.length <= 10 || 'Name must be less than 10 characters',
      ],
      customerPhone: '',
      phoneRules: [
        v => /[0-9]/.test(v) || 'Phone is invalid, enter digits only',
        v => v.length == 8 || 'Phone must be 8 digits only',
        v => !!v || 'Phone is required!'
      ],

      loading: false,
      vendor: {},
      screen_status: 'main',
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
        'https://media.giphy.com/media/SV0q8t76HtGi9W9WQu/giphy.gif',
        'https://media.giphy.com/media/fMA8fQ06Q2wHxIX9ie/giphy.gif',
        'https://media.giphy.com/media/TfdeaxOGjOGzZ1DbBW/giphy.gif',
      ],
      rating: 0
    }),

    components: {
      CallBox,
      AwesomeRating
    },

    methods: {

      submitRating: function (event) {
        this.rating = event.rating;
        // console.log(this.rating);
        let thisApp = this;
        axios.post(process.env.api_url + '/calls/submit_rating', {
          guest_token: thisApp.guest_token,
          call_id: thisApp.call_id,
          rating: thisApp.rating,
          feedback_text: ''
        }).then(function (response) {
            thisApp.guest_token = null;
            thisApp.call_id = 0;
          }
        ).catch(function (error) {
          // console.log(error);
        })
      },

      load_data: function () {
        this.loading = true;

        // const { sortBy, descending, page, rowsPerPage } = this.pagination;

        let thisApp = this;
        axios.post(process.env.api_url + '/guest/get_vendor', {
          vendor_username: this.vendor_username
        })
          .then(function (response) {

            if (response.data.success) {
              thisApp.vendor = response.data.data.vendor;
              // console.log(thisApp.vendor);

            } else {
              // // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            // console.log(error);
          });
      },

      request_video_token: function () {

        this.screen_status = 'video_connecting';
        this.loading = true;
        let thisApp = this;

        axios.post(process.env.api_url + '/guest/request_token', {
          first_name: this.firstName,
          last_name: this.lastName,
          phone: this.customerPhone
        })
          .then(function (response) {
            if (response.data.success) {
              thisApp.guest_token = response.data.data.token;
              thisApp.get_services();

            } else {
              // // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            // console.log(error);
          });

      },

      get_services: function () {
        this.screen_status = 'getting_services';
        this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/calls/get_services', {
          guest_token: this.guest_token,
          vendor_id: this.vendor.id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.services_list = response.data.data.services;
              thisApp.screen_status = 'services_list';

            } else {
              // // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            // console.log(error);
          });

      },

      start_call: function (service = null) {
        if (service != null) {
          this.selected_service = service;
        }

        this.screen_status = 'starting_call';
        this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/calls/start_call', {
          guest_token: this.guest_token,
          service_id: this.selected_service.id,
          custom_fields_values: this.vendor.custom_fields
        })
          .then(function (response) {

            if (response.data.success) {
              // console.log(response.data.data);

              thisApp.call_id = response.data.data.call_id;

              thisApp.call = response.data.data.call_info.call;
              thisApp.queue_count = response.data.data.call_info.queue_count;
              thisApp.estimated_waiting_time = response.data.data.call_info.estimated_waiting_time;
              thisApp.estimated_waiting_time = humanizeDuration(thisApp.estimated_waiting_time, {
                round: true,
                units: ['h', 'm']
              });

              thisApp.screen_status = 'call_waiting_for_agent';

              // call the socket
              const params = {
                user_type: 'guest',
                user_token: thisApp.guest_token,
                call_id: thisApp.call_id
              };

              thisApp.$socket.emit('start_socket', params);
              // console.log("start_socket", params);

            } else {
              // // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            // console.log(error);
          });

      },

      cancel_call: function () {

        let thisApp = this;

        thisApp.loading = true;



        axios.post(process.env.api_url + '/calls/end_call', {
          guest_token: this.guest_token,
          call_id: this.call_id
        })
          .then(function (response) {

            if (response.data.success) {
              console.log("Entered Cancel Call");
              try {
                // thisApp.screen_status = 'main';
                // thisApp.call = null;
                // thisApp.selected_service = null;
                if (thisApp.$refs.call_box != null) {
                  console.log('Entered try End Call');

                  thisApp.screen_status = 'call_ended';
                  thisApp.call = null;
                  thisApp.selected_service = null;
                  thisApp.$refs.call_box.end_call();

                }

              } catch (ex) {
                console.log("Call ending error!!: ", ex);
                thisApp.loading = false;
              }

            } else {
              console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
            thisApp.loading = false;
          });

      },
    },

    created() {
      this.vendor_username = this.$route.params.vendor_username;

      // TODO: verify the vendor username first before getting the vendor data
      this.load_data();
    },

    mounted() {
      this.sockets.subscribe('on_update', (data) => {
        let thisApp = this;

        // console.log('on_update', data)

        thisApp.call = data.data.call;
        thisApp.queue_count = data.data.queue_count;
        thisApp.estimated_waiting_time = data.data.estimated_waiting_time;
        thisApp.estimated_waiting_time = humanizeDuration(thisApp.estimated_waiting_time, {
          round: true,
          units: ['h', 'm']
        });

        if (null != thisApp.call && thisApp.call.status == 'started') {
          thisApp.screen_status = 'in_call';
        } else if (null != data.data.errors && data.data.errors.length > 0) {
          if (data.data.errors[0] == 'call_ended') {
            thisApp.screen_status = 'call_ended';
            thisApp.call = null;
            thisApp.selected_service = null;
            thisApp.$refs.call_box.end_call();
          }
        }

      });
    },

    sockets: {
      connect: function () {
        // console.log('connected!')
      },
      // call_refreshed: function (data) {
      //   console.log('call_refreshed:', data)
      // }
    },
  }
</script>
