var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-espblinds', 'espblinds', espblinds);
    console.log('Loading espblinds accessories...');
};

function espblinds(log, config) {
    this.log = log;

    // Required parameters
    this.get_current_position_url = config.get_current_position_url;
    this.set_target_position_url  = config.set_target_position_url;

    // Optional parameters: HTTP methods
    this.get_current_position_method = config.get_current_position_method || 'GET';
    this.set_target_position_method  = config.set_target_position_method  || 'POST';

    // Optional parameters: expected HTTP response codes
    this.get_current_position_expected_response_code = parseInt(config.get_current_position_expected_response_code) || 200;
    this.set_target_position_expected_response_code  = parseInt(config.set_target_position_expected_response_code)  || 200;

    // Optional parameters: polling times
    this.get_current_position_polling_millis = parseInt(config.get_current_position_polling_millis) || 5000;


    // Internal fields
    this.current_position = undefined;

    this.get_current_position_callbacks = [];
    this.get_target_position_callbacks = [];

    // Initializing things
    this.start_current_position_polling();
    this.init_service();
}

espblinds.prototype.init_service = function() {
    this.service = new Service.WindowCovering(this.name);

    this.service.getCharacteristic(Characteristic.CurrentPosition).on('get', function(callback) {
        this.get_current_position_callbacks.push(callback);
    }.bind(this));

    this.service.getCharacteristic(Characteristic.TargetPosition).on('get', function(callback) {
        this.get_target_position_callbacks.push(callback);
    }.bind(this));
    this.service.getCharacteristic(Characteristic.TargetPosition).on('set', this.set_target_position.bind(this));

};

espblinds.prototype.start_current_position_polling = function() {
    setTimeout(this.update_current_position.bind(this), this.get_current_position_polling_millis);
};

espblinds.prototype.update_current_position = function() {
    request({
        url: this.get_current_position_url,
        method: this.get_current_position_method,
        timeout: 10000
    }, function(error, response, body) {
        if (error) {
            this.log('Error when polling current position.');
            this.log(error);
            this.start_current_position_polling();
            return;
        }
        else if (response.statusCode != this.get_current_position_expected_response_code) {
            this.log('Unexpected HTTP status code when polling current position. Got: ' + response.statusCode + ', expected:' + this.get_current_position_expected_response_code);
            this.start_current_position_polling();
            return;
        }

        var new_position = parseInt(body);

        if (this.get_current_position_callbacks.length > 0) {
            this.get_current_position_callbacks.forEach(function (callback) {
                this.log('calling callback with position: ' + new_position);
                callback(null, new_position);
            }.bind(this));
            this.log('Responded to ' + this.get_current_position_callbacks.length + ' CurrentPosition callbacks!');
            this.get_current_position_callbacks = [];
        }
        else if (new_position !== this.current_position && !this.notify_ios_blinds_has_stopped) {
            this.service.getCharacteristic(Characteristic.CurrentPosition).setValue(new_position);
            this.log('Updated CurrentPosition to value ' + new_position);
        }

        if (this.notify_ios_blinds_has_stopped) {
            this.notify_ios_blinds_has_stopped = false;

            this.log('Updated CurrentPosition and TargetPosition to value ' + new_position);
            this.service.getCharacteristic(Characteristic.CurrentPosition).setValue(new_position);
            this.service.getCharacteristic(Characteristic.TargetPosition).setValue(new_position, null, {
                'plz_do_not_actually_move_the_blinds': true
            });
        }

        this.current_position = new_position;
        this.start_current_position_polling();
    }.bind(this));
};

espblinds.prototype.set_target_position = function(position, callback, context) {
    if (context && context.plz_do_not_actually_move_the_blinds) {
        this.log('set_target_position is ignoring an actual request...');
        callback(null, position);
        return;
    }

    this.log('Setting new target position: ' + position + ' => ' + this.set_target_position_url.replace('%position%', position));
    request({
        url: this.set_target_position_url.replace('%position%', position),
        method: this.set_target_position_method
    }, function(error, response, body) {
        if (error || response.statusCode != this.set_target_position_expected_response_code) {
            this.log('Error when setting new target position: ' + body);
            return;
        }
        this.log('Target position set to ' + position);
        callback(null)
    }.bind(this));
};

espblinds.prototype.getServices = function() {
    return [this.service];
};
