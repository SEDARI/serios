##Content Overview
- [User Management](#usermanagement)
  - [User](#user)
- [Gateway Management](#gatewaymanagement)
  - [Gateway](#gateway)
- [Service Object Management](#serviceobjectmanagement)
  - [Service Object](#serviceobject)
  - [Sensor Stream](#sensorstream)
  - [Sensor Channel](#sensorchannel)
- [Sensor Data Management](#sensordatamanagement)
  - [Sensor Data](#sensordata)
  - [Channel Data](#channeldata)

##User Management
###User
####Attributes
* `OwnerID`: The identifier of the user.
* `E-Mail`: The e-mail address of the user.
* `Password`: The password of the user.
* `API-Token`: The API-Token of the user.

####Database Schema for [MongoDB](http://mongoosejs.com/docs/guide.html)
| Attribute        | Datatype   |
| ---------------- |-----------:|
| UserID           | String     |
| E-Mail           | String     |
| Password         | String     |
| API-Token        | String     |

Add `timestamps` option as shown in the [documentation](http://mongoosejs.com/docs/guide.html#timestamps).

##Gateway Management
###Gateway
####Attributes
* `OwnerID`: The user that owns the gateway.
* `GatewayID`: The identifier of the gateway
* `Gateway-Token`: The token of the gateway.
* `Hostname`: The address of the gateway. Could be a IP-address or a URI.
* `Port`: The port to connect to the gateway.
* `Protocol`: The protocol used by the gateway.

####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| OwnerID          | String     |
| GatewayID        | String     |
| Gateway-Token    | String     |
| Hostname         | String     |
| Port             | Number     |
| Protocol         | String     |


## Service Object Management

###ServiceObject
####Attributes
* `GatewayID`: The Gateway this Service Object is registered at.
* `soID`: The identifier of the Service Object generated and returned by the service.
* `name`: The name of the Service Object.
* `streams`: Collection of associated [Sensor Streams](#sensorstream).
* `description`: Optional description of the Service Object.

####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| GatewayID        | String     |
| soID             | String     |
| name             | String     |
| streams          | Array [ ]  |
| description      | String     |
To use arrays as datatype use [sub-documents](http://mongoosejs.com/docs/subdocs.html).

Add `timestamps` option as shown in the [documentation](http://mongoosejs.com/docs/guide.html#timestamps).

<!---
#####SQL
| Attribute        | Datatype | Constraints |
| ---------------- |:--------:|------------:|
| soID             | VARCHAR  | PRIMARY KEY |
| name             | VARCHAR  | NOT NULL    |
| description      | VARCHAR  |             |
-->


###SensorStream
####Attributes
* `streamID`: The identifier of the Sensor Stream.
* `sensorName`: name of the appropriate sensor.
* `description`: Optional description of the Sensor Stream.
* `channels`: Collection of Sensor Channels associated to the Sensor Stream.

####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| streamID         | String     |
| sensorName       | String     |
| description      | String     |
| channels         | Array [ ]  |

To use arrays as datatype use [sub-documents](http://mongoosejs.com/docs/subdocs.html).


<!---
#####SQL
| Attribute        | Datatype | Constraints |
| ---------------- |:--------:|------------:|
| streamID         | VARCHAR  | PRIMARY KEY |
| soID             | VARCHAR  | REFERENCES ServiceObject.soID |
| sensorName       | VARCHAR  |             |
| description      | VARCHAR  |             |
-->

###SensorChannel
####Attributes
* `name`: The Name of the Sensor Channel.
* `dataType`: Data type associated to the channel. One of:
    - number
    - string
    - boolean
    - geo_location (latitude, longitude)
* `unit`: the unit of the data.

####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| name             | String     |
| dataType         | String     |
| unit             | String     |
To validate that dataType is one of number, string, boolean, geo_location use the [mongoose enum validator](http://mongoosejs.com/docs/api.html#schema_string_SchemaString-enum).
```javascript
var s = new mongoose.Schema({
...,
    datatype: {
        type: String,
        enum: ['number', 'string', 'boolean', 'geo_location']
    },
...
})
```

<!---
#####SQL
| Attribute        | Datatype | Constraints |
| ---------------- |:--------:|------------:|
| streamID         | VARCHAR  | PRIMARY KEY |
| soID             | VARCHAR  | REFERENCES ServiceObject(soID) |
| sensorName       | VARCHAR  |             |
| description      | VARCHAR  |             |
-->

##Sensor Data Management

###SensorData
####Attributes
* `channels`: collection of Data Channels.
* `lastUpdate`: a timestamp on the last time the service object was updated
####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| channels         | Array [ ]  |
| lastUpdate       | Date       |

To use arrays as datatype use [sub-documents](http://mongoosejs.com/docs/subdocs.html).

Add `timestamps` option as shown in the [documentation](http://mongoosejs.com/docs/guide.html#timestamps).

###ChannelData
The user doesn't need to specify the unit, because it's already defined in the appropriate SensorChannel.

####Attributes
* `name`: The name of the channel (e.g. ’temperature’)
* `value`: The actual data (e.g. ’21.42’)

####Database Schema
| Attribute        | Datatype   |
| ---------------- |-----------:|
| name             | String     |
| value            | String     |

To use arrays as datatype use [sub-documents](http://mongoosejs.com/docs/subdocs.html).

