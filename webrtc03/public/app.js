const app = new Vue({
  el: '#app',
  data: {
    deviceInfos : [],
    tracks : [],
    myStream : null,
    recorder : null,
    chunks : [],
    video_downloadlink : "",
    peerConnections : {},
    socket : null,
  },
  computed: {
  },
  created : function() {
    const config = {
      iceServers: [
        { 
          "urls": "stun:stun.l.google.com:19302",
        },
        // { 
        //   "urls": "turn:TURN_IP?transport=tcp",
        //   "username": "TURN_USERNAME",
        //   "credential": "TURN_CREDENTIALS"
        // }
      ]
    };

    this.socket = io.connect(window.location.origin);
    const self = this;
    this.socket.on("answer", (id, description) => {
      console.log('on answer');
      self.peerConnections[id].setRemoteDescription(description);
    });
    this.socket.on("watcher", id => {
      console.log('on watcher', id);
      const peerConnection = new RTCPeerConnection(config);
      Vue.set(self.peerConnections, id, peerConnection);
      self.myStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, self.myStream)
      });
      peerConnection.onicecandidate = event => {
        console.log('onicecandidates', event.candidate);
        if (event.candidate) {
          self.socket.emit("candidate", id, event.candidate);
        }
      };
      peerConnection
        .createOffer()
        .then(sdp => {
          console.log('createOffer ... end', sdp);
          peerConnection.setLocalDescription(sdp);
        })
        .then(() => {
          console.log('setLocalDescription....end');
          self.socket.emit("offer", id, peerConnection.localDescription);
        });

    });
    this.socket.on("candidate", (id, candidate) => {
      console.log('on candidate');
      self.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    });
    this.socket.on("disconnectPeer", id => {
      console.log('on disconnectPeer');
      self.peerConnections[id].close();
      Vue.delete(self.peerConnections, id);
    });
    this.socket.on("broadcaster", () => {
      console.log('on broadcaster');
      self.socket.emit("watcher");
    });
    this.socket.on("answer", (id, description) => {
      console.log('on answer', id, description);
      self.peerConnections[id].setRemoteDescription(description);
    });
    this.socket.on("offer", (id, description) => {
      console.log('on offer', id, description);
      const peerConnection = new RTCPeerConnection(config);
      Vue.set(self.peerConnections, id, peerConnection);

      console.log(self.peerConnections);
      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          self.socket.emit("answer", id, peerConnection.localDescription);
        });
      peerConnection.ontrack = event => {
        const elmVideo = document.getElementById('video_'+id);
        console.log('ontrack', event.streams, elmVideo);
        elmVideo.srcObject =  event.streams[0];
        elmVideo.play();
      };
      peerConnection.onicecandidate = event => {
        console.log('onicecandidates', event.candidate);

        if (event.candidate) {
          self.socket.emit("candidate", id, event.candidate);
        }
      };
    });
    
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
        video: true
      };
      navigator.mediaDevices
        .getUserMedia(option)
        .then(stream => {

          console.log(stream);
          console.log(stream.getTracks());
          this.tracks = stream.getTracks();
          

          this.myStream = stream;
          this.$refs.myvideo.srcObject = stream;
          console.log(this.$refs.myvideo);
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
    },
    connect : function() {
      this.socket.emit("broadcaster");
    }
  }
})