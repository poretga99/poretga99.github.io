let canvasOutput = document.getElementById("canvasOutput");
let canvasOutputCtx = canvasOutput.getContext('2d');
let canvasInput = document.getElementById("canvasInput");
let canvasInputCtx = canvasInput.getContext('2d');

let inputBuffer = null;
let outputBuffer = null;
let detector = null;

function start() {
    console.log("Starting");

    let width = 640;
    let height = 480;
    let resolution = {width: {exact: width}, height: {exact: height}};
    let video = document.getElementById('video');
    let numBytes = width * height * 4;
    let roi2d = null;

    class FrameBuffer
    {
        byteOffset = null;
        length = null;
        numBytes = null;
        dataPtr = null;
        dataOnHeap = null;
    }

    // Create Detector object
    detector = new Module.Detector(width, height);

    // Allocate input canvas buffer on heap
    inputBuffer = new FrameBuffer();
    inputBuffer.dataPtr = Module._malloc(numBytes);
    inputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, inputBuffer.dataPtr, numBytes);

    // Allocate output canvas buffer on heap
    outputBuffer = new FrameBuffer();
    outputBuffer.dataPtr = Module._malloc(numBytes);
    outputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, outputBuffer.dataPtr, numBytes);

    detector.setInputBuffer(inputBuffer.dataPtr, height, width);
    detector.setOutputBuffer(outputBuffer.dataPtr, height, width);
    detector.initializeTrackerROI(200, 200, 100, 100);

    // Start the camera capture
    console.log("Initializing camera...");
    startCamera(width, height, resolution, video, processFrame);


    function processFrame() {

        if(inputBuffer.dataOnHeap.length === 0) {
            console.log("Resetting the input buffer...");
            inputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, inputBuffer.dataPtr, numBytes);
        }

        // Get the canvas image data and copy it to heap buffer
        inputBuffer.dataOnHeap.set(new Uint8Array(canvasInputCtx.getImageData(0, 0, width, height).data));

        detector.processFrame();
        roi2d = detector.getCurrentROI();

        if(outputBuffer.dataOnHeap.length === 0) {
            console.log("Resetting the output buffer...");
            outputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, outputBuffer.dataPtr, numBytes);
        }

        // Copy image from the output buffer to the output canvas
        canvasOutputCtx.putImageData(new ImageData(new Uint8ClampedArray(outputBuffer.dataOnHeap), width, height), 0, 0);

        // Draw initial ROI rectangle
        canvasOutputCtx.beginPath();
        canvasOutputCtx.rect(roi2d.x, roi2d.y, roi2d.width, roi2d.height);
        canvasOutputCtx.strokeStyle = "red";
        canvasOutputCtx.stroke();
    }
}