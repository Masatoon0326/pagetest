<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Masatoon_CameraTest</title>
<style>
  div.select {
      display: inline-block;
      margin: 0 0 1em 0;
  }

  p.small {
      font-size: 0.7em;
  }

  label {
      width: 12em;
      display: inline-block;
  }
</style>

</head>
<body>
    
<div class="select">
    <label for="audioSource">Audio input source: </label><select id="audioSource"></select>
</div>

<div class="select">
    <label for="audioOutput">Audio output destination: </label><select id="audioOutput"></select>
</div>

<div class="select">
    <label for="videoSource">Video source: </label><select id="videoSource"></select>
</div>

<video id="video" playsinline autoplay></video>

</body>
<script src="webcam.js"></script>
</html>
