var nodemailer = require('nodemailer');
const  hbs = require('nodemailer-express-handlebars');
const path = require("path");

// Mail Configuration
var smtpTransport = nodemailer.createTransport({
  service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
  auth: {
    user: process.env.MAILER_EMAIL_ID,
    pass: process.env.MAILER_PASSWORD
  }
});
var handlebarsOptions = {
  viewEngine: {
    extName: ".hbs",
    partialsDir: path.resolve(__dirname, "../templates"),
    defaultLayout: false
  },
  viewPath: path.resolve(__dirname, "../templates"),
  extName: ".html"
};
smtpTransport.use('compile', hbs(handlebarsOptions));

module.exports.sendMail = function (mailOptions) { 
    smtpTransport.sendMail(mailOptions, function(error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });    
};