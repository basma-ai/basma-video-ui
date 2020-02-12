<template>
  <div>


    <div class="call_box">
      <div id="local-media"></div>
      <div id="remote-media-div"></div>
    </div>

  </div>
</template>


<script>
  import axios from 'axios';

  const {connect, createLocalTracks, createLocalVideoTrack} = require('twilio-video');


  export default {
    props: ['connection_token', 'room_name'],
    data: () => ({
      found_remote_track: false
    }),
    components: {},
    methods: {
      check_remote: function (room) {

        let this_app = this;
        room.participants.forEach(participant => {
          if (!this_app.found_remote_track) {
          }
          console.log(`Participant "${participant.identity}" is connected to the Room`);

          setTimeout(function () {
            participant.tracks.forEach(publication => {
              if (publication.isSubscribed) {
                const track = publication.track;
                this_app.found_remote_track = true;
                document.getElementById('remote-media-div').innerHTML = "";
                document.getElementById('remote-media-div').appendChild(track.attach());
              } else {
                this_app.check_remote(room);
              }
            });
          }, 2500);

        });
      }
    }
    ,
    created() {

      createLocalVideoTrack().then(track => {
        const localMediaContainer = document.getElementById('local-media');
        document.getElementById('local-media').innerHTML = "";
        localMediaContainer.appendChild(track.attach());
      });

      let token = this.connection_token;

      var thisApp = this;

      createLocalTracks({
        audio: true,
        video: {width: 640}
      }).then(localTracks => {
        return connect(token, {
          name: this.room_name,
          tracks: localTracks
        });
      }).then(room => {
        console.log(`Connected to Room: ${room.name}`);
        // console.log(JSON.stringify(room));

        console.log("PARTICIPANTS");
        thisApp.check_remote(room);


        // Attach the Participant's Media to a <div> element.
        room.on('participantConnected', participant => {
          console.log("A participant has been connected");
          console.log(`Participant "${participant.identity}" connected`);

          participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
              const track = publication.track;
              document.getElementById('remote-media-div').innerHTML = "";
              document.getElementById('remote-media-div').appendChild(track.attach());
            }
          });

          participant.on('trackSubscribed', track => {
            document.getElementById('remote-media-div').appendChild(track.attach());
          });
        });

      });


    }
  }
</script>
