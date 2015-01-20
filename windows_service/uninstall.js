var Service = require('node-windows').Service;
var path=require('path');

var app = path.join(path.resolve(__dirname,'..'),'feedreader.js');

// Create a new service object
var svc = new Service({
    name:'Telogis Feedreader',
    description: 'Telogis feedreader service',
    script: app
});

svc.on('uninstall',function(){
    console.log('Uninstall complete.');
    console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();
