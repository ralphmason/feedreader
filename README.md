# Telogis Feedreader

Feedreader is an application reads the Telogis real-time xml feed and inserts the messages in a database of your choosing. It  uses simple custom data transformations to transform the raw messages into almost any format you need. See the config_examples directory for sample configuration and transformations

You transform XML messages and perform other logic in you #configfile

Running the application

	node app.js -c path_to_config

Optionally you can replace sections of the config file by loading config from a json file (see the config.json in the example_config directory)

	node feedreader.js -c ./example_configs/postgres -f ./myconfig.json

additionally you may override specific config settings

	node feedreader.js -c ./example_configs/postgres -s config.feed.password=secret1234

##Config files

Config files are the heart of the feedreader.  They contain the configuration for the feed,  logs and transformations for messages. The example_configs directory has good starting points.

###Transform functions

Transform functions are called transform_&lt;XML NODE NAME&gt;, the feedreader will pass json records to that function to be transformed.

You function should return the table for an insert and a object representing the fields and their values (formatted for the target database).

Example
<code>exports.transform_Foo=function(aFoo){
			return ['foo',{ bar:Foo.Bar } ]
	}
</code>

##Logging
Logging uses winston for logging, each key in the logging section is treated as a winston transport class, the value of the key is passed directly to the transport

See https://github.com/flatiron/winston

You can support multiple transports of the same type by passing an array to of the type

example

<code>
File:[ { filename:'file1.log'} , { filename:'file2.log' } ]
</code>



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
> You have two choices with oracle the simple one - use the sqlplus client or install and build the oracle npm package.
>> ####sqlplus
>>To use sqlplus put a sqlplus key in your oracle config with the path to your sqlplus executable eg sqlplus:'/bin/sqlplus'
>
>> ####oracle drivers
>>
>> oracle is more complicated to get running, you need to download drivers / client from the oracle website.
>>
>> The easiest path is to use the sqlplus client with can be configured via the sqlplus c
>> oracle uses the npm oracle module, there are many dependencies for this module.
>> See [npm oracle](https://www.npmjs.com/package/oracle) for install
>> details.
>
>> You will need the instant_client and instant_client_sdk from oracle to build this driver.  It is **not** installed by default
>
> ### new engines
>
> If you implement a new database engine and are happy to share please do so!
>
> ## Putting it all together
![enter image description here](https://www.lucidchart.com/publicSegments/view/54aff4e5-81cc-45f4-850d-31dc0a00851b/image.png)

