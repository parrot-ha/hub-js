const { NodeVM } = require("vm2");
const fs = require("fs");

export function runDeviceMethod(
  id: string,
  methodName: string,
  args: (string | number)[]
) {
  const data = fs.readFileSync("deviceHandlers/NodeMcu.js");

  const vm = new NodeVM({
    require: {
      external: true,
    },
    sandbox: {
      log: {
        debug(msg: any) {
          console.log("DEBUG", msg);
        },
      },
      settings: {
        ip: "192.168.1.52",
      },
    },
  });

  const userCode = vm.run(
    data.toString() + `\nmodule.exports = { ${methodName} }`,
    "vm.js"
  );
  const method = userCode[methodName];
  if (typeof method !== "function") {
    console.log("NOT A METHOD");
    return;
  }
  if (args != null) {
    method(args);
  } else {
    method();
  }
}
