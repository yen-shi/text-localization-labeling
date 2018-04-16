// Ref: https://stackoverflow.com/questions/30565987/cropping-images-with-html5-canvas-in-a-non-rectangular-shape-and-transforming
let canvas = document.getElementById('main-canvas');
let context = canvas.getContext('2d');
let showName = document.getElementById('filename');

imgList = ['cases/case-1.png', 'cases/case-2.png', 'cases/case-3.png', 'cases/case-4.png', 'cases/case-5.png']
nowIdx = 0;

// load example image
let img = new Image();
img.onload = start;
img.src = imgList[nowIdx];
showName.innerHTML = imgList[nowIdx];

function start() {

  // set canvas sizes equal to image size
  cw=canvas.width=canvas.width=img.width;
  ch=canvas.height=canvas.height=img.height;

  // draw the example image on the source canvas
  context.drawImage(img,0,0);

}

// Ref: http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
let boxes = []
let box = []
let change = false;
let nowX = -1, nowY = -1;

$('#main-canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;

  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
});

$('#main-canvas').mousemove(function(e){
  nowX = e.pageX - this.offsetLeft;
  nowY = e.pageY - this.offsetTop;
  redraw();
});

$('#main-canvas').mouseup(function(e){
  redraw();
});

$('#main-canvas').mouseleave(function(e){
  redraw();
});

$('#clear-button').click(function () {
  box = [];
  boxes = [];
  start();
});

$('#undo-button').click(function () {
  if (box.length != 0)
    box = [];
  else if (boxes.length != 0)
    boxes.pop();
  start();
  redraw();
});

$('#next-button').click(function () {
  box = [];
  boxes = [];
  nowIdx++;
  nowIdx %= imgList.length;
  img.src=imgList[nowIdx];
  showName.innerHTML = imgList[nowIdx];
});

function addClick(x, y)
{
  console.log('Add (x, y) = (', x, ', ', y, ')');
  box.push(x);
  box.push(y);
  if (box.length == 8) {
    boxes.push(box);
    box = [];
  }
}

function redraw(){
  // context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  context.strokeStyle = "#aa7777";
  context.lineJoin = "round";
  context.lineWidth = 2;

  if (box.length != 0) {
    context.beginPath();
    context.moveTo(box[0], box[1]);
    for(let i = 2; i < box.length; i = i+2)
      context.lineTo(box[i], box[i+1]);
    context.stroke();
  }

  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 3;
  for(let i = 0; i < boxes.length; i++) {
    context.beginPath();
    context.moveTo(boxes[i][0], boxes[i][1]);
    for(let j = 2; j < 8; j = j+2)
      context.lineTo(boxes[i][j], boxes[i][j+1]);
    context.closePath();
    context.stroke();
  }
}

// let intervalID = window.setInterval(redraw, 500);
