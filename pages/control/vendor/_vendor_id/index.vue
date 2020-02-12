<template>
  <div>


    <v-container>

      <div style="text-align:center">
        <v-card :loading="loading">
          <div class="text-center" style="padding: 20px">

            <img :src="vendor.logo_url" style="max-width: 500px; height: auto"/>
            <br/><br/>

            <!-- Main Screen -->
            <div v-if="screen_status == 'login'">
              <!--          <h1>{{vendor.name}}</h1>-->

              <h1>Agent Login</h1>

              <div style="text-align:center">
                <div style="display: inline-block;width:300px;margin-top:20px">
                  <v-text-field v-model="vu_username" placeholder="Username" outlined></v-text-field>
                  <v-text-field v-model="vu_password" placeholder="Password" type="password" outlined></v-text-field>
                  <v-btn @click="request_agent_token" :loading="agent_token_loading">Login</v-btn>
                </div>
              </div>
            </div>

            <!-- Video Connecting Screen -->
            <div v-if="screen_status == 'dashboard'">

              Hello {{vu_user.name}},
              <div style="display:inline-block;width:10px"></div>
              <v-btn>Logout</v-btn>
              <br/><br/>

              list of calls goes here:
              <br/>
              <div v-for="call in pending_calls_list" class="agent_call_box">

                <div id="text">
                  <div id="title">
                    <img src="~assets/images/dancing_phone.gif" height="40px"/>
                    Call {{call.id}}
                  </div>
                  <div id="service">
                    <v-chip>{{call.vendor_service.service_name}}</v-chip>
                  </div>
                </div>
                <v-btn id="answer" color="green" @click="answer_call(call)">Answer</v-btn>

              </div>

              <div v-if="pending_calls_list.length < 1">
                No pending calls, this page will refresh automatically
              </div>

            </div>


            <!-- In Call -->
            <div v-if="screen_status == 'in_call'">

              <div styte="height:10px"></div>

              <div v-if="call.status == 'started' && call.connection_agent_token != null">
                <v-row>

                  <v-col cols="12" sm="7">
                    <CallBox :connection_token="call.connection_agent_token" :room_name="'call-'+call.id" style="width:100%;"></CallBox>
                  </v-col>
                  <v-col>
                    Some notes and other cool stuff goes here<br />
                    <br />
                    <v-textarea outlined placeholder="Call notes"></v-textarea>
                    <br />
                    <v-btn>Request signature</v-btn><br /><br />
                    <v-btn>Take a snapshot</v-btn><br /><br />
                    <v-btn>Send a form</v-btn>
                    <v-btn>Send a file</v-btn>
                    <v-btn>Send text</v-btn>
                    <br /><br />
                    <v-btn @click="end_call">End Call</v-btn>

                  </v-col>

                </v-row>

              </div>

              <br/><br/>

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
      screen_status: 'login',
      guest_token: null,
      services_list: [],
      vendor_id: 0,
      selected_service: null,
      call_id: 0,
      call: null,
      vu_username: '',
      vu_password: '',
      vu_user: null,
      agent_token_loading: false,
      vu_token: null,
      pending_calls_list: []
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
      list_pending_calls: function () {
        // this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/agent/list_pending_calls', {
          vu_token: this.vu_token
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.pending_calls_list = response.data.data.pending_calls_list;


            } else {
              // console.log("it's a failure!");
            }

            setTimeout(function () {
              if (thisApp.vu_user != null) {
                thisApp.list_pending_calls();
              }
            }, 500);

            // thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },

      end_call: function () {

        this.screen_status = 'loading';
        this.loading = true;

        let thisApp = this;
        axios.post(process.env.api_url + '/agent/end_call', {
          vu_token: this.vu_token,
          call_id: this.call_id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.screen_status = 'dashboard';

            } else {
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },


      request_agent_token: function () {
        this.loading = true;
        this.agent_token_loading = true;


        let thisApp = this;
        axios.post(process.env.api_url + '/agent/request_token', {
          vendor_id: this.vendor_id,
          username: this.vu_username,
          password: this.vu_password
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.vu_token = response.data.data.token;
              thisApp.vu_user = response.data.data.vu_user;
              thisApp.screen_status = 'dashboard';
              thisApp.list_pending_calls();

            } else {
              console.log("here i am");
              if (response.data.data.errors[0] == 'invalid_credentials') {
                if (process.client) {
                  alert("Invalid Credentials");
                }
              }
            }

            thisApp.loading = false;
            thisApp.agent_token_loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });

      },
      answer_call: function (selected_call) {

        this.loading = true;
        this.screen_status = 'loading';


        let thisApp = this;
        axios.post(process.env.api_url + '/agent/answer_call', {
          vu_token: this.vu_token,
          call_id: selected_call.id
        })
          .then(function (response) {

            if (response.data.success) {

              thisApp.call = response.data.data.call;
              thisApp.screen_status = 'in_call';

            } else {
              // console.log("it's a failure!");
            }

            thisApp.loading = false;

          })
          .catch(function (error) {
            console.log(error);
          });


      }

    },
    created() {

      this.vendor_id = this.$route.params.vendor_id;
      this.load_data();



    }
  }
</script>
