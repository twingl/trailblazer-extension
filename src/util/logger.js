import _ from 'lodash';

var levels = {
  INFO:  '#78909C',
  DEBUG: '#00BFA5',
  WARN:  '#FF8F00',
  ERROR: '#D50000'
};

export default function Logger(filename) {

  // Prefix console.log with a colour tag for each log level
  return _.transform(levels, function(result, color, level) {
    if (process.env.LOGGING_ENABLED === 'true') {
      result[level.toLowerCase()] =
        console.log.bind(console, `%c ${level} `, `color: white; background: ${color}`);
    } else {
      result[level.toLowerCase()] = () => {};
    }
  });
}
