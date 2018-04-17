// Ref: https://stackoverflow.com/questions/30565987/cropping-images-with-html5-canvas-in-a-non-rectangular-shape-and-transforming
let number = 1;
let canvas = document.getElementById('main-canvas');
let showName = document.getElementById('filename');
let process = document.getElementById('process');
let slider = document.getElementById("height-slider");
let showValue = document.getElementById("slider-val");
let context = canvas.getContext('2d');
let boxHeight = 30;

let boxes = []
let box = []
let change = false;
let nowX = -1, nowY = -1;
let isDrawing = false;

let imgList = [];
let nowIdx = 0;
let img = new Image();
img.onload = start;

showValue.innerHTML = slider.value;

slider.oninput = function() {
    showValue.innerHTML = this.value;
    boxHeight = this.value;
    redraw();
}

window.onkeyup = function(e) {
  let key = e.keyCode ? e.keyCode : e.which;
  // console.log('Get key : ', key);

  if (key == 37) {
      boxHeight -= 1;
  } else if (key == 39) {
      boxHeight += 1;
  }
  showValue.innerHTML = boxHeight;
  start();
}

/////////////////////////////////// Get and Post methods /////////////////////////////////
function getList(url) {
  return fetch(url, {
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json'
    },
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // *client, no-referrer
  })
  .then(response => response.json()); // parses response to JSON
}

// $.ajax({
//   type: 'POST',
//   url: '/api/imglabel',
//   data: { 'name': imgList[nowIdx], 'boxes': boxes },
//   dataType: 'application/json',
//   success: function() { console.log('Post success'); }
// });

function postLabel(url, data) {
  // console.log('Post data: ', data);
  return fetch(url, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // *client, no-referrer
  });
}

fetch('/api/number', {
  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, same-origin, *omit
  headers: {
    'user-agent': 'Mozilla/4.0 MDN Example',
    'content-type': 'application/json'
  },
  method: 'GET', // *GET, POST, PUT, DELETE, etc.
  mode: 'cors', // no-cors, cors, *same-origin
  redirect: 'follow', // manual, *follow, error
  referrer: 'no-referrer', // *client, no-referrer
})
.then(response => response.json()) // parses response to JSON
.then(data => { console.log('Get number: ', data); number = data; })
.then(() => {
  getList('/api/imglists/' + number.toString())
  .then(data => { console.log('Get list: ', data); imgList = data; })
  .then(() => {
    postLabel('/api/imglabel', { 'name': 'init',
                                 'boxes': [],
                                 'next': imgList[nowIdx] })
      .then((res) => res.json())
      .then((res) => {
        process.innerHTML = '(' + imgList.length.toString() + '/' + (nowIdx+1).toString() + '):';
        console.log('Init boxes: ', res);
        box = [];
        boxes = res;
        img.src=imgList[nowIdx];
        showName.innerHTML = imgList[nowIdx];
        redraw();
        console.log('Complete initialization.');
      });
  });
});

/////////////////////////////////// Canvas operations //////////////////////////////////////
// Ref: http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/

$('#main-canvas').mousedown(function(e){
  let mouseX = e.pageX - this.offsetLeft;
  let mouseY = e.pageY - this.offsetTop;

  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
});

$('#main-canvas').mousemove(function(e){
  nowX = e.pageX - this.offsetLeft;
  nowY = e.pageY - this.offsetTop;
  start();
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
  redraw();
});

function changeImg(nextIdx) {
  process.innerHTML = '(' + imgList.length.toString() + '/' + (nextIdx+1).toString() + '):';
  completeBox(boxHeight)
    .then(() => {
      console.log('post: ', boxes);
      postLabel('/api/imglabel', { 'name': imgList[nowIdx], 
                                   'boxes': boxes,
                                   'next': imgList[nextIdx] })
      .then((res) => res.json())
      .then((res) => {
        console.log('Post return: ', res);
        // boxes = [];
        box = [];
        boxes = res;
        nowIdx = nextIdx;
        img.src = imgList[nowIdx];
        showName.innerHTML = imgList[nowIdx];
        redraw();
      });
    });
}

$('#next-button').click(function () {
  changeImg((nowIdx+1) % imgList.length);
});

$('#prev-button').click(function () {
  changeImg((nowIdx-1+imgList.length) % imgList.length);
});

/////////////////////////////////// Canvas functions //////////////////////////////////////
function addClick(x, y)
{
  // console.log('Add (x, y) = (', x, ', ', y, ')');
  if (box.length == 4) {
    completeBox(boxHeight);
  }
  box.push(x);
  box.push(y);
  if (box.length == 2)
    isDrawing = true;
  else
    isDrawing = false;
}

function completeBox(len) {
  return new Promise((resolve, reject) => {
    if (box.length == 4) {
      let aX = box[1] - box[3];
      let aY = box[2] - box[0];
      let tot = Math.pow( Math.pow(aX, 2) + Math.pow(aY, 2), 0.5);
      aX = Math.round(aX * len / tot);
      aY = Math.round(aY * len / tot);
      box.push(box[2] + aX);
      box.push(box[3] + aY);
      box.push(box[0] + aX);
      box.push(box[1] + aY);
      boxes.push(box);
      box = [];
    }
    resolve();
  });
}

function getBox(len) {
  let aX = box[1] - box[3];
  let aY = box[2] - box[0];
  let tot = Math.pow( Math.pow(aX, 2) + Math.pow(aY, 2), 0.5);
  let newBox = box.slice();
  aX = Math.round(aX * len / tot);
  aY = Math.round(aY * len / tot);
  newBox.push(box[2] + aX);
  newBox.push(box[3] + aY);
  newBox.push(box[0] + aX);
  newBox.push(box[1] + aY);
  return newBox;
}

function start() {
  // set canvas sizes equal to image size
  canvas.width=img.width;
  canvas.height=img.height;

  // draw the example image on the source canvas
  context.drawImage(img,0,0);
  redraw();
}

function redraw() {
  // context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  context.strokeStyle = "#aa7777";
  context.lineJoin = "round";
  context.lineWidth = 2;

  if (box.length == 2) {
    context.beginPath();
    context.moveTo(box[0], box[1]);
    if (nowX != -1)
      context.lineTo(nowX, nowY);
    context.stroke();
  }
  else if (box.length == 4) {
    let tmp = getBox(boxHeight);
    context.beginPath();
    context.moveTo(tmp[0], tmp[1]);
    for(let j = 2; j < 8; j = j+2)
      context.lineTo(tmp[j], tmp[j+1]);
    context.closePath();
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

