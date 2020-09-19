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

class RemoteInfo {
  constructor(id) {
    this.id = id;
    this.connection = null;
    this.dataChannel = null;
    this.events = {
      onicecandidate : null,
      onconnectionstatechange : null,
      onmessage : null
    };
    this.senddata = '';
  }
  updateDataChannel(dataChannel) {
    const self = this;
    this.dataChannel = dataChannel;
    this.dataChannel.onerror = function (error) {
      console.log('Data Channel onerror:' + error);
    };
    
    this.dataChannel.onmessage = function (event) {
      console.log('Data Channel onmessage:' + event.data);
      //console.log(String.fromCharCode.apply("", new Uint8Array(event.data)));
      if (self.events) {
        if(self.events.onmessage) {
          self.events.onmessage(event);
        }
      }
    };

    this.dataChannel.onopen = function () {
      console.log('Data Channel onopen');
    };

    this.dataChannel.onclose = function () {
      console.log('Data Channel onclose');
    };
  }
  createConnection(config) {
    console.log('new RTCPeerConnection', config);
    const cnn = new RTCPeerConnection(config);
    this.connection = cnn;
    const self = this;
    cnn.onicecandidate = function(event) {
      console.log('onicecandidate', event);
      if (self.events) {
        if (self.events.onicecandidate) {
          self.events.onicecandidate(event);
        }
      }
    };
    cnn.onconnectionstatechange = function(event) {
      console.log('onconnectionstatechange', event, cnn.connectionState);
      if (self.events) {
        if (self.events.onconnectionstatechange) {
          self.events.onconnectionstatechange(event);
        }
      }
    };
    cnn.ondatachannel = function(event) {
      console.log('ondatachannel', event);
      self.updateDataChannel(event.channel);
    };
    const dataChannelOptions = {
      ordered: true, // 順序を保証する
      maxRetransmitTime: 3000 // ミリ秒
    };
    this.updateDataChannel(cnn.createDataChannel('data_cahnnel', dataChannelOptions));
    
  }
}

const app = new Vue({
  el: '#app',
  data: {
    messages : [],
    remotes : {},
    socket : {}
  },
  computed: {
  },
  created : function() {
    this.socket = io.connect(window.location.origin);
    const self = this;

    this.socket.on("broadcaster", (id) => {
      // broadcasterを受信した場合
      console.log('on broadcaster',id);
      if (self.remotes[id]) {
        console.log('already existed...');
      }
      const remoteinfo = new RemoteInfo(id);
      Vue.set(self.remotes, id, remoteinfo);
      console.log(self.remotes, id, remoteinfo);
    });


    this.socket.on("answer", (id, description) => {
      // answerを受信した場合
      console.log('on answer');
      self.remotes[id].connection.setRemoteDescription(description);
    });

    this.socket.on("candidate", (id, candidate) => {
      // candidateを受信した場合
      console.log('on candidate');
      self.remotes[id].connection.addIceCandidate(new RTCIceCandidate(candidate));
    });
 
    this.socket.on("disconnectPeer", id => {
      // disconnectPeerを受信した場合
      console.log('on disconnectPeer');
      self.removeRemoteInfo(id);
    });

    this.socket.on("offer", (id, description) => {
      // offerを受信した場合
      console.log('on offer', id, description);
      const remoteinfo = new RemoteInfo(id, description);
      Vue.set(self.remotes, id, remoteinfo);
      self.remotes[id].createConnection(config);
      self.setupPeerConnection(id);

      const cnn = self.remotes[id].connection;
      cnn.setRemoteDescription(description)
        .then(() => {
          console.log('setRemoteDescription ... end');
         return cnn.createAnswer();
        })
        .then(sdp => {
          console.log('createAnswer ... end', sdp);
          return cnn.setLocalDescription(sdp);
        })
        .then(() => {
          console.log('setLocalDescription....end');
          return self.socket.emit("answer", id, cnn.localDescription);
        });
    });
  },
  methods: {
    broadcaster: function () {
      console.log('broadcaster');
      this.socket.emit("broadcaster");
    },
    offer: function(id) {
      console.log('offer');
      const self = this;
      if (!this.remotes[id]) {
        console.error('not found', id);
        return false;
      }
      this.remotes[id].createConnection(config);
      const cnn = this.remotes[id].connection;
      this.setupPeerConnection(id);

      cnn.createOffer()
        .then(sdp => {
          console.log('createOffer ... end', sdp);
          cnn.setLocalDescription(sdp);
        })
        .then(() => {
          console.log('setLocalDescription....end');
          self.socket.emit("offer", id, cnn.localDescription);
        });
    },
    send : function(id) {
      console.log('send..', id, this.remotes[id].senddata);
      this.remotes[id].dataChannel.send(this.remotes[id].senddata);
    },
    close : function(id) {
      console.log('close..', id);
      this.remotes[id].connection.close();
      this.removeRemoteInfo(id);
    },
    removeRemoteInfo(id) {
      console.log('removeRemoteInfo', id);
      if (this.remotes[id]) {
        this.remotes[id].connection.close();
        Vue.delete(this.remotes, id);
      }
    },
    setupPeerConnection(id) {
      const self = this;
      const cnn = self.remotes[id].connection;
      self.remotes[id].events.onicecandidate = evenet => {
        console.log('...onicecandidates', event.candidate);
        if (event.candidate) {
          self.socket.emit("candidate", id, event.candidate);
        }
      };
      self.remotes[id].events.onconnectionstatechange = event => {
        console.log('...onconnectionstatechange', cnn.connectionState);
        if (cnn.connectionState === "disconnected") {
          self.removeRemoteInfo(id);
        }
      };
      self.remotes[id].events.onmessage = event => {
        console.log('...onmessage', event);
        self.messages.push(event.data);
      };
    }
  }
})
