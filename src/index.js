// Ref: https://stackoverflow.com/questions/30565987/cropping-images-with-html5-canvas-in-a-non-rectangular-shape-and-transforming
let canvas = document.getElementById('main-canvas');
let showName = document.getElementById('filename');
let process = document.getElementById('process');
let slider = document.getElementById("height-slider");
let showValue = document.getElementById("slider-val");
let boxContent = document.getElementById("box-content");
let context = canvas.getContext('2d');
let boxHeight = 30;
let workNumber = 0;

let boxes = []
let labels = []
let box = []
let change = false;
let nowX = -1, nowY = -1;
let isDrawing = false;
let rotateDegree = 0;

const getOffset = (e) => {
  let { left, right, top, bottom } = canvas.getBoundingClientRect();
  left   += window.scrollX;
  right  += window.scrollX;
  top    += window.scrollY;
  bottom += window.scrollY;
  let values = [e.pageX - left, e.pageY - top, right - e.pageX, bottom - e.pageY];
  return [values[(rotateDegree / 90) % 4], values[(rotateDegree / 90 + 1) % 4]];
}

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

const getUrl = (url, data) => {
  return fetch(url, new fetchObj('GET'));
}

const putUrl = (url, data) => {
  return fetch(url, new fetchObj('PUT', JSON.stringify(data)));
}

const getAndSet = (url) => {
  return getUrl(url)
           .then((res) => res.json())
           .then((res) => {
              process.innerHTML = '(' + imgList.length.toString() + '/' + (nowIdx+1).toString() + '):';
              box = [];
              boxes = res['boxes'];
              labels = res['labels'];
              initBoxLabels();
              img.src=imgList[nowIdx];
              showName.innerHTML = imgList[nowIdx];
              start();
           });
}

const changeImg = (nextIdx) => {
  completeBox(boxHeight)
    .then(() => {
      putUrl('/api/imglabel', { 'name': imgList[nowIdx], 
                                'workNumber': workNumber,
                                'current': nextIdx,
                                'boxes': boxes,
                                'labels': labels })
        .then((res) =>  {
          nowIdx = nextIdx;
          getAndSet('/api/imglabel?name=' + imgList[nextIdx]);
        });
    });
}

const initForm = document.getElementById('init-form');
const getInitFrom = (form) => {
  workNumber = form.elements['work-number'].value;
  if (Number.isInteger(parseInt(workNumber))) {
    initForm.style.display = 'none';
    canvas.style.display = 'block';
    getUrl('/api/imglists/' + workNumber)
      .then((res) => res.json())
      .then(data => {
        console.log('Get list: ', data);
        imgList = data['imgnames'];
        nowIdx = data['current'];
      })
      .then(() => {
        if (imgList.length > nowIdx && nowIdx >= 0)
          getAndSet('/api/imglabel?name=' + imgList[nowIdx]);
        else console.error('NowIdx is not valid.');
      });
  }
  else {
    alert("Please type in valid working number!");
  }
}

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

const toggleDontCare = () => {
  let idName = `box${ labels.length }`
  let target = document.getElementById(idName);
  if (target.classList.contains('dont-care')) {
    labels[labels.length-1] = '---';
    $('#' + idName).removeClass('dont-care');
  }
  else {
    labels[labels.length-1] = '###';
    $('#' + idName).addClass('dont-care');
  }
  console.log(labels);
}

const changeLabel = (number) => {
  let value = document.getElementById(`box${ number }`).value;
  labels[number-1] = value;
}

const removeLabel = (number) => {
  console.log(number);
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
  let newBox = createElementFromHTML(
   `<li class="box" onclick=removeLabel(${number})>
      <a href="#" class="tag" id="box${ number }">
        ${ number }
      </a>
    </li>`);
  if (boxContent.childElementCount >= 1)
    boxContent.insertBefore(newBox, boxContent.children[0]);
  else
    boxContent.appendChild(newBox);
}

const popBoxLabel = () => {
  boxContent.removeChild(boxContent.firstChild);
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

const undoBox = () => {
  if (box.length != 0)
    box = [];
  else if (boxes.length != 0)
    boxes.pop(); // pop back
  if (boxes.length != labels.length) {
    labels.pop(); // pop back
    popBoxLabel(); // remove first !
  }
  start();
}

const clearBox = () => {
  box = [];
  boxes = [];
  boxContent.innerHTML = '';
  start();
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

/////////////////////////////////// Canvas operations //////////////////////////////////////
// Ref: http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
$('#main-canvas').mousedown(function(e) {
  let offsets = getOffset(e);
  addClick(offsets[0], offsets[1]);
});

$('#main-canvas').mousemove(function(e) {
  [nowX, nowY] = getOffset(e);
  start();
});

$('#main-canvas').mouseup(function(e) { redraw(); });
$('#main-canvas').mouseleave(function(e) { redraw(); });

$('#undo-button').click(undoBox);
$('#clear-button').click(clearBox);

$('#next-button').click(() => changeImg((nowIdx+1) % imgList.length));
$('#prev-button').click(() => changeImg((nowIdx-1+imgList.length) % imgList.length));

$('#rotate-button').click(() => {
  rotateDegree = (rotateDegree + 90) % 360;
  canvas.style.webkitTransform = `rotate(${rotateDegree}deg)`;
  canvas.style.mozTransform    = `rotate(${rotateDegree}deg)`;
  canvas.style.msTransform     = `rotate(${rotateDegree}deg)`;
  canvas.style.oTransform      = `rotate(${rotateDegree}deg)`;
  canvas.style.transform       = `rotate(${rotateDegree}deg)`;
});

/////////////////////////////////// Window functions /////////////////////////////////
slider.oninput = () => {
  showValue.innerHTML = slider.value;
  boxHeight = slider.value;
  start();
}

window.onkeydown = (e) => {
  let key = e.keyCode ? e.keyCode : e.which;
  if (key == 37 || key == 67) // '<-' or 'C'
    boxHeight -= 1;
  else if (key == 39 || key == 86) // '->' or 'V'
    boxHeight += 1;
  else if (key == 90) // 'Z'
    undoBox();
  else if (key == 88) // 'X'
    toggleDontCare();

  showValue.innerHTML = boxHeight;
  slider.value = boxHeight;
  start();
}
