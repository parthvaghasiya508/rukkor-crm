const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config();
const logger = require('morgan');
const routes = require('./routes');
const https = require('https');
const fs = require('fs');

app.use((req, res, next) => {
  // console.log('Request Type:', req.method);
  // console.log('Request URL:', req.originalUrl)
  // console.log('Time:', Date.now());
  next();
});

app.use(logger('dev'));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const PORT =  process.env.PORT || 4000;

mongoose.Promise = global.Promise;
// console.log("process.env.MONGO_CONN_URL",process.env.MONGO_CONN_URL);
mongoose.connect(process.env.MONGO_CONN_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false, useCreateIndex:true }).then(
  () => {console.log('Database is connected') },
  err => { console.log('Can not connect to the database'+ err)}
);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Use Routes
app.use('/', routes);

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
var server = https.createServer(options, app);
server.listen(PORT, () => {
    console.log('Server is running on Port:',PORT);
});
/*app.listen(PORT, function(){
  console.log('Server is running on Port:',PORT);
});*/

// Current TimeZone
var timeZone = moment.tz.guess();
var time = new Date();
var timeZoneOffset = time.getTimezoneOffset();
console.log("Current Time Zone:",timeZone," | Current DateTime:",time, " | timeZoneOffset:",timeZoneOffset, " | moment.tz.zone(timeZone).abbr(timeZoneOffset):",moment.tz.zone(timeZone).abbr(timeZoneOffset));