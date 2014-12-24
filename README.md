# Telogis Feedreader

The Telogis feedreader reads the telogis real-time xml feed and inserts the messages in a database of your choosing. It  uses simple custom data transformations to transform the raw messages into almost any format you need. See the config_examples directory for sample configuration and transformations

You can transform the messages and perform other logic in you #configfile

Running the application

	node app.js -c path_to_config

Optionally you can replace sections of the config file by loading config from a json file (see the config.json in the example_config directory)

	node feedreader.js -c ./example_configs/postgres -f ./myconfig.json

additionally you may override specific config settings

	node feedreader.js -c ./example_configs/postgres -s config.feed.password=secret1234

##Config files

Config files are the heart of the feedreader.  They contain the configuration for the feed,  logs and transformations for messages. The example_configs directory has good starting points.

###Transform functions

Transform functions are called transform_<XML NODE NAME>, the feedreader will pass json records to that function to be transformed.

You function should return the table for an insert and a object representing the fields and their values (formatted for the target database).

Example

	exports.transform_Foo=function(aFoo){
			return ['foo',{ bar:Foo.Bar } ]
	}

You can put any code you like in your config file, you may want to cross reference other data.

	exports.transform_Foo=function(aFoo){
			return ['foo',{ bar:Foo.Bar },function(){
				console.log('hey I'm foo with a bar of ' + this.bar ); 
			}]
	}

Depending on the underlying engine what you return will be different. See the examples in example_configs

##Database Drivers

The database driver to use is selected in your config file by having a section match the name of a driver file in the database directory.

> ###postgres
> 
> In the config section a postgres key will enable the postgres driver. 
> See the postgres example for a sample connect string.  The driver uses
> pg 
> 
> ### mongo
> 
> The mongo example simply takes a record and inserts it into the named
> mongo collection.
> 
> ###oracle
> 
> oracle uses the npm oracle module, this can be difficult to install. 
> See [npm oracle](https://www.npmjs.com/package/oracle) for install
> details.
> 
> You will need the instant_client and instant_client_sdk from oracle to
> build this driver.  It is **not** installed by default

