# hub-js
Smart home hub that implements the same api as SmartThings but written in Typescript/Javascript.

This is currently a POC and you can expect multiple breaking changes as it matures.

Requirements:
NodeJS (currently being developed on nodejs v24)

Running:
1. clone repository.
2. run ```npm install```
3. run ```npm run start```


The ui has been integrated into this repo.  It is still a work in progress.

The ui will be available on port 6501

Below are some docs imported from the README that was auto generated during ui setup:

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

The current goals for this project (not necessarily is this order):
1. get the rest of the ui functional (eliminate any 404 errors)
2. get a running base for devices and automations.
3. add mobile first ui.
4. create an extension framework.
5. add Lan, zigbee and zwave extensions

