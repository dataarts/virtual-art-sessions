import DEBUG from './debug';

const methods = ['log', 'error', 'debug', 'info', 'warn'];
const noop = function() {};

function log(type) {
  if (!DEBUG || !console[type]) {
    return noop;
  }

  return Function.prototype.bind.call(console[type], console);
}

module.exports = (function() {
  const logger = {};
  methods.forEach(method => {
    logger[method] = log(method);
  });
  return logger;
})();
