<template>
  <div>
    <vue-web-cam
      ref="webcam"
      :device-id="deviceId"
      width="100%"
      height="100%"
      @started="onStarted"
      @stopped="onStopped"
      @error="onError"
      @cameras="onCameras"
      @camera-change="onCameraChange"
    />
  </div>
</template>

<script>
  import {WebCam} from "vue-web-cam";

  export default {
    name: "App",
    components: {
      "vue-web-cam": WebCam
    },
    data() {
      return {
        img: null,
        camera: null,
        deviceId: null,
        devices: []
      };
    },
    computed: {
      device: function () {
        return this.devices.find(n => n.deviceId === this.deviceId);
      }
    },
    watch: {
      camera: function (id) {
        this.deviceId = id;
      },
      devices: function () {
        // Once we have a list select the first one
        const [first, ...tail] = this.devices;
        if (first) {
          this.camera = first.deviceId;
          this.deviceId = first.deviceId;
        }
      }
    },
    methods: {
      onCapture() {
        this.img = this.$refs.webcam.capture();
      },
      onStarted(stream) {
        
      },
      onStopped(stream) {
        
      },
      onStop() {
        this.$refs.webcam.stop();
      },
      onStart() {
        this.$refs.webcam.start();
      },
      onError(error) {
        
      },
      onCameras(cameras) {
        this.devices = cameras;
        
      },
      onCameraChange(deviceId) {
        this.deviceId = deviceId;
        this.camera = deviceId;
        
      }
    }
  };
</script>
