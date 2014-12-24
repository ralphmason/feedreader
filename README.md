# Telogis Feedreader

The feeedreader applicationr reads the telogis realtime feed and inserts the messages in a database of your choosing.

You can transform the messages and perform other logic in you #configfile

Running the application

node app.js -c path_to_config


Transform functions

Transform functions are called transform_<XML NODE NAME>, the feedreader will pass json records to that function to be transformed.

You function should return the table for an insert and a object representing the fields and their values (formatted for the target database).

Depending on the underlying engine what you return may be different.


