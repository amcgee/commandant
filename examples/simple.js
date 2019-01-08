const commandant = require('../');
const { reporter } = require("../");

const translatedGreetings = {
  'en': 'Hello',
  'es': 'Hola',
  'fr': 'Bonjour',
};

const hello = {
  name: "hello [name]",
  alias: "h",
  options: [
    [
      "--language -l <t>",
      "Specify the language",
      "en"
    ]
  ],
  run: ({ args, options } = {}) => {
    const name = args[0] || 'World';
    console.log(args);
    let language = options.language;
    const greet = translatedGreetings[language] || translatedGreetings['en'];

    reporter.print(`${greet} ${name}`);
  },
};
commandant.init({ 
  version: '0.1.0',
  description: 'An example CLI tool',
  commands: [ hello ],
  config: {}
});

commandant.parse(process.argv);