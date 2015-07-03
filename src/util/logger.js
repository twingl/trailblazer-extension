import _ from 'lodash';

export default class Logger {

  constructor(filename) {
    this.filename = filename;

    this.levels = {
      INFO:  '#78909C',
      DEBUG: '#00BFA5',
      WARN:  '#FF8F00',
      ERROR: '#D50000'
    }

    // Create a logging function for each level.
    // Signature is <downcase(LEVEL)>([colouredMessage], additionalArgs);
    //
    // e.g.
    // INFO -> loggerInstance.info(message, otherStuff);
    _.each(this.levels, (color, level) => {
      this[level] = level;

      if (process.env.LOGGING_ENABLED === 'true') {
        this[level.toLowerCase()] = (message, ...additional) => {
          this.log(message, this[level], ...additional);
        };
      } else {
        // This is a noop if we don't have logging enabled
        this[level.toLowerCase()] = () => {};
      }
    });
  }

  // Common wrapper for the console.log call
  // If the first arg is a string, it will be coloured. Otherwise it will be
  // printed at the whim of console.log
  log(message, level, ...additional) {
    if (typeof message === "string") {
      console.log(`%c ${level} %c ${message}`, `color: white; background: ${this.levels[level]}`, `color: ${this.levels[level]}; font-weight: bold`, ...additional, `from ${this.filename}`);
    } else {
      console.log(`%c ${level} `, `color: white; background: ${this.levels[level]}`, message, ...additional, `from ${this.filename}`);
    }
  }
}
