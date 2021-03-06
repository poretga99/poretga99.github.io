function startCamera(_width, _height, _resolution, _video, _processFrameFcn) {
    let width = _width;
    let height = _height;
    let resolution = _resolution;
    let video = _video;
    let stream = null;
    let streaming = false;
    let processFrameFcn = _processFrameFcn;

    openCamera();

    function openCamera() {
        if (streaming) return;
        navigator.mediaDevices.getUserMedia(
            {
                video: {
                    facingMode: "environment",
                    width: {
                        min: 480,
                        ideal: 480,
                        max: 720,
                    },
                    height: {
                        min: 640,
                        ideal: 640,
                        max: 1280,
                    },
                },
                audio: false}
        )
            .then(function(s) {
                stream = s;
                video.srcObject = s;
                video.play();
            })
            .catch(function(err) {
                console.log("An error occured! " + err);
            });

        video.addEventListener("canplay", function(ev){
            if (!streaming) {
                video.setAttribute("width", width);
                video.setAttribute("height", height);
                streaming = true;
            }
            startVideoProcessing();
        }, false);
    }

    function startVideoProcessing() {
        console.log("Started with video processing.");
        requestAnimationFrame(processVideoAtFPS);
    }

    const fps = 30;
    function processVideoAtFPS() {
        // Load image from GPU buffer to the canvas object
        canvasInputCtx.drawImage(video, 0, 0, width, height);

        // Execute frame processing
        processFrameFcn();

        setTimeout(() => {
            requestAnimationFrame(processVideoAtFPS);
        }, 1000 / fps);
    }
}

