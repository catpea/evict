export default class TerminalColor {
  // ANSI color codes
  static colors = {
    reset: '\x1b[0m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
  };

  // Background colors
  static bgColors = {
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
  };

  // Text styles
  static styles = {
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
  };

  // Helper method to wrap text with color codes
  static wrap(text, code) {
    return `${code}${text}${this.colors.reset}`;
  }

  // Color methods
  static black(text) { return this.wrap(text, this.colors.black); }
  static red(text) { return this.wrap(text, this.colors.red); }
  static green(text) { return this.wrap(text, this.colors.green); }
  static yellow(text) { return this.wrap(text, this.colors.yellow); }
  static blue(text) { return this.wrap(text, this.colors.blue); }
  static magenta(text) { return this.wrap(text, this.colors.magenta); }
  static cyan(text) { return this.wrap(text, this.colors.cyan); }
  static white(text) { return this.wrap(text, this.colors.white); }
  static gray(text) { return this.wrap(text, this.colors.gray); }

  // Bright colors
  static brightRed(text) { return this.wrap(text, this.colors.brightRed); }
  static brightGreen(text) { return this.wrap(text, this.colors.brightGreen); }
  static brightYellow(text) { return this.wrap(text, this.colors.brightYellow); }
  static brightBlue(text) { return this.wrap(text, this.colors.brightBlue); }
  static brightMagenta(text) { return this.wrap(text, this.colors.brightMagenta); }
  static brightCyan(text) { return this.wrap(text, this.colors.brightCyan); }
  static brightWhite(text) { return this.wrap(text, this.colors.brightWhite); }

  // Background colors
  static bgBlack(text) { return this.wrap(text, this.bgColors.bgBlack); }
  static bgRed(text) { return this.wrap(text, this.bgColors.bgRed); }
  static bgGreen(text) { return this.wrap(text, this.bgColors.bgGreen); }
  static bgYellow(text) { return this.wrap(text, this.bgColors.bgYellow); }
  static bgBlue(text) { return this.wrap(text, this.bgColors.bgBlue); }
  static bgMagenta(text) { return this.wrap(text, this.bgColors.bgMagenta); }
  static bgCyan(text) { return this.wrap(text, this.bgColors.bgCyan); }
  static bgWhite(text) { return this.wrap(text, this.bgColors.bgWhite); }

  // Text styles
  static bold(text) { return this.wrap(text, this.styles.bold); }
  static dim(text) { return this.wrap(text, this.styles.dim); }
  static italic(text) { return this.wrap(text, this.styles.italic); }
  static underline(text) { return this.wrap(text, this.styles.underline); }
  static blink(text) { return this.wrap(text, this.styles.blink); }
  static reverse(text) { return this.wrap(text, this.styles.reverse); }
  static hidden(text) { return this.wrap(text, this.styles.hidden); }

  // Combination method
  static combine(text, ...codes) {
    const combined = codes.join('');
    return `${combined}${text}${this.colors.reset}`;
  }
}

export function info(...a){
  console.log(...a.map(a=>TerminalColor.bgBlue(TerminalColor.black(typeof a === 'string'?a:JSON.stringify(a)))));
}
export function success(...a){
  console.log(...a.map(a=>TerminalColor.bgGreen(TerminalColor.black(typeof a === 'string'?a:JSON.stringify(a)))));
}
export function warn(...a){
  console.log(...a.map(a=>TerminalColor.bgYellow(TerminalColor.black(typeof a === 'string'?a:JSON.stringify(a)))));
}
export function danger(...a){
  console.log(...a.map(a=>TerminalColor.bgRed(TerminalColor.white(typeof a === 'string'?a:JSON.stringify(a)))));
}

// // Example usage
// if (require.main === module) {
//   console.log(TerminalColor.blue('Hello world!'));
//   console.log(TerminalColor.red('Error message'));
//   console.log(TerminalColor.green('Success!'));
//   console.log(TerminalColor.yellow('Warning'));
//   console.log(TerminalColor.bold('Bold text'));
//   console.log(TerminalColor.underline('Underlined text'));
//   console.log(TerminalColor.bgRed(TerminalColor.white('White text on red background')));

//   // Combining styles
//   console.log(TerminalColor.combine('Bold and red', TerminalColor.styles.bold, TerminalColor.colors.red));
// }
