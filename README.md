# OWFS2MQTT Gateway

This is a simple gateway to translate an OWFS directory structure to MQTT.

The program provides web-management of configuration on port 8087 (can be changed in 'web.js')


## Requirements

- OWFS installed (owserver & owhttpd) - check that the owfs data directory (on Raspberry Pi: '/mnt/1wire') exists and show data from the connected owfs devices.
- Node.js installed
- forever installed (run: 'npm install -g forever')

## Installation

- Copy the folder owfs2mqtt to your server directory ('/server')
- Copy 'server/owfs2mqtt/data/owfs2mqtt' to '/etc/init.d'
- give execute rigthts (755) to '/etc/init.d/owfs2mqtt'
- register for start on boot: 'update-rc-d owfs2mqtt defaults'
- Run program: 'service owfs2start start'


## Configuration

- Find the IP address of the device running owfs2mqqt (ex: 192.168.1.39)
- in a browser get the page at http://192.168.1.39:8087 - or whatever IP-addres and Port you are using

### Configure MQTT Broker:

- Enter the Url for the MQTT Broker (mqtt://localhost if broker and mowfs2mqtt is running on the same device)
- Enter the Port for the MQTT Broker (usually 1883)
- Press 'Update'

### Configure Onewire directory

- Enter the dirictory for owfs data (usually '/mnt/1wire')
- Press 'Update'

### Map owfs data to MQTT topic value

- Select the onewire device and the field in the 'Onewire devices' list
- Enter the Topuc value
- Enter a deskciption
- Select sensor for sensor devices (ex. temperature device) or 'switch' for switch device (ex. PIO)
- Press 'Add'

The new registration should now apear in the list above the input line.

If you press 'Edit' on the line of a registered device, data will be copied to the input line for changes. Press 'Add' when changes are made.
