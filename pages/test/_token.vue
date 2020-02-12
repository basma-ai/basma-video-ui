<template>
  <div>



    local media:<br />
    <div id="local-media"></div>
    <br />
    remote media:
    <div id="remote-media-div"></div>

  </div>
</template>


<script>
  import axios from 'axios';

  const { connect, createLocalTracks, createLocalVideoTrack } = require('twilio-video');


  export default {
    data: () => ({}),
    components: {},
    methods: {},
    created() {

      createLocalVideoTrack().then(track => {
        const localMediaContainer = document.getElementById('local-media');
        localMediaContainer.appendChild(track.attach());
      });

      let token = this.$route.params.token;

      createLocalTracks({
        audio: true,
        video: { width: 640 }
      }).then(localTracks => {
        return connect(token, {
          name: 'my-room-name',
          tracks: localTracks
        });
      }).then(room => {
        console.log(`Connected to Room: ${room.name}`);
        // console.log(JSON.stringify(room));

        // Attach the Participant's Media to a <div> element.
        room.on('participantConnected', participant => {
          console.log("A participant has been connected");
          console.log(`Participant "${participant.identity}" connected`);

          participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
              const track = publication.track;
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
