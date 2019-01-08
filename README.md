# commandant
Simple definitions of modern, advanced command-line programs with Node.js

## Installation

```sh
> yarn add https://github.com/amcgee/commandant.git
OR
> npm install https://github.com/amcgee/commandant.git
```

## Usage

Basic HelloWorld example.  See [examples](./examples) for more.

```js
#!/usr/bin/env node

const commandant = require('../src');
const { reporter } = require("../src");

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
```

Yeilds:

```sh
> ./examples/simple.js
>>>   simple v0.1.0   <<<
Usage: simple [options] [command]

An example CLI tool

Options:
  --verbose                 Log all the things
  --quiet                   Only print essential output
  --rcfile <file>           Specify a custom JSON config file
  --config <assignment>     Explicitly set a config value (i.e. cache=./d2cache)
  -v, --version             output the version number
  -h, --help                output usage information

Commands:
  hello|h [options] [name]
> ./examples/simple.js hello --quiet
Hello, world!
> ./examples/simple.js hello --language fr people
>>>   simple v0.1.0   <<<
Bonjour, gens!
```
