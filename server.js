const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser')
const readline = require('readline');

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/src', express.static(__dirname + '/src'));
app.use('/cases', express.static(__dirname + '/cases'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// send images list
app.get('/api/imglists/:number', function(req, res) {
  console.log('Get: ', req.params);
  const currentIndex = req.query.currentIndex;
  if (!isNaN(parseInt(req.params.number))) {
    let cur_working_dir = 'cases/' + parseInt(req.params.number).toString();
    let target_dir = cur_working_dir+ '/';
    let cur_index_file = cur_working_dir + '.txt';
    let content = undefined
    console.log('currentIndex : ', currentIndex);
    if (currentIndex != 'last')
      content = parseInt(currentIndex)
    else if (fs.existsSync(cur_index_file))
      content = fs.readFileSync(cur_index_file, 'utf8');
    if (fs.existsSync(target_dir)) {
      fs.readdir(target_dir, (err, files) => {
        if (files.length == 0) {
          console.log('Work dir is empty!');
          res.send('Work dir is empty!');
        }
        for(let i = 0; i < files.length; i++)
          files[i] = target_dir + files[i];
        content = (content === undefined) ? 0 : parseInt(content);
        res.json({ 'imgnames': files, 'current': content });
      });
    }
    else {
      console.log('Work number is wrong!');
      res.send('Work number is wrong!');
    }
  }
  else {
    console.log('URL is in wrong format!');
    res.send('URL is in wrong format!');
  }
});

// get image
app.get('/api/imglabel', function(req, res) {
  const name = req.query.name;
  console.log('Get name: ', name);
  readLabel(name)
    .then((ret) => res.json(ret));
});

// put image
app.put('/api/imglabel', function(req, res) {
  const { name, workNumber, current, boxes, labels } = req.body;
  console.log('Put name: ', name);
  writeLabel(name, workNumber, current, boxes, labels)
    .then((dest) => console.log('Result is written to ', dest))
    .then(() => res.send('The result has been saved.'));
});

http.listen(3000, function(){
  console.log('Listen on localhost:3000');
});

/****************************************************************************
 * Useful functions
 * *************************************************************************/

const getLabelDest = (name) => {
  let ss = name.split('/');
  let dest = 'labels/' + ss[1] + '/' + ss[2].split('.')[0] + '.txt';
  if (/^labels\/[0-9]+\/[0-9a-zA-Z_-]+\.txt$/.test(dest))
    return dest;
  else
    return '';
}

// Read line by line
// https://stackoverflow.com/questions/6156501/read-a-file-one-line-at-a-time-in-node-js
const readLabel = (name) => {
  return new Promise((resolve, reject) => {
    let boxes = [];
    let labels = [];
    let dest = getLabelDest(name);
    if (fs.existsSync(dest)) {
      fs.readFile(dest, 'utf8', function(err, data) {
        let lines = data.split('\n');
        // console.log(lines);
        lines.forEach((line) => {
          let box = [];
          let ls = line.split(',');
          if (ls.length >= 8 && ls.length <= 12) {
            for(let i = 0; i < 8; i++)
              box.push(parseInt(ls[i]));
            boxes.push(box);
            labels.push(ls[8]);
          }
        });
        console.log('Boxes read from: ', dest);
        resolve({'boxes': boxes, 'labels': labels});
      });
    }
    else resolve({'boxes': boxes, 'labels': labels});
  });
}

const writeLabel = (name, workNumber, current, boxes, labels) => {
  return new Promise((resolve, reject) => {
    workNumber = parseInt(workNumber);
    let output = '';
    let dest = getLabelDest(name);
    let cur_index_file = 'cases/' + workNumber.toString() + '.txt';
    let content = undefined
    if (Number.isInteger(workNumber))
      content = fs.writeFileSync(cur_index_file, current, { 'encoding' : 'utf8' });
    else
      console.log('Get wrong workNumber/current.');
    for(let i = 0; i < boxes.length; i++) {
      for(let j = 0; j < boxes[i].length; j++) {
        if (boxes[i][j] < 0)
          output += '0,';
        else
          output += boxes[i][j].toString() + ',';
      }
      if (labels[i])
        output += labels[i] + '\n';
      else
        output += 'Empty\n';
    }
    fs.writeFile(dest, output, (err) => {
      if (err) throw err;
      resolve(dest);
    });
  });
}
