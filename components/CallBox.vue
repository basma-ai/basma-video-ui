<template>
  <div>
    <div class="call_box" v-if="!call_ended">
      <div
        align="center"
        style="
          position: absolute;
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          z-index: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        v-if="!isVideoLoaded"
      >
        <v-progress-circular
          :size="100"
          color="amber"
          indeterminate
        ></v-progress-circular>
      </div>

<!--      <div id="local-media" v-if="!isItIos">-->
      <div id="local-media">
<!--        <CamPreview v-if="localCamIsEnabled"></CamPreview>-->
      </div>

      <div id="remote-media-div" style="z-index: 1;"></div>

      <div id="controls">
        <v-btn @click="toggle_mute_camera" v-if="isVideoLoaded">
          <span v-if="localCamIsEnabled"><v-icon>fas fa-video</v-icon></span>
          <span v-if="!localCamIsEnabled"
            ><v-icon color="red">fas fa-video-slash</v-icon></span
          >
        </v-btn>

        <v-btn @click="toggle_mute_mic" v-if="isVideoLoaded">
          <span v-if="localMicIsEnabled"
            ><v-icon>fas fa-microphone</v-icon></span
          >
          <span v-if="!localMicIsEnabled"
            ><v-icon color="red">fas fa-microphone-slash</v-icon></span
          >
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Vue from "vue";
import CamPreview from "@/components/CamPreview.vue";
import { isIOS } from "mobile-device-detect";

const {
  connect,
  createLocalTracks,
  createLocalVideoTrack,
  LocalVideoTrack,
} = require("twilio-video");

export default {
  inject: ["theme"],
  props: ["connection_token", "room_name"],
  data: () => ({
    found_remote_track: false,
    isItIos: isIOS,
    localTrack: false,
    remoteTrack: "",
    activeRoom: "",
    previewTracks: "",
    room: null,
    localCamIsEnabled: true,
    localMicIsEnabled: true,
    call_ended: false,
    isVideoLoaded: false,
  }),
  components: { CamPreview },
  methods: {
    toggle_mute_camera: function () {
      let thisApp = this;

      this.localTracks.forEach((track) => {
        
        // (JSON.stringify(track));
        try {
          if (track.kind == "video") {
            if (track.isEnabled) {
              track.disable();
              thisApp.localCamIsEnabled = false;
            } else {
              track.enable();
              thisApp.localCamIsEnabled = true;
            }
          }
        } catch (ex) {
          // (ex.toString());
        }
      });
    },
    toggle_mute_mic: function () {
      let thisApp = this;

      this.localTracks.forEach((track) => {
        
        // (JSON.stringify(track));
        try {
          if (track.kind == "audio") {
            if (track.isEnabled) {
              track.disable();
              thisApp.localMicIsEnabled = false;
            } else {
              track.enable();
              thisApp.localMicIsEnabled = true;
            }
          }
        } catch (ex) {
          // (ex.toString());
        }
      });
    },
    end_call: function () {
      let thisApp = this;

      if (this.room != null) {
        this.room.disconnect();
        this.room = null;
        this.call_ended = true; //munther added this
      }

      this.localTracks.forEach((track) => {
        
        (JSON.stringify(track));
        try {
          if (track.isEnabled) {
            track.disable();
            track.stop();
            const attachedElements = track.detach();
            attachedElements.forEach((element) => element.remove());
            thisApp.localMicIsEnabled = false;
          } else {
            track.enable();
            thisApp.localMicIsEnabled = true;
          }
        } catch (ex) {
          (ex.toString());
        }
      });
    },
    check_remote: function (room) {
      let this_app = this;

      if (this.call_ended) {
        return true;
      }

      room.participants.forEach((participant) => {
        
        // (JSON.stringify(participant));

        if (!this_app.found_remote_track) {
        }
        

        setTimeout(function () {
          participant.tracks.forEach((publication) => {
            
            // (JSON.stringify(publication));

            if (publication.isSubscribed) {
              // ("I am inside IF(publication.isSubscribed)");
              const track = publication.track;

              if (track == null) {
                
                this_app.check_remote(room);
              } else {
                
                this_app.found_remote_track = true;
                //document.getElementById('remote-media-div').innerHTML = "";
                document
                  .getElementById("remote-media-div")
                  .prepend(track.attach());
                this_app.isVideoLoaded = true;
              }
            } else {
              // ("I am inside ELSE(publication.isSubscribed)");
              this_app.check_remote(room);
            }
          });
        }, 5000);
      });
    },
  },
  created() {
    

    // check if isIos
    if (process.client) {
      this.isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    // createLocalVideoTrack().then((track) => {
    //   const localMediaContainer = document.getElementById("local-media");
    //   document.getElementById("local-media").innerHTML = "";
    //   localMediaContainer.prepend(track.attach());
    // });

    let token = this.connection_token;

    var thisApp = this;

    // munther commented this
    // if (this.call_ended) {
    //   return true;
    // }

    createLocalTracks({
      audio: true,
      video: { width: 640 },
    })
      .then((localTracks) => {
        thisApp.localTracks = localTracks;
        return connect(token, {
          name: this.room_name,
          tracks: localTracks,
        });
      })
      .then((room) => {
        

        room.localParticipant.tracks.forEach((a)=>{
          ('room.localParticipant.tracks', a)
          if (a.kind === "video") {
            const localMediaContainer = document.getElementById("local-media");
            localMediaContainer.innerHTML = "";
            localMediaContainer.prepend(a.track.attach());
          }
        })

        
        thisApp.room = room;
        thisApp.check_remote(room);

        // Attach the Participant's Media to a <div> element.
        room.on("participantConnected", (participant) => {
          if (!thisApp.call_ended) {
            
            

            participant.tracks.forEach((publication) => {
              if (publication.isSubscribed) {
                const track = publication.track;
                // document.getElementById('remote-media-div').innerHTML = "";
                document
                  .getElementById("remote-media-div")
                  .prepend(track.attach());
                thisApp.isVideoLoaded = true;
              }
            });

            participant.on("trackSubscribed", (track) => {
              document
                .getElementById("remote-media-div")
                .prepend(track.attach());
              thisApp.isVideoLoaded = true;
            });
          }
        });

        // Attach the Participant's Media to a <div> element.
        room.on("participantDisconnected", (participant) => {
          
          document.getElementById("remote-media-div").innerHTML = ""
        });

      });
  },
};
</script>
