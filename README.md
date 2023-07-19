# hub-js
Smart home hub that implements the same api as SmartThings but written in Typescript/Javascript.

This is currently a POC and you can expect multiple breaking changes as it matures.

Requirements:
NodeJS (currently being developed on nodejs v18)

Running:
1. clone repository.
2. run ```npm install```
3. run ```npm run start```

The ui is currently available in the hub-js-temp-ui repo.  As the name implies, this is a temporary ui for now and the ui will eventually be integrated into this repository.

The current goals for this project (not necessarily is this order):
1. get the rest of the ui functional (eliminate any 404 errors)
2. get a running base for devices and automations.
3. add mobile first ui.
4. create an extension framework.
5. add Lan, zigbee and zwave extensions

