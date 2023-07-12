class Logger {
  static trace(msg: string) {
    this.logMsg("trace", msg);
  }

  static debug(msg: string) {
    this.logMsg("debug", msg);
  }

  static info(msg: string) {
    this.logMsg("info", msg);
  }

  static warn(msg: string) {
    this.logMsg("warn", msg);
  }

  static error(msg: string) {
    this.logMsg("error", msg);
  }

  private static logMsg(level: string, msg: string) {
    console.log(level, msg);
  }
}

export { Logger }