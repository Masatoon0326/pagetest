const video = document.querySelector('video');
//const video = document.createElement("video");
const videoSelect = document.querySelector('select#videoSource');
const selectors = [videoSelect];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// 画像処理用のオフスクリーンCanvas
const offscreen = document.createElement("canvas");
const offscreenCtx = offscreen.getContext("2d");
//
var prescreen = document.createElement("canvas");
var prescrCtx = prescreen.getContext("2d");
var nowscreen = document.createElement("canvas");
var nowscrCtx = prescreen.getContext("2d");
var flag = 1;

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotStream(stream) {
  window.stream = stream;
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();

    // Canvasのサイズを映像に合わせる
    canvas.width = offscreen.width = video.videoWidth;
    canvas.height = offscreen.height = video.videoHeight;

    tick();
  };
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function tick() {
  let processor = {
    timerCallback: function() {
      if (this.video.paused || this.video.ended) {
        return;
      }
      this.computeFrame();
      let self = this;
      setTimeout(function () {
          self.timerCallback();
        }, 0);
    },

    doLoad: function() {
      this.video = document.querySelector("video");
      this.c1 = document.getElementById("c1");
      this.ctx1 = this.c1.getContext("2d");
      this.c2 = document.getElementById("c2");
      this.ctx2 = this.c2.getContext("2d");
      this.c3 = document.getElementById("c3");
      this.ctx3 = this.c3.getContext("2d");
      let self = this;
      this.video.addEventListener("play", function() {
          self.width = self.video.videoWidth / 2;
          self.height = self.video.videoHeight / 2;
          self.timerCallback();
        }, false);
    },

    computeFrame: function() {
      let frame1 = this.ctx1.getImageData(0, 0, this.width, this.height);
      this.ctx2.putImageData(frame1, 0, 0);
      this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);


      frame1 = this.ctx1.getImageData(0, 0, this.width, this.height);
      let frame2 = this.ctx2.getImageData(0, 0, this.width, this.height);

      let l = frame1.data.length / 4;

      diffFrame = this.ctx3.createImageData(this.width, this.height);

      for (let i = 0; i < l; i++) {
        let r = frame1.data[i * 4 + 0] - frame2.data[i * 4 + 0];
        let g = frame1.data[i * 4 + 1] - frame2.data[i * 4 + 1];
        let b = frame1.data[i * 4 + 2] - frame2.data[i * 4 + 2];
        diffFrame.data[i * 4 + 0] = Math.abs(r);
        diffFrame.data[i * 4 + 1] = Math.abs(g);
        diffFrame.data[i * 4 + 2] = Math.abs(b);
        diffFrame.data[i * 4 + 3] = 255;
      }

      this.ctx3.putImageData(diffFrame, 0, 0);
      return;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
  processor.doLoad();
  });
  window.requestAnimationFrame(tick);
}

function filter(outdata, predata, nowdata) {
  // 画像処理を行う
  for (let i = 0; i < outdata.length; i += 1){
    outdata[i] = Math.abs(5*(nowdata[i]-predata[i]))
  }
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  flag = 1
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const videoSource = videoSelect.value;
  const constraints = {
    audio: false,
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

videoSelect.onchange = start;

start();
