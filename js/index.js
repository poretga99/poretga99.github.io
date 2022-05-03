let canvasOutput = document.getElementById("canvasOutput");
let canvasOutputCtx = canvasOutput.getContext('2d');
let canvasInput = document.getElementById("canvasInput");
let canvasInputCtx = canvasInput.getContext('2d');

let inputBuffer = null;
let outputBuffer = null;
let detector = null;

class MouseLocation {
    startX = 0;
    startY = 0;
    currX = 0;
    currY = 0;
    endX = 0;
    endY = 0;
    pressed = false;
}
class MouseROI {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    set = false;
}
let roi = new MouseROI()
let mouseLocation = new MouseLocation();
let roi_idx = 0;

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
    //detector.initializeTrackerROI(100, 100, 80, 80, Module.CornerType.TR);
    //detector.initializeTrackerROI(300, 300, 80, 80, Module.CornerType.TL);

    // Start the camera capture
    console.log("Initializing camera...");
    initializeInputCanvasROIDrawing("canvasInput")
    startCamera(width, height, resolution, video, processFrame);

    function processFrame() {

        if(inputBuffer.dataOnHeap.length === 0) {
            console.log("Resetting the input buffer...");
            inputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, inputBuffer.dataPtr, numBytes);
        }

        // If mouse is pressed, draw ROI
        if(mouseLocation.pressed) {
            canvasInputCtx.beginPath();
            canvasInputCtx.rect(mouseLocation.startX, mouseLocation.startY,
                mouseLocation.currX - mouseLocation.startX, mouseLocation.currY - mouseLocation.startY);
            canvasInputCtx.strokeStyle = "red";
            canvasInputCtx.stroke();
        }

        // Get the canvas image data and copy it to heap buffer
        inputBuffer.dataOnHeap.set(new Uint8Array(canvasInputCtx.getImageData(0, 0, width, height).data));

        detector.processFrame();

        if(outputBuffer.dataOnHeap.length === 0) {
            console.log("Resetting the output buffer...");
            outputBuffer.dataOnHeap = new Uint8Array(Module.HEAP8.buffer, outputBuffer.dataPtr, numBytes);
        }

        // Copy image from the output buffer to the output canvas
        canvasOutputCtx.putImageData(new ImageData(new Uint8ClampedArray(outputBuffer.dataOnHeap), width, height), 0, 0);

    }

    function initializeInputCanvasROIDrawing(canvasId)
    {
        let canvas = document.getElementById(canvasId)
        canvas.addEventListener("mousedown", function(e) {
            trackMouse('down', e)
        }, false)

        canvas.addEventListener("mousemove", function(e) {
            trackMouse('move', e);
        }, false)

        canvas.addEventListener("mouseup", function(e) {
            trackMouse('up', e)
        }, false)
    }

    function trackMouse(event, e) {
        if (event === 'down') {
            mouseLocation.startX = e.clientX - canvasInput.offsetLeft;
            mouseLocation.startY = e.clientY - canvasInput.offsetTop;
            mouseLocation.currX = mouseLocation.startX;
            mouseLocation.currY = mouseLocation.startY;
            mouseLocation.pressed = true;
        }
        if (event === 'move' && mouseLocation.pressed) {
            mouseLocation.currX = e.clientX - canvasInput.offsetLeft;
            mouseLocation.currY = e.clientY - canvasInput.offsetTop;
        }
        if (event === 'up') {
            mouseLocation.endX = mouseLocation.currX;
            mouseLocation.endY = mouseLocation.currY;
            mouseLocation.pressed = false;
            roi.x = Math.min(mouseLocation.startX, mouseLocation.endX);
            roi.y = Math.min(mouseLocation.startY, mouseLocation.endY);

            if (roi.x === 0 || roi.y === 0 ){
                roi.width = 80;
                roi.height = 80;
                roi.x = Math.min(Math.max(roi.x - roi.width / 2, 0), width - 1);
                roi.y = Math.min(Math.max(roi.y - roi.height / 2, 0), height - 1);
            } else {
                roi.width = Math.abs(mouseLocation.startX - mouseLocation.endX);
                roi.height = Math.abs(mouseLocation.startY - mouseLocation.endY);
            }


            roi.set = true;

            if (roi_idx < 4){
                let cornerType = null;
                switch(roi_idx){
                    case 0:
                        cornerType = Module.CornerType.TL;
                        break;
                    case 1:
                        cornerType = Module.CornerType.TR;
                        break;
                    case 2:
                        cornerType = Module.CornerType.BL;
                        break;
                    case 3:
                        cornerType = Module.CornerType.BR;
                        break;
                    default:
                        cornerType = Module.CornerType.TL;
                        break;
                }
                detector.initializeTrackerROI(roi.x, roi.y, roi.width, roi.height, cornerType);
                roi_idx = roi_idx + 1;
            }

        }
    }

}