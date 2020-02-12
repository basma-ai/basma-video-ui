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

      const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS2MwNDg5OTBjNjU5MWYwMTZlZTljMTAzZjQzYThjNjg0LTE1ODAzNzA1NzIiLCJpc3MiOiJTS2MwNDg5OTBjNjU5MWYwMTZlZTljMTAzZjQzYThjNjg0Iiwic3ViIjoiQUMxN2U2YWJiMTg4MmVjN2YwOTc4ODRhNDYyOWY4OGU2YyIsImV4cCI6MTU4MDM3NDE3MiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoidGVzdC1jbGllbnQiLCJ2aWRlbyI6eyJyb29tIjoidGVzdC1yb29tIn19fQ.l9VySCNnt77CUWm-4RhxCJVPrmkerBa1Hsl399G5QFk';

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
