var Service = require('node-windows').Service;
var path=require('path');

var app = path.join(path.resolve(__dirname,'..'),'feedreader.js');

// Create a new service object
var svc = new Service({
    name:'Telogis Feedreader',
    description: 'Telogis feedreader service',
    script: app
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    svc.start();
});

svc.install();