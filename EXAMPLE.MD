# Example implementation with ardiuno

## 1] Architecture (Assumes the following)

- Homebridge server is : `192.168.1.199`
- Arduino with C++, controlling the blinds : `192.168.1.200`

## 2] Homebridge plugin installation

````bash
sudo npm install -g homebridge-mysmartblinds
````

## 3] Homebridge accessory configuration

Here is a homebridge `config.json` with the minimal valid configuration. The bridge information is already there unless you have not set up homebridge yet. You must add an accessory for each blind, and create a name for each blind, and change the ip address to wherever you are running the esp32.

````json
{
    "bridge": {
        "name": "espblinds",
        "username": "AA:BB:CC:DD:EE:FF",
        "port": 51826,
        "pin": "089-82-264"
    },
  
    "description": "Open & Close your analog blinds/windows",
  
"accessories": [
    {
        "accessory": "espblinds",
        "name": "blinds",
  
            "get_current_position_url": "http://192.168.1.200:80/statusblinds",
            "set_target_position_url": "http://192.168.1.200:80/blinds%position%",
            },
        {
            "accessory": "espblinds",
        "name": "window",
  
            "get_current_position_url": "http://192.168.1.200:80/statuswindow",
            "set_target_position_url": "http://192.168.1.200:80/window%position%",
}

], 
    "platforms": []
}
````

Beware, these two parameters are not checked!  
(`get_current_position_url`, `set_target_position_url`)  
If you forgot to write them in your accessory, the module will crash.

The `set_target_position_url` parameter, the placeholder `%position%` will be replaced by the value selected in the iPhone's Home App. 

# That's all
