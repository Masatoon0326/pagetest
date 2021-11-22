async function main() {
    // 表示用のCanvas
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    // 画像処理用のオフスクリーンCanvas
    const offscreen = document.createElement("canvas");
    const offscreenCtx = offscreen.getContext("2d");
    // カメラから映像を取得するためのvideo要素
    const video = document.createElement("video");
  
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
  
    video.srcObject = stream;
    // streamの読み込み完了
    video.onloadedmetadata = () => {
      video.play();
  
      // Canvasのサイズを映像に合わせる
      var canwidth = video.videoWidth;
      var canheight = video.videoHeight
      canvas.width = offscreen.width = canwidth;
      canvas.height = offscreen.height = canheight;
  
      tick();
    };
    
    var flag = 1;
    // 1フレームごとに呼び出される処理
    function tick() {
      // カメラの映像をCanvasに描画する
      offscreenCtx.drawImage(video, 0, 0);

      // イメージデータを取得する（[r,g,b,a,r,g,b,a,...]のように1次元配列で取得できる）
      const imageData = offscreenCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      var nowimageData = imageData;
      if (flag == 1){
        var preimageData = imageData;
        var processedimageData = imageData;
      }
      // imageData.dataはreadonlyなのでfilterメソッドで直接書き換える
      filter(processedimageData.data, nowimageData.data, preimageData.data);
  
      // オフスクリーンCanvasを更新する
      offscreenCtx.putImageData(processedimageData, 0, 0);
  
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
  }
  
  main();