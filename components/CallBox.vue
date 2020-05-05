<template>
  <div>
    <div class="call_box">

      <div v-if="timer != 0" id="timer">{{ timer | moment("mm:ss") }}</div>

      <div id="local-media"></div>
      <div id="remote-media-div">
        <loading v-if="!isVideoLoaded"></loading>
      </div>

      <div id="controls">
        <div @click="toggle_mute_camera">
          <vs-button radius icon="videocam" type="filled" color="primary" v-if="localCamIsEnabled"></vs-button>
          <vs-button radius icon="videocam_off" type="filled" color="danger" v-if="!localCamIsEnabled"></vs-button>
        </div>
        <div @click="toggle_mute_mic">
          <vs-button radius icon="volume_up" type="filled" color="primary" v-if="localMicIsEnabled"></vs-button>
          <vs-button radius icon="volume_off" type="filled" color="danger" v-if="!localMicIsEnabled"></vs-button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
  import Vue from 'vue'
  import CamPreview from '@/components/CamPreview.vue';
  import Loading from '@/components/Loading.vue';
  import {isIOS} from 'mobile-device-detect';

  const {connect, createLocalTracks, createLocalVideoTrack, LocalVideoTrack} = require('twilio-video');

  export default {
    props: ['connection_token', 'room_name'],
    data: () => ({
      found_remote_track: false,
      isItIos: isIOS,
      localTrack: false,
      remoteTrack: '',
      activeRoom: '',
      previewTracks: '',
      room: null,
      localCamIsEnabled: true,
      localMicIsEnabled: true,
      isVideoLoaded: false,
      timer: 0
    }),
    components: {
      CamPreview,
      Loading
    },
    methods: {
      toggle_mute_camera: function () {

        let this_app = this;

        if (undefined != this.localTracks) {
          this.localTracks.forEach((track) => {
            try {
              if (track.kind == 'video') {
                if (track.isEnabled) {
                  track.disable();
                  this_app.localCamIsEnabled = false;
                } else {
                  track.enable();
                  this_app.localCamIsEnabled = true;
                }
              }
            } catch (ex) {

            }
          })
        }

      },
      toggle_mute_mic: function () {

        let this_app = this;

        this.localTracks.forEach((track) => {
          try {
            if (track.kind == 'audio') {
              if (track.isEnabled) {
                track.disable();
                this_app.localMicIsEnabled = false;
              } else {
                track.enable();
                this_app.localMicIsEnabled = true;
              }
            }
          } catch (ex) {

          }
        })

      },
      end_call: function () {
        let this_app = this;
        this_app.ringtone_switch = false;

        if (this.room != null) {
          this.room.disconnect();
          this.room = null;
        }

        this.localTracks.forEach((track) => {
          try {
            if (track.isEnabled) {
              track.disable();
              track.stop();
              const attachedElements = track.detach();
              attachedElements.forEach(element => element.remove());
              this_app.localMicIsEnabled = false;
            } else {
              track.enable();
              this_app.localMicIsEnabled = true;
            }
          } catch (ex) {

          }
        })
      },
      check_remote: function (room) {

        let this_app = this;
        room.participants.forEach(participant => {

          if (!this_app.found_remote_track) {}

          setTimeout(function () {
            participant.tracks.forEach(publication => {

              if (publication.isSubscribed) {

                const track = publication.track;

                if (track == null) {

                  this_app.check_remote(room);
                } else {

                  this_app.found_remote_track = true;
                  //document.getElementById('remote-media-div').innerHTML = "";
                  document.getElementById('remote-media-div').appendChild(track.attach());
                  this_app.isVideoLoaded = true;
                }

              } else {
                this_app.check_remote(room);
              }
            });
          }, 5000);

        });
      },
      add_one_sec_to_timer: function () {
        let this_app = this;

        if (this_app.isVideoLoaded) {
          setTimeout( function () {
            this_app.timer++;
            this_app.add_one_sec_to_timer();
          },1000);
        }else{
          this.timer = 0
        }
      }
    },
    watch: {
      isVideoLoaded(isTrue) {
        this.add_one_sec_to_timer();
      }
    },
    created() {
      // check if isIos
      if (process.client) {
        this.isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      }

      let token = this.connection_token;

      let this_app = this;

      createLocalTracks({
        audio: true,
        video: {width: 640}
      }).then(localTracks => {

        this_app.localTracks = localTracks;
        return connect(token, {
          name: this.room_name,
          tracks: localTracks
        });

      }).then(room => {

        room.localParticipant.tracks.forEach((a) => {
          if (a.kind === "video") {
            const localMediaContainer = document.getElementById("local-media");
            // localMediaContainer.innerHTML = "";
            localMediaContainer.prepend(a.track.attach());
          }
        })

        this_app.room = room;
        this_app.check_remote(room);

        // Attach the Participant's Media to a <div> element.
        room.on('participantConnected', participant => {

          participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
              const track = publication.track;
              // document.getElementById('remote-media-div').innerHTML = "";
              document.getElementById('remote-media-div').appendChild(track.attach());
              this_app.isVideoLoaded = true;
            }
          });

          participant.on('trackSubscribed', track => {
            document.getElementById('remote-media-div').appendChild(track.attach());
            this_app.isVideoLoaded = true;
          });
        });

        // Attach the Participant's Media to a <div> element.
        room.on("participantDisconnected", (participant) => {

          // document.getElementById("remote-media-div").innerHTML = ""
        });

      });

    },
  }
</script>
<style lang="scss">
  .call_box {
    width: inherit;
    background: #fff;
    border: 1px solid #DDD;
    position: relative;
    height: inherit;
    /*background: #000;*/
    display: inline-block;
    min-height: 425px;
  }

  .call_box #controls {
    bottom: 0;
    position: absolute;
    right: 0;
    margin: 10px;
  }

  .call_box #controls button {
    margin-bottom: 3px;
  }

  #local-media {
    position: absolute;
    width: 100%;
  }

  #local-media video {
    max-width: 25%;
    max-height: 25%;
    float: left;
    left: 0;
    border-bottom: 1px solid #DDD;
    border-right: 1px solid #DDD;
  }

  #remote-media-div video {
    width: 100%;
    max-height: 700px;
    margin: 0;
    padding: 0;
    height: 100%;
    margin-bottom: -6px;
  }

  #timer {
    position: absolute;
    top: 10px;
    right: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid #ffc13c;
    color: #fff;
    border-radius: 5px;
    padding: 5px;
    font-size: 1rem;
    min-width: 60px;
    text-align: center;
  }

</style>
