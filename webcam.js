var localVideo = document.getElementById('local_video');
var micList = document.getElementById("mic_list");
var cameraList = document.getElementById("camera_list");
var speakerList = document.getElementById("speaker_list");

var localStream = null;

// 表示用のCanvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// 画像処理用のオフスクリーンCanvas
const offscreen = document.createElement("canvas");
const offscreenCtx = offscreen.getContext("2d");
// カメラから映像を取得するためのvideo要素→local_videoにする
//const video = document.createElement("video");
var flag = 1;

 
function stopVideo() {
 localVideo.pause();
 if (localVideo.srcObject) {
   localVideo.srcObject = null;
 }
 else {
   localVideo.src = "";
 }

 if (localStream) {
  stopStream(localStream);
  localStream = null;
 }
}

function stopStream(stream) {
 if (!stream) {
  console.warn('NO stream');
  return;
 }
   
 var tracks = stream.getTracks();
 if (! tracks) {
  console.warn('NO tracks');
  return;
 }

 for (index in tracks) {
  tracks[index].stop();
 } 
}  

function logStream(msg, stream) {
 console.log(msg + ': id=' + stream.id);

 var videoTracks = stream.getVideoTracks();
 if (videoTracks) {
  console.log('videoTracks.length=' + videoTracks.length);
  for (var i = 0; i < videoTracks.length; i++) {
   var track = videoTracks[i];
   console.log(' track.id=' + track.id);
  }
 }
 
 var audioTracks = stream.getAudioTracks();
 if (audioTracks) {
  console.log('audioTracks.length=' + audioTracks.length);
  for (var i = 0; i < audioTracks.length; i++) {
   var track = audioTracks[i];
   console.log(' track.id=' + track.id);
  }
 }
}


//--------------------

function clearDeviceList() {
 while(micList.lastChild) {
  micList.removeChild(micList.lastChild);
 }
 while(cameraList.lastChild) {
  cameraList.removeChild(cameraList.lastChild);
 }
 while(speakerList.lastChild) {
  speakerList.removeChild(speakerList.lastChild);
 }
}

function addDevice(device) {
 if (device.kind === 'audioinput') {
  var id = device.deviceId;
  var label = device.label || 'microphone'; // label is available for https 
  var option = document.createElement('option');
  option.setAttribute('value', id);
  option.innerHTML = label + '(' + id + ')';;
  micList.appendChild(option);
 }
 else if (device.kind === 'videoinput') {
  var id = device.deviceId;
  var label = device.label || 'camera'; // label is available for https 

  var option = document.createElement('option');
  option.setAttribute('value', id);
  option.innerHTML = label + '(' + id + ')';
  cameraList.appendChild(option);
 }
 else if (device.kind === 'audiooutput') {
  var id = device.deviceId;
  var label = device.label || 'speaker'; // label is available for https 

  var option = document.createElement('option');
  option.setAttribute('value', id);
  option.innerHTML = label + '(' + id + ')';
  speakerList.appendChild(option);   
 }
 else {
  console.error('UNKNOWN Device kind:' + device.kind);
 }
}



function getDeviceList() {
  clearDeviceList();
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
   devices.forEach(function(device) {
    console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
    addDevice(device);
   });
  })
  .catch(function(err) {
   console.error('enumerateDevide ERROR:', err);
  });
 }

 function getSelectedVideo() {
  var id = cameraList.options[cameraList.selectedIndex].value;
  return id;
 }

 function getSelectedAudio() {
  var id = micList.options[micList.selectedIndex].value;
  return id;
 }

 function getSelectedSpeaker() {
  var id = speakerList.options[speakerList.selectedIndex].value;
  return id;
 }

 function setSpeaker() {
  var speakerId = getSelectedSpeaker();
  localVideo.volume = 0;
  localVideo.setSinkId(speakerId)
  .then(function() {
   console.log('setSinkID Success');
  })
  .catch(function(err) {
   console.error('setSinkId Err:', err);
  });
 }

 function startFakeVideo() {
  var constraints = {video: true, fake: true, audio: false};
  navigator.mediaDevices.getUserMedia(
   constraints
  ).then(function(stream) {
   localStream = stream;
   logStream('selectedVideo', stream);
   localVideo.srcObject = stream;
  }).catch(function(err){
   console.error('getUserMedia Err:', err);
  });
 }



function startSelectedVideoAudio() {
  var audioId = getSelectedAudio();
  var deviceId = getSelectedVideo();
  var constraints = {
    audio: false,
    video: { 
     deviceId: deviceId,
     iso: 3200,
     frameRate : 30
    }
  };

  navigator.mediaDevices.getUserMedia(
   constraints
  ).then(function(stream) {
   
   localVideo.srcObject = stream;
   // streamの読み込み完了
   Video.onloadedmetadata = () => {
    Video.play();

   // Canvasのサイズを映像に合わせる
   var canwidth = localVideo.videoWidth;
   var canheight = localVideo.videoHeight
   canvas.width = offscreen.width = canwidth;
   canvas.height = offscreen.height = canheight;

   tick();
  };

  }).catch(function(err){
   console.error('getUserMedia Err:', err);
  });
 }

 function tick() {
  // カメラの映像をCanvasに描画する
  offscreenCtx.drawImage(localVideo, 0, 0);

  // イメージデータを取得する（[r,g,b,a,r,g,b,a,...]のように1次元配列で取得できる）
  const imageData = offscreenCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  var nowimageData = imageData;
  if (flag == 1){
    var preimageData = imageData;
    var processedimageData = imageData;
    flag += 2;
  }
  // imageData.dataはreadonlyなのでfilterメソッドで直接書き換える
  //filter(processedimageData.data, nowimageData.data, preimageData.data);

  // オフスクリーンCanvasを更新する
  offscreenCtx.putImageData(nowdata, 0, 0);

  // 表示用Canvasに描画する
  ctx.drawImage(offscreen, 0, 0);
  // 次フレームを処理する
  window.requestAnimationFrame(tick);
}

function filter(data, nowdata, predata) {
  // 画像処理を行う
  //モノクロ化
  for (let i = 0; i < nowdata.length; i += 4) {
    // (r+g+b)/3
    const color = (nowdata[i] + nowdata[i+1] + nowdata[i+2]) / 3;
    nowdata[i] = nowdata[i+1] = nowdata[i+2] = color;
  }
  
  //差分計算
  for (let i = 0; i < canwidth; i++){
    for(let j = 0; j < canheight; j++){
      let delta = 128 + (nowdata[i * canheight * 4 + j * 4 + 0] - predata[i * canheight * 4 + j * 4 + 0]) * 10;
      data[i * canheight * 4 + j * 4 + 0] = data[i * canheight * 4 + j * 4 + 1] = data[i * canheight * 4 + j * 4 + 2] = Math.abs(delta);
    }
  }
  predata = nowdata;
}
