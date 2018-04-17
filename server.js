const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser')
const readline = require('readline');

let number = 1, tot = 3;

// parse application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/src', express.static(__dirname + '/src'));
app.use('/cases', express.static(__dirname + '/cases'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/number', function(req, res) {
  // This function is unsafe !
  res.json(number);
  number = (number % tot) + 1;
});

app.get('/api/imglists/:number', function(req, res) {
  // This function is unsafe !
  let target_dir = 'cases/' + req.params.number.toString() + '/';
  console.log('Get: ', req.params);
  fs.readdir(target_dir, (err, files) => {
    for(let i = 0; i < files.length; i++)
      files[i] = target_dir + files[i];
    // console.log(files);
    res.json(files);
  });
});

// Read line by line
// https://stackoverflow.com/questions/6156501/read-a-file-one-line-at-a-time-in-node-js

function readLabel(name) {
  return new Promise((resolve, reject) => {
    let ss = name.split('/');
    let dest = 'labels/' + ss[1] + '/' + ss[2].split('.')[0] + '.txt';
    let boxes = [];
    if (fs.existsSync(dest)) {
      fs.readFile(dest, 'utf8', function(err, data) {
        let lines = data.split('\n');
        lines.forEach((line) => {
          let box = [];
          let ls = line.split(',');
          if (ls.length == 9) {
            for(let i = 0; i < 8; i++)
              box.push(parseInt(ls[i]));
            boxes.push(box);
          }
        });
        // console.log('Read boxes: ', boxes);
        console.log('Boxes read from: ', dest);
        resolve(boxes);
      });
      // rd = readline.createInterface({
        // input: fs.createReadStream(dest)
      // });
      // rd.on('line', function(line) {
        // // console.log('Get line: ', line);
        // box = [];
        // ls = line.split(',');
        // for(let i = 0; i < 8; i++)
          // box.push(parseInt(ls[i]));
        // boxes.push(box);
      // });
      // rd.on('close', function() {
        // // console.log('Read boxes: ', boxes);
        // resolve(boxes);
      // });
    }
    else {
      resolve(boxes);
    }
  });
}

function writeLabel(name, boxes) {
  return new Promise((resolve, reject) => {
    let ss = name.split('/');
    let dest = 'labels/' + ss[1] + '/' + ss[2].split('.')[0] + '.txt';
    let output = '';
    // console.log('Write boxes: ', boxes);
    for(let i = 0; i < boxes.length; i++) {
      for(let j = 0; j < boxes[i].length; j++) {
        output += boxes[i][j].toString() + ',';
      }
      output += '###\n';
    }
    fs.writeFile(dest, output, (err) => {
      if (err) throw err;
      resolve(dest);
    });
  });
}

app.post('/api/imglabel', function(req, res) {
  // This function is unsafe !
  // console.log('Post: ', req.params);
  // console.log('Dest: ', dest);
  // console.log('Name: ', name);
  // console.log('Boxes: ', boxes);
  const { name, boxes, next } = req.body;
  console.log('Get name: ', name);
  console.log('Get next: ', next);
  if (name != 'init') {
    writeLabel(name, boxes)
      .then((dest) => console.log('Result is written to ', dest));
  }
  readLabel(next)
    .then((ret) => res.json(ret));
});

http.listen(3000, function(){
  console.log('Listen on localhost:3000');
});

