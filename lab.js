#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = __dirname;
const cppFlags = ['-std=c++17', '-Wall', '-Wextra', '-pedantic'];

class Cli {
  constructor(rootDir, argv, env = process.env, entryFile = process.argv[1]) {
    this.rootDir = rootDir;
    this.argv = argv;
    this.env = env;
    this.entryFile = entryFile;
  }

  parse() {
    const target = { action: null, problem: null, language: null };

    for (const arg of this.argv) {
      if (arg === 'run' || arg === '--run') target.action = 'run';
      else if (arg === 'test' || arg === '--test') target.action = 'test';
      else if (arg === '--js' || arg === 'js') target.language = 'js';
      else if (this.isCppArg(arg)) target.language = 'cpp';
      else if (arg.includes('/') || arg.includes('\\')) Object.assign(target, this.pathTarget(arg));
      else if (/^\d+$/.test(arg)) target.problem = arg;
      else this.fail(`Invalid argument: ${arg}`);
    }

    this.validate(target);

    return {
      ...target,
      dir: path.join(this.rootDir, 'beecrowd', target.problem, target.language),
    };
  }

  validate(target) {
    if (!target.action) this.fail('Missing action. Use run or test.');
    if (!target.problem) this.fail('Missing problem number.');
    if (!/^\d+$/.test(target.problem)) this.fail(`Invalid problem number: ${target.problem}`);

    target.language ||= this.defaultLanguage(target.problem, target.action);

    if (!['js', 'cpp'].includes(target.language)) {
      this.fail(`Invalid language: ${target.language}`);
    }
  }

  pathTarget(target) {
    const parts = target
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .replace(/^beecrowd\//, '')
      .split('/')
      .filter(Boolean);

    if (parts.length !== 2) this.fail(`Invalid target: ${target}`);

    return { problem: parts[0], language: parts[1] };
  }

  defaultLanguage(problem, action) {
    const fileNames = {
      js: action === 'test' ? 'solution.test.js' : 'solution.js',
      cpp: action === 'test' ? 'solution.test.cpp' : 'solution.cpp',
    };

    for (const language of ['js', 'cpp']) {
      const filePath = path.join(this.rootDir, 'beecrowd', problem, language, fileNames[language]);
      if (fs.existsSync(filePath)) return language;
    }

    this.fail(`No ${action} target found for problem ${problem}.`, false);
  }

  usageLines() {
    const npmScript = this.env.npm_lifecycle_event || '';

    if (/^(lab|cpp):(run|test)$/.test(npmScript)) {
      return [`npm run ${npmScript} 1001`];
    }

    if (npmScript === 'lab' || npmScript === 'cpp') {
      return [
        `npm run ${npmScript} -- 1001 --run`,
        `npm run ${npmScript} -- 1001 --test`,
      ];
    }

    const command = path.basename(this.entryFile || 'lab.js');
    const languageFlag = this.argv.some((arg) => this.isCppArg(arg)) ? ' --cpp' : '';

    return [
      `node ${command} 1001 --run${languageFlag}`,
      `node ${command} 1001 --test${languageFlag}`,
    ];
  }

  usage() {
    console.error(`Comando correto:
  ${this.usageLines().join('\n  ')}
`);
  }

  fail(message, showUsage = true) {
    console.error(message);

    if (showUsage) {
      console.error('');
      this.usage();
    }

    process.exit(1);
  }

  isCppArg(arg) {
    return ['--cpp', '--c++', 'cpp', 'c++'].includes(arg);
  }
}

class LabRunner {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  run(target) {
    const actions = {
      'js:run': () => this.runJs(target),
      'js:test': () => this.testJs(target),
      'cpp:run': () => this.runCpp(target),
      'cpp:test': () => this.testCpp(target),
    };

    actions[`${target.language}:${target.action}`]();
  }

  runJs(target) {
    const solutionPath = path.join(target.dir, 'solution.js');
    this.ensureFile(solutionPath);

    this.runProcess(process.execPath, [solutionPath], {
      input: this.inputText(target.problem),
    });
  }

  testJs(target) {
    this.assertNodeAvailable();

    const testPath = path.join(target.dir, 'solution.test.js');
    this.ensureFile(testPath);
    this.runProcess(process.execPath, [this.mochaPath(), testPath]);
  }

  runCpp(target) {
    const solutionPath = path.join(target.dir, 'solution.cpp');
    const outputPath = this.buildPath(target.problem, 'solution');
    this.ensureFile(solutionPath);

    this.compileCpp(solutionPath, outputPath);
    this.runProcess(outputPath, [], { input: this.inputText(target.problem) });
  }

  testCpp(target) {
    const testPath = path.join(target.dir, 'solution.test.cpp');
    const outputPath = this.buildPath(target.problem, 'test');
    this.ensureFile(testPath);

    this.compileCpp(testPath, outputPath);
    this.runProcess(outputPath, [], {
      successMessage: `OK: C++ tests passed for ${path.relative(this.rootDir, testPath)}`,
    });
  }

  inputText(problem) {
    const inputPath = path.join(this.rootDir, 'beecrowd', problem, 'input.txt');
    this.ensureFile(inputPath);

    return fs.readFileSync(inputPath);
  }

  mochaPath() {
    try {
      return require.resolve('mocha/bin/mocha.js');
    } catch (error) {
      this.fail('Mocha not found. Run npm install first.');
    }
  }

  compileCpp(source, output) {
    this.assertGppAvailable();
    fs.mkdirSync(path.join(this.rootDir, '.build'), { recursive: true });

    const result = spawnSync('g++', [source, ...cppFlags, '-o', output], {
      cwd: this.rootDir,
      stdio: 'inherit',
    });

    if (result.status !== 0) process.exit(result.status || 1);
  }

  buildPath(problem, kind) {
    const extension = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.rootDir, '.build', `${problem}-${kind}${extension}`);
  }

  assertNodeAvailable() {
    const major = Number(process.versions.node.split('.')[0]);
    if (major < 18) this.fail(`Node 18 or newer is required. Current version: ${process.version}`);
  }

  assertGppAvailable() {
    const result = spawnSync('g++', ['--version'], { stdio: 'ignore' });
    if (result.error) this.fail('g++ not found in PATH.');
  }

  ensureFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.fail(`File not found: ${path.relative(this.rootDir, filePath)}`);
    }
  }

  runProcess(commandName, args, options = {}) {
    const result = spawnSync(commandName, args, {
      cwd: this.rootDir,
      stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
      input: options.input,
    });

    if (result.error) this.fail(result.error.message);

    const status = result.status ?? 1;

    if (status === 0 && options.successMessage) console.log(options.successMessage);

    process.exit(status);
  }

  fail(message) {
    console.error(message);
    process.exit(1);
  }
}

const cli = new Cli(rootDir, process.argv.slice(2));
const target = cli.parse();

new LabRunner(rootDir).run(target);
