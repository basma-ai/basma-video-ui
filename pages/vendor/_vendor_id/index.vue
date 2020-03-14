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
              <!--          <h1>{{vendor.name}}</h1>-->

              <!-- <v-btn large>
                <v-icon top>fas fa-comment-dots</v-icon>
              </v-btn> -->
              <div style="display:inline-block;width:10px"></div>
              <v-btn large @click="request_video_token">
                <v-icon top>fas fa-video</v-icon>
              </v-btn>

            </div>

            <!-- Video Connecting Screen -->
            <div v-if="screen_status == 'video_connecting'">
              connecting you
            </div>

            <!-- Getting Vendor Screen -->
            <div v-if="screen_status == 'getting_services'">
              getting services list
            </div>

            <!-- Services List -->
            <div v-if="screen_status == 'services_list'">

              <v-btn v-for="service in services_list" :key="service.id" @click="start_call(service)"
                     style="margin:10px">
                {{service.service_name}}
              </v-btn>

              <br/><br/>
              <v-btn @click="screen_status = 'main'">Start Again</v-btn>

            </div>

            <!-- Starting a Call -->
            <div v-if="screen_status == 'starting_call'">
              starting a call
            </div>

            <!-- Waiting for an Agent -->
            <div v-if="screen_status == 'call_waiting_for_agent'">

              <v-progress-linear indeterminate></v-progress-linear>
              waiting for an agent
              <br/>
<!--              <div style="width:100%;direction: ltr;text-align:left">-->
<!--                <pre>{{call}}</pre>-->
<!--              </div>-->

            </div>

            <!-- In Call -->
            <div v-if="screen_status == 'in_call'">

              You are being served by: {{call.vu.name}}
              <div styte="height:10px"></div>

              <div v-if="call.status == 'started' && call.connection_guest_token != null">
                <CallBox :connection_token="call.connection_guest_token" :room_name="'call-'+call.id" style="width:100%"></CallBox>
              </div>

              <br /><br />
              <v-btn @click="end_call">End Call</v-btn>

<!--              <div style="width:100%;direction: ltr;text-align:left">-->
<!--                <pre>{{call}}</pre>-->
<!--              </div>-->
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


  export default {
    data: () => ({
      loading: false,
      vendor: {},
      screen_status: 'main',
      guest_token: null,
      services_list: [],
      vendor_id: 0,
      selected_service: null,
      call_id: 0,
      call: null
    }),
    components: {
      CallBox
    },
    methods: {

      load_data: function () {
        this.loading = true;

        // const { sortBy, descending, page, rowsPerPage } = this.pagination;

        let thisApp = this;
        axios.post(process.env.api_url + '/guest/get_vendor', {
          vendor_id: 1
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
        axios.post(process.env.api_url + '/guest/request_token', {})
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
          vendor_id: this.vendor_id
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

              if(thisApp.call.status == 'started') {
                thisApp.screen_status = 'in_call';
              }

            } else {
              // console.log("it's a failure!");
            }

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
      setup_twilio: function() {

      },
      end_call: function (service = null) {
        if (service != null) {
          this.selected_service = service;
        }

        this.screen_status = 'starting_call';
        this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/calls/end_call', {
          guest_token: this.guest_token,
          call_id: this.call_id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.screen_status = 'main';

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
    created() {

      this.vendor_id = this.$route.params.vendor_id;
      this.load_data();

    }
  }
</script>
