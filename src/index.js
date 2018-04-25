// Ref: https://stackoverflow.com/questions/30565987/cropping-images-with-html5-canvas-in-a-non-rectangular-shape-and-transforming
let canvas = document.getElementById('main-canvas');
let showName = document.getElementById('filename');
let process = document.getElementById('process');
let slider = document.getElementById("height-slider");
let showValue = document.getElementById("slider-val");
let boxContent = document.getElementById("box-content");
let context = canvas.getContext('2d');
let boxHeight = 30;
let number = 1;

let boxes = []
let labels = []
let box = []
let change = false;
let nowX = -1, nowY = -1;
let isDrawing = false;

const start = () => {
  // set canvas sizes equal to image size
  canvas.width=img.width;
  canvas.height=img.height;

  // draw the example image on the source canvas
  context.drawImage(img,0,0);
  redraw();
}

let imgList = [];
let nowIdx = 0;
let img = new Image();
img.onload = start;
showValue.innerHTML = slider.value;

slider.oninput = () => {
  showValue.innerHTML = this.value;
  boxHeight = this.value;
  start();
}

window.onkeydown = (e) => {
  let key = e.keyCode ? e.keyCode : e.which;
  if (key == 37)
    boxHeight -= 1;
  else if (key == 39)
    boxHeight += 1;

  showValue.innerHTML = boxHeight;
  slider.value = boxHeight;
  start();
}

/////////////////////////////////// Get and Post methods /////////////////////////////////
class fetchObj {
  constructor(method, body) {
    if (body !== undefined)
      this.body = body;
    this.method = method; // *GET, POST, PUT, DELETE, etc.
    this.cache = 'no-cache'; // *default, no-cache, reload, force-cache, only-if-cached
    this.credentials = 'same-origin'; // include, same-origin, *omit
    this.headers = {
      'content-type': 'application/json'
    };
    this.mode = 'cors'; // no-cors, cors, *same-origin
    this.redirect = 'follow'; // manual, *follow, error
    this.referrer = 'no-referrer'; // *client, no-referrer
  }
}
const getList = (url) => {
  return fetch(url, new fetchObj('GET'))
           .then(response => response.json()); // parses response to JSON
}

const postLabel = (url, data) => {
  return fetch(url, new fetchObj('POST', JSON.stringify(data)));
}

// Initialize work number and initial image.
fetch('/api/number', new fetchObj('GET'))
  .then(response => response.json()) // parses response to JSON
  .then(data => { console.log('Get number: ', data); number = data; })
  .then(() => {
    getList('/api/imglists/' + number.toString())
    .then(data => { console.log('Get list: ', data); imgList = data; })
    .then(() => {
      postLabel('/api/imglabel', { 'name': 'init',
                                   'boxes': [],
                                   'labels': [],
                                   'next': imgList[nowIdx] })
        .then((res) => res.json())
        .then((res) => {
          process.innerHTML = '(' + imgList.length.toString() + '/' + (nowIdx+1).toString() + '):';
          console.log('Init boxes: ', res);
          box = [];
          boxes = res['boxes'];
          labels = res['labels'];
          initBoxLabels();
          img.src=imgList[nowIdx];
          showName.innerHTML = imgList[nowIdx];
          start();
          console.log('Complete initialization.');
        });
    });
  });

/////////////////////////////////// Canvas operations //////////////////////////////////////
// Ref: http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
$('#main-canvas').mousedown(function(e) {
  let mouseX = e.pageX - this.offsetLeft;
  let mouseY = e.pageY - this.offsetTop;

  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
});

$('#main-canvas').mousemove(function(e) {
  nowX = e.pageX - this.offsetLeft;
  nowY = e.pageY - this.offsetTop;
  start();
});

$('#main-canvas').mouseup(function(e) { redraw(); });
$('#main-canvas').mouseleave(function(e) { redraw(); });

$('#clear-button').click(function() {
  box = [];
  boxes = [];
  start();
});

$('#undo-button').click(function() {
  if (box.length != 0)
    box = [];
  else if (boxes.length != 0)
    boxes.pop();
  if (boxes.length != labels.length) {
    labels.pop();
    popBoxLabel();
  }
  start();
});

const changeImg = (nextIdx) => {
  process.innerHTML = '(' + imgList.length.toString() + '/' + (nextIdx+1).toString() + '):';
  completeBox(boxHeight)
    .then(() => {
      postLabel('/api/imglabel', { 'name': imgList[nowIdx], 
                                   'boxes': boxes,
                                   'labels': labels,
                                   'next': imgList[nextIdx] })
      .then((res) => res.json())
      .then((res) => {
        box = [];
        boxes = res['boxes'];
        labels = res['labels'];
        initBoxLabels();
        nowIdx = nextIdx;
        img.src = imgList[nowIdx];
        showName.innerHTML = imgList[nowIdx];
        redraw();
      });
    });
}

$('#next-button').click(() => changeImg((nowIdx+1) % imgList.length));
$('#prev-button').click(() => changeImg((nowIdx-1+imgList.length) % imgList.length));

/////////////////////////////////// Canvas functions //////////////////////////////////////
const addClick = (x, y) => {
  if (box.length == 4)
    completeBox(boxHeight);
  x = x < 0 ? 0 : x;
  y = y < 0 ? 0 : y;
  box.push(x);
  box.push(y);
  if (box.length == 2)
    isDrawing = true;
  else
    isDrawing = false;
  if (box.length == 4) {
    console.log('newBoxLabel');
    console.log(labels);
    newBoxLabel(boxes.length+1, '---');
    labels.push('---');
  }
}

const completeBox = (len) => {
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

const changeLabel = (number) => {
  let value = document.getElementById(`box${ number }`).value;
  labels[number-1] = value;
  // console.log('changeLabel ', number);
  // console.log('value', value);
}

const initBoxLabels = () => {
  boxContent.innerHTML = '';
  for(let i = 0; i < labels.length; i++)
    newBoxLabel(i+1, labels[i]);
}

const createElementFromHTML = (htmlString) => {
  let div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild;
}

const newBoxLabel = (number, content) => {
  boxContent.appendChild(createElementFromHTML(
    `<div class="box-wrapper">
       <span class="box-name">${ number }</span>
       <input class="box" type="text" oninput=changeLabel(${ number })
              id="box${ number }" name="box${ number }" value="${content}">
     </div>`));
}

const popBoxLabel = () => {
  boxContent.removeChild(boxContent.lastChild);
}

const getBox = (len) => {
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

const redraw = () => {
  context.strokeStyle = "#aa7777";
  context.lineJoin = "round";
  context.lineWidth = 2;
  context.fillStyle = "red";
  context.font = "12px Comic Sans MS";

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
    context.fillText((boxes.length + 1).toString(), tmp[0], tmp[1]-4);
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
    context.fillText((i + 1).toString(), boxes[i][0], boxes[i][1]-4);
  }
}
