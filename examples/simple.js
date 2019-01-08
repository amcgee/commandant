#!/usr/bin/env node

const commandant = require('../');
const { reporter } = require("../");

const translations = {
  'Hello': {
    'en': 'Hello',
    'es': 'Hola',
    'fr': 'Bonjour',
  },
  'world': {
    'en': 'world',
    'es': 'el mundo',
    'fr': 'le monde',
  },
  'people': {
    'en': 'people',
    'es': 'gente',
    'fr': 'gens'
  }
};

const translate = (word, language) => {
  if (translations[word] && translations[word][language]) {
    return translations[word][language];
  }
  return word;
}

const hello = {
  name: "hello [name]",
  alias: "h",
  options: [
    [
      "--language <t>",
      "Specify the language",
      "en"
    ]
  ],
  run: ({ args, options } = {}) => {
    const greet = translate("Hello", options.language);
    const name = translate(args[0] || 'world', options.language);

    reporter.print(`${greet}, ${name}!`);
  },
};

commandant.init({ 
  version: '0.1.0',
  description: 'An example CLI tool',
  commands: [ hello ],
  config: {}
});

commandant.parse(process.argv);