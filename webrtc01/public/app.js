const app = new Vue({
  el: '#app',
  data: {
    deviceInfos : [],
    selectedAudioDeviceId : '',
    selectedVideoDeviceId : '',
    tracks : [],
    constraints : '',
    myStream : null,
    recorder : null,
    chunks : [],
    video_downloadlink : ""
  },
  computed : {
    audioDeviceList : function() {
      const result = [];
      for(const device of this.deviceInfos) {
        if (device.kind === 'audioinput') {
          result.push(device.deviceId);
        }
      }
      return result;
    },
    videoDeviceList : function() {
      const result = [];
      for(const device of this.deviceInfos) {
        if (device.kind === 'videoinput') {
          result.push(device.deviceId);
        }
      }
      return result;
    }    
  },
  methods: {
    enumDevices: function() {
      navigator.mediaDevices
        .enumerateDevices()
        .then(deviceInfos => {
          console.log(deviceInfos);
          this.deviceInfos = deviceInfos;
        });
    },
    supportedConstraints: function() {
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      this.constraints = JSON.stringify(constraints, undefined, 2);
    },
    startCapture: function () {
      console.log('startCapture');
      const option = {
        audio: true,
        video: true
      };
      console.log(this.selectedAudioDeviceId)
      if (this.selectedAudioDeviceId) {
        option.audio = {
          deviceId : this.selectedAudioDeviceId
        };
      }
      if (this.selectedVideoDeviceId) {
        option.video = {
          deviceId : this.selectedVideoDeviceId
        };
      }
      navigator.mediaDevices
        .getUserMedia(option)
        .then(stream => {

          console.log(stream);
          console.log(stream.getTracks());
          this.tracks = stream.getTracks();
          

          this.myStream = stream;
          this.$refs.myvideo.srcObject = stream;
          console.log(stream)
          console.log(this.$refs.myvideo);
          for(const track of stream.getTracks()) {
            console.log(track)
            console.log('getCapabilities',track.getCapabilities())
            console.log('getConstraints',track.getConstraints())
            console.log('getSettings',track.getSettings())
          }
          this.$refs.myvideo.play();
        })
        .catch(err => {
          console.log(err);
        });
    },
    stopCapture : function() {
      console.log('stopCapture');
      this.myStream.getTracks().forEach(track => track.stop());
      this.myStream = null;
    },
    startRecord : function() {
      this.recorder = new MediaRecorder(this.myStream);
      let self = this;
      this.recorder.ondataavailable = function(e) {
        console.log(e.data, self.chunks);
        self.chunks.push(e.data);
      }
      this.recorder.onstop = function(e) {
        console.log('onstop');
        const blob = new Blob(self.chunks, { 'type' : 'audio/ogg; codecs=opus' });
        self.video_downloadlink = URL.createObjectURL(blob);
        console.log(URL.createObjectURL(blob));
        self.chunks = [];
        self.recorder = null;
      },
      this.recorder.start();
    },
    stopRecord : function() {
      console.log('stop');
      this.recorder.stop();
    }
  }
})