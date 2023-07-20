const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json } = format;

const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },
  colors: {
    trace: "blue",
    debug: "green",
    info: "yellow",
    warn: "orange",
    error: "red",
  },
};

const _winstonLogger = createLogger({
  levels: myCustomLevels.levels,
  level: "trace",
  transports: [
    new transports.File({
      format: combine(timestamp(), json()),
      filename: "parrothublive.log",
    }),
  ],
});

console.log("winston env", process.env.NODE_ENV);
if (process.env.NODE_ENV != "production") {
  _winstonLogger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}

class EntityLogger {
  private _name: string;
  private _type: string;
  private _id: string;
  private _entityWinstonLogger: any;

  constructor(type: string, id: string, name: string) {
    this._id = id;
    this._type = type;
    this._name = name;
    this._entityWinstonLogger = _winstonLogger.child({
      type: this._type,
      id: this._id,
      name: this._name,
    });
  }

  trace(msg: string) {
    this.logMsg("trace", msg);
  }

  debug(msg: string) {
    this.logMsg("debug", msg);
  }

  info(msg: string) {
    this.logMsg("info", msg);
  }

  warn(msg: string) {
    this.logMsg("warn", msg);
  }

  error(msg: string) {
    this.logMsg("error", msg);
  }

  private logMsg(level: string, msg: string) {
    //console.log(level, msg);
    this._entityWinstonLogger.log(level, msg);
  }
}

export { EntityLogger };
