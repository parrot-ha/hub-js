const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, json } = format;

var transport = new DailyRotateFile({
  level: 'info',
  filename: 'parrothub-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  createSymlink: true,
  symlinkName: 'parrothub.log',
  tailable: true,
});

transport.on('error', (error: Error) => {
  // log or handle errors here
  console.log(error.message);
});

const _winstonLogger = createLogger({
  level: "silly",
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    transport
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

// alternate export - this may be the right way to export?  Requires
// updates to all the usages in the platform
//export default function (metadata: any = { source: "default" }) {
  // return _winstonLogger.child(metadata);
// };
