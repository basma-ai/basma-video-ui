<template>
  <div>


    <v-container>

      <div style="text-align:center">
        <v-card :loading="loading" style="width:100%;max-width: 900px;display:inline-block">
          <div class="text-center" style="padding: 20px">


            <img id="vendor-logo" :src="vendor.logo_url"/>
            <br/><br/>

            <!-- Main Screen -->
            <div v-if="screen_status == 'main'">
              <!-- user input data -->
              <v-form v-model="formValid" ref="form">
                <v-container style="text-align: center">

                  <div style="display: inline-block; width:100%; max-width: 200px">

                    <v-text-field
                      v-model="firstName"
                      :rules="nameRules"
                      label="First Name"
                      required
                    >
                    </v-text-field>

                    <v-text-field
                      v-model="lastName"
                      :rules="nameRules"
                      label="Last Name"
                      required
                    >

                    </v-text-field>
                    <v-text-field
                      v-model="customerPhone"
                      :rules="phoneRules"
                      label="Mobile Number"
                      required
                    ></v-text-field>

                    <br>

                    <v-btn large :disabled="!formValid" color="success" @click="request_video_token">
                      <v-icon top>fas fa-video</v-icon>
                    </v-btn>

                  </div>

                </v-container>
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
              <v-btn @click="screen_status = 'main'">Start Again</v-btn>

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
              <v-progress-linear indeterminate></v-progress-linear>
              <br/>
              You are placed in line!!
              <br/>
              You'll be answered as soon as an agent is available.
              <br/>
              <h3 v-if="queue_count != 0"> You are #{{queue_count+1}} in the waiting queue, kindly wait! </h3>
              <br/>

              <v-btn @click="cancel_call">
                Cancel Call
              </v-btn>

              <span v-if="estimated_waiting_time != 0">The average waiting time is {{estimated_waiting_time}}</span>
              <div style="width:100%;direction: ltr;text-align:left">
                <!--                                <pre>{{call}}</pre>-->
              </div>
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
                <v-btn @click="end_call">End Call</v-btn>
              </div>
            </div>

            <!-- Call Ended -->
            <div v-if="screen_status == 'call_ended'">

              <div style="text-align:center;font-size:15px">

                <h3>Thanks for calling!</h3>
                <h3>Kindly rate our service :)</h3>
                <br>

                <!-- feedback component -->
                <awesome-rating @rating_set="sendFeedback($event)" v-if="feedback === 0"></awesome-rating>
                <br>

                <!-- show the message once the user completes the feedback-->
                <h3 v-if="feedback !== 0">Call Ended, Good Bye!</h3>
                <br>

                <br>
                <!-- show back to home button once the user completes the feedback-->
                <v-btn @click="screen_status = 'services_list'" v-if="feedback !== 0">
                  Back to Home
                </v-btn>

                <br/><br/>
                <img :src="bye_gifs[Math.floor(Math.random() * bye_gifs.length)]"/>

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
      queue_count: 0,
      estimated_waiting_time: 0,
      selected_service: null,
      call_id: 0,
      call: null,
      bye_gifs: [
        'https://media.giphy.com/media/SV0q8t76HtGi9W9WQu/giphy.gif',
        'https://media.giphy.com/media/fMA8fQ06Q2wHxIX9ie/giphy.gif',
        'https://media.giphy.com/media/TfdeaxOGjOGzZ1DbBW/giphy.gif',
      ],
      feedback: 0
    }),
    components: {
      CallBox,
      AwesomeRating
    },
    methods: {

      sendFeedback: function (event) {
        this.feedback = event.rating;
        console.log(this.feedback);
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

            } else {
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
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
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
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
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
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
          service_id: this.selected_service.id
        })
          .then(function (response) {

            if (response.data.success) {
              console.log(response.data.data);

              thisApp.call_id = response.data.data.call_id;
              thisApp.screen_status = 'call_waiting_for_agent';
              thisApp.refresh_call();

            } else {
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },
      refresh_call: function () {
        // this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/calls/refresh_call', {
          guest_token: this.guest_token,
          call_id: this.call_id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.call = response.data.data.call;
              thisApp.queue_count = response.data.data.queue_count;
              thisApp.estimated_waiting_time = response.data.data.estimated_waiting_time;

              if (null != thisApp.call && thisApp.call.status == 'started') {
                thisApp.screen_status = 'in_call';
              } else if (null != response.data.data.errors && response.data.data.errors.length > 0) {
                if (response.data.data.errors[0] == 'call_ended') {
                  thisApp.screen_status = 'call_ended';
                  thisApp.call = null;
                  thisApp.call_id = 0;
                  thisApp.guest_token = null;
                  thisApp.selected_service = null;

                  thisApp.$refs.call_box.end_call();
                }

              }

            } else {
              // console.log("it's a failure!");
            }

            // TODO: switch to socket.io
            setTimeout(function () {
              if (thisApp.screen_status == 'call_waiting_for_agent' || thisApp.screen_status == 'in_call') {
                thisApp.refresh_call();
              }
            }, 500);

            // thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },

      cancel_call: function (service = null) {

        try {
          this.$refs.call_box.end_call();
        } catch (ex) {
          // console.log("Call ending erro!!")
        }
        // this.$refs.call_box.end_call();
        // if (service != null) {
        //   this.selected_service = service;
        // }

        // this.screen_status = 'starting_call';
        this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/calls/end_call', {
          guest_token: this.guest_token,
          call_id: this.call_id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.screen_status = 'services_list';

            } else {
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },

    },
    end_call: function (service = null) {

      try {
        this.$refs.call_box.end_call();
      } catch (ex) {
        // console.log("Call ending error!!")
      }
      // this.$refs.call_box.end_call();
      // if (service != null) {
      //   this.selected_service = service;
      // }

      // this.screen_status = 'starting_call';
      this.loading = true;

      let thisApp = this;
      axios.post(process.env.api_url + '/calls/end_call', {
        guest_token: this.guest_token,
        call_id: this.call_id
      })
        .then(function (response) {

          if (response.data.success) {

            thisApp.screen_status = 'call_ended';

          } else {
            // console.log("it's a failure!");
          }

          thisApp.loading = false;

        })
        .catch(function (error) {
          console.log(error);
        });

    },
    created() {
      this.vendor_username = this.$route.params.vendor_username;

      // TODO: verify the vendor username first before getting the vendor data
      this.load_data();
    }
  }
</script>
