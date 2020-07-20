<template>
  <div>
    <div class="call_box">
      <div v-if="timer != 0" id="timer">{{ timer | moment("mm:ss") }}</div>

      <div id="local-media"></div>
      <div id="remote-media-div">
        <loading v-if="!isVideoLoaded"></loading>
      </div>

      <div id="controls">
        <div v-if="can_end_call" @click="confirm_end_call">
          <vs-button radius icon="close" size="large" type="filled" color="danger"></vs-button>
        </div>
        <div @click="toggle_flip_camera">
          <vs-button radius icon="flip_camera_ios" size="large" type="filled" color="rgb(0, 0, 0, 0.4)"></vs-button>
        </div>
        <div @click="toggle_mute_camera">
          <vs-button radius icon="videocam" size="large" type="filled" color="rgb(0, 0, 0, 0.4)" v-if="localCamIsEnabled"></vs-button>
          <vs-button radius icon="videocam_off" size="large" type="filled" color="danger" v-if="!localCamIsEnabled"></vs-button>
        </div>
        <div @click="toggle_mute_mic">
          <vs-button radius icon="volume_up" size="large" type="filled" color="rgb(0, 0, 0, 0.4)" v-if="localMicIsEnabled"></vs-button>
          <vs-button radius icon="volume_off" size="large" type="filled" color="danger" v-if="!localMicIsEnabled"></vs-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Loading from '@/components/Loading.vue';
  const {connect, createLocalTracks} = require('twilio-video');

  export default {
    props: ['connection_token', 'room_name', 'can_end_call'],
    data: () => ({
      found_remote_track: false,
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
      Loading
    },
    methods: {
      toggle_flip_camera: function () {
        let this_app = this;

        if (undefined != this.localTracks) {
          navigator.mediaDevices.enumerateDevices().then(devices => {
            var videoInput = devices.find(device => device.kind === 'videoinput');
            return createLocalTracks({ audio: true, video: { deviceId: videoInput.deviceId } });
          }).then(localTracks => {
            return connect(this_app.connection_token, {
              name: this_app.room_name,
              tracks: localTracks
            });
          }).then(room => {
            console.log('Connected to room ' + room.name);
          });
        }
      },
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

        if (undefined != this.localTracks) {
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
        }
      },
      end_call: function () {
        let this_app = this;

        if (this.room != null) {
          this.room.disconnect();
          this.room = null;
        }

        if (undefined != this.localTracks) {
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
        }
      },
      confirm_end_call: function() {
        let this_app = this;

        this_app.$vs.dialog({
          type: 'confirm',
          color: 'danger',
          title: `Confirm`,
          text: 'Are you sure you want to end the call?',
          accept: function () {
            this_app.$emit("endCall");
          }
        })
      },
      add_one_sec_to_timer: function () {
        let this_app = this;

        if (this_app.isVideoLoaded) {
          setTimeout(function () {
            this_app.timer++;
            this_app.add_one_sec_to_timer();
          }, 1000);
        } else {
          this.timer = 0
        }
      },
      attach_participant(participant) {
        let this_app = this;
        let remoteDiv = document.getElementById('remote-media-div')

        let participant_element = document.getElementById(participant.sid)
        if(participant_element == null) {
          participant_element = document.createElement('div')
          participant_element.id = participant.sid
          participant_element.className += 'participant'

          remoteDiv.append(participant_element)

          participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
              const track = publication.track;
              this_app.attach_track(track, participant)
              this_app.isVideoLoaded = true;
            }
          });

          participant.on('trackSubscribed', track => {
            this_app.attach_track(track, participant)
            this_app.isVideoLoaded = true;
          });

        }


      },
      detach_participant(participant) {
        let participant_element = document.getElementById(participant.sid)
        if(participant_element != null) {
          participant_element.remove()
        }
      },
      attach_track(track, participant) {
        let remoteDiv = document.getElementById(participant.sid)
        let trackElement = track.attach()
        trackElement.id = track.sid

        remoteDiv.append(trackElement)
      },
    },
    watch: {
      isVideoLoaded() {
        this.add_one_sec_to_timer();
      }
    },
    created() {
      let this_app = this;

      createLocalTracks({
        audio: true,
        video: {width: 640}
      }).then(localTracks => {
        this_app.localTracks = localTracks;
        return connect(this_app.connection_token, {
          name: this_app.room_name,
          tracks: localTracks
        });
      }).then(room => {

        // this_app.$log4js.debug(`Successfully joined a Room: ${room}`);

        this_app.room = room;

        // Attach local video track to the preview
        room.localParticipant.tracks.forEach((publication) => {
          const track = publication.track;

          if (track.kind === "video") {
            const localMediaContainer = document.getElementById("local-media");
            localMediaContainer.innerHTML = "";
            localMediaContainer.prepend(track.attach());
          }
        })

        // Log your Client's LocalParticipant in the Room
        const localParticipant = room.localParticipant;
        // this_app.$log4js.debug(`Connected to the Room as LocalParticipant "${localParticipant.identity}"`);

        // Log any Participants already connected to the Room
        room.participants.forEach(participant => {
          // this_app.$log4js.debug(`Participant "${participant.identity}" is connected to the Room`);

          this_app.attach_participant(participant)
        });

        // Log new Participants as they connect to the Room
        room.on('participantConnected', participant => {
          // this_app.$log4js.debug(`Participant "${participant}" has connected to the Room`);
          // this_app.$log4js.debug(`Participant "${participant.identity}" has connected to the Room`);

          this_app.attach_participant(participant)
        });

        // Log Participants as they disconnect from the Room
        room.on('participantDisconnected', participant => {
          // this_app.$log4js.debug(`Participant "${participant}" has disconnected from the Room`);
          // this_app.$log4js.debug(`Participant "${participant.identity}" has disconnected from the Room`);

          // this_app.$log4js.debug(JSON.stringify(participant))

          this_app.detach_participant(participant);
        });
      });
    }
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
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);
    border-right: 1px solid rgba(0, 0, 0, 0.4);
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
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 1.2rem;
    min-width: 70px;
    text-align: center;
  }
</style>
