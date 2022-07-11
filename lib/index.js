const fsp = require('fs/promises');
const path = require('path');
const ejs = require('ejs');
const MarkdownIt = require('markdown-it');
const frontMatter = require('front-matter');

const DEF_CONFIG_FILE = './config.js';
const DEF_CONFIG = {
  baseDir: '.', // absolute or relative to config file
  srcDir: 'src', // absolute or relative to baseDir
  outDir: 'out', // absolute or relative to baseDir
  assetDir: 'asset', // absolute or relative to srcDir
  pageDir: 'page', // absolute or relative to srcDir
  layoutDir: 'layout', // absolute or relative to srcDir
  site: {
    url: 'https://day1co.github.io',
    title: 'DAY1 COMPANY Tech Blog',
    description: 'Development for Life Changing Education',
    image: '/favicon.png',
  },
};

function log(...args) {
  console.log(...args);
}

async function mkdirp(dir) {
  try {
    return await fsp.mkdir(dir, { recursive: true });
  } catch(e) {
    console.error(e);
  }
}

async function initContext(opts) {
  const configFile = path.resolve(process.cwd(), opts.configFile ?? DEF_CONFIG_FILE);
  const config = await loadConfig(configFile);

  const baseDir = path.resolve(path.dirname(configFile), config.baseDir);
  const srcDir = path.resolve(baseDir, config.srcDir);
  const outDir = path.resolve(baseDir, config.outDir);
  const assetDir = path.resolve(srcDir, config.assetDir);
  const pageDir = path.resolve(srcDir, config.pageDir);
  const layoutDir = path.resolve(srcDir, config.layoutDir);

  return { ...config, srcDir, outDir, assetDir, pageDir, layoutDir };
}

async function loadConfig(configFile) {
  log(`loadConfig: ${configFile}`);
  try {
    return { ...DEF_CONFIG, ...require(configFile) };
  } catch(e) {
    return DEF_CONFIG;
  }
}

async function build(context) {
  const { srcDir, outDir, assetDir, pageDir } = context;

  log(`build: ${srcDir} -> ${outDir}`);

  await cleanOutput(outDir);
  await copyAssets(assetDir, outDir);
  await renderPages(pageDir, outDir, context);
}

async function watch(context) {
  const { srcDir } = context;

  log(`watch: ${srcDir}`);
  const watcher = await fsp.watch(srcDir, { recursive: true });
  for await (const event of watcher) {
    log('\twatch: ', event);
    // TODO: process the modified file only
    await build(context);
  }
}

async function cleanOutput(outDir) {
  log(`clean out: ${outDir}`);
  //await fsp.rm(outDir, { recursive: true });
  mkdirp(outDir);
}

async function copyAssets(assetDir, outDir) {
  log(`copy assets: ${assetDir} -> ${outDir}`);
  await fsp.cp(assetDir, outDir, { recursive: true });
}

async function renderPages(pageDir, outDir, context) {
  log(`renderPages: ${pageDir} -> ${outDir}`);
  const pageFiles = await collectFiles(pageDir);
  context.posts = [];
  context.pages = [];
  for (const pageFile of pageFiles) {
    const page = await renderPage(pageFile);
    context.pages.push(page);
    if (page.layout === 'post') {
      console.log('post found: ', pageFile);
      context.posts.push(page);
    }
    page.file = pageFile;
    const { dir, name, ext } = path.parse(pageFile);
    page.outDir = path.join(outDir, dir.substring(pageDir.length));
    page.outFile = path.format({
      dir: page.outDir,
      name,
      ext: '.html'
    });
    if (!page.url) {
      const pageUrlPath = path.relative(outDir, (name === 'index') ? page.outDir : page.outFile);
      page.url = `${context.site.url}/${pageUrlPath}`;
    }
    if (!page.layout) {
      page.layout = 'page';
    }
  }
  for (const page of context.pages) {
    log(`${page.file} + ${page.layout} -> ${page.outFile}`);

    const html = await ejs.renderFile(path.join(context.layoutDir, 'default.ejs'), { ...context, page });

    await mkdirp(page.outDir);
    await fsp.writeFile(page.outFile, html, 'utf8');
  }
}

async function renderPage(pageFile) {
  const ext = path.extname(pageFile);
  log(`renderPage: ${pageFile}`);
  const content = await fsp.readFile(pageFile, 'utf8');
  switch (ext) {
    case '.ejs':
    case '.html':
    case '.htm':
      return renderEjsPage(content);
    case '.md':
    case '.markdown':
      return renderMarkdownPage(content);
  }
  return {};
}

async function renderEjsPage(content) {
  return { main: ejs.render(content) };
}

async function renderMarkdownPage(content) {
  const { body, attributes } = frontMatter(content);
  const md = new MarkdownIt();
  return { ...attributes, main: md.render(body) };
}

async function collectFiles(parent) {
  const result = [];
  const dir = await fsp.opendir(parent);
  for await (const dirent of dir) {
    const child = path.join(parent, dirent.name);
    if (dirent.isDirectory()) {
      result.push(...await collectFiles(child));
    } else {
      result.push(child);
    }
  }
  return result;
}

module.exports = { initContext, build, watch };
