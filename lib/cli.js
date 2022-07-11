#!/usr/bin/env node
const { Command } = require('commander');
const { initContext, build, watch } = require('./index');

if (require.main === module) {
  main(process.argv).then(console.info).catch(console.error);
}

async function main(args) {
  const program = new Command();

  program
    .option('-c, --config-file <string>', 'path to config file');

  program
    .command('build')
    .action(async () => build(await initContext(program.opts())));

  program
    .command('watch')
    .action(async () => watch(await initContext(program.opts())));

  await program.parseAsync(args);
}
