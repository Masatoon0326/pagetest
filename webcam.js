//const video = document.querySelector('video');
const video = document.createElement("video");
const videoSelect = document.querySelector('select#videoSource');
const selectors = [videoSelect];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// 画像処理用のオフスクリーンCanvas
const offscreen = document.createElement("canvas");
const offscreenCtx = offscreen.getContext("2d");


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
  // カメラの映像をCanvasに描画する
  offscreenCtx.drawImage(video, 0, 0);

  // イメージデータを取得する（[r,g,b,a,r,g,b,a,...]のように1次元配列で取得できる）
  const imageData = offscreenCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  // imageData.dataはreadonlyなのでfilterメソッドで直接書き換える
  filter(imageData.data);

  // オフスクリーンCanvasを更新する
  offscreenCtx.putImageData(imageData, 0, 0);

  // 表示用Canvasに描画する
  ctx.drawImage(offscreen, 0, 0);

  // 次フレームを処理する
  window.requestAnimationFrame(tick);
}
function filter(data) {
  // 画像処理を行う
}
function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
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
