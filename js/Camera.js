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
                facingMode: { "ideal": "environment" },
                video: {
                    width: {
                        min: 1280,
                        ideal: 1920,
                        max: 2560,
                    },
                    height: {
                        min: 720,
                        ideal: 1080,
                        max: 1440,
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
        requestAnimationFrame(processVideo);
    }

    function processVideo() {
        // Load image from GPU buffer to the canvas object
        canvasInputCtx.drawImage(video, 0, 0, width, height);

        // Execute frame processing
        processFrameFcn();

        // Request frame refresh
        requestAnimationFrame(processVideo);
    }
}

