const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json } = format;

const _winstonLogger = createLogger({
  level: "silly",
  transports: [
    new transports.File({
      format: combine(timestamp(), json()),
      filename: "parrothub.log",
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

module.exports = function (metadata: any = { source: "default" }) {
  return _winstonLogger.child(metadata);
};