const app = new Vue({
    el: '#app',
    data: {
      deviceInfos : [],
      tracks : [],
      myStream : null,
      recorder : null,
      chunks : [],
      video_downloadlink : ""
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
      startCapture: function () {
        console.log('startCapture');
        const option = {
          audio: true,
          video: false
        };
        navigator.mediaDevices
          .getUserMedia(option)
          .then(stream => {
  
            console.log(stream);
            console.log(stream.getTracks());
            this.tracks = stream.getTracks();
            
  
            this.myStream = stream;
            this.$refs.myaudio.srcObject = stream;
            this.$refs.myaudio.play();
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
      mute : function() {
        const tracks = this.myStream.getAudioTracks();
        for(const track of tracks) {
            track.enabled = false;
        }
      },
      unmute : function() {
        const tracks = this.myStream.getAudioTracks();
        for(const track of tracks) {
            track.enabled = true;
        }
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