const fs = require('fs');
const path = require('path');
const request = require("request");
const tar = require('tar');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const colors = require('colors');
const config = require('./ConfigLoader').config;
const reporter = require('./reporter');

const asyncRimraf = (dir) => {
  return new Promise((resolve, reject) => {
    rimraf(dir, err => {
      if (err) return reject(err)
      resolve(true);
    });
  });
}
const asyncExists = (p) => {
  return new Promise(resolve => {
    fs.exists(p, exists => {
      resolve(exists);
    });
  });
}

const renameAsync = (a, b) => {
  return new Promise((resolve, reject) => {
    fs.rename(a, b, err => {
      if (err) return reject(err)
      resolve(true);
    });
  });
}
const readdirAsync = path => 
  new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) return reject(err);
      resolve(files)
    });
  });

const statAsync = path =>
  new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) return reject(err);
      resolve(stats);
    });
  });

const fetchAndExtract = async ({ url, name, tmpLoc, outLoc, raw}) => {
  const p = new Promise(async (resolve, reject) => {
    const stream = request
      .get(url)
      .on("error", e => {
        reporter.dumpErr(e);
        reporter.error(`[CACHE] Failed to fetch ${name} from ${url}`);
        reject();
      })
      .on("warn", reporter.warn);

    if (!raw && (url.substr(-7) === ".tar.gz" || url.substr(-4) === ".tar")) {
      reporter.debug(`[CACHE] Fetching and extracting ${colors.bold(name)}`);
      reporter.debug(`[CACHE]   from ${colors.bold(url)}`);
      reporter.debug(`[CACHE]   to ${colors.bold(outLoc)}`);
      reporter.debug(`[CACHE]   tmpLoc ${colors.bold(tmpLoc)}`);
      await mkdirp(tmpLoc);
      stream
        .pipe(
          tar.extract({
            strip: 1,
            cwd: tmpLoc,
          })
        )
        .on('end', async () => {
          try {
            await renameAsync(tmpLoc, outLoc);
            resolve(outLoc);
          } catch (e) {
            reject(`Failed to rename ${colors.bold(tmpLoc)} to ${colors.bold(outLoc)}`);
          }
        })
    } else {
      reporter.debug(`[CACHE] Fetching ${colors.bold(name)}`)
      reporter.debug(`[CACHE]   from ${colors.bold(url)}`);
      reporter.debug(`[CACHE]   to ${colors.bold(outLoc)}`);
      stream
        .pipe(fs.createWriteStream(outLoc))
        .on("end", () => resolve(outLoc));
    }
  });

  return p;
}

class D2Cache {
  async exists(pathname) {
    return await asyncExists(this.getCacheLocation(pathname));
  }

  get baseDir() {
    return path.join(config.cache, 'cache');
  }
  get tmpDir() {
    return path.join(this.baseDir, '.tmp');
  }

  getCacheLocation(pathname) {
    const loc = path.join(this.baseDir, pathname);
    if (loc.indexOf(this.baseDir) !== 0) {
      throw new Error("Cache items must be within the cache directory, relative paths are not allowed.");
    }
    return loc;
  }

  async makeTmp() {
    await mkdirp(this.tmpDir);
    return path.join(this.tmpDir, `/${Math.ceil(Math.random() * 100000)}`);
  }

  async get(url, name, { force, raw } = {}) {
    const parentDir = '/';
    const outLoc = this.getCacheLocation(`${parentDir}/${name}`);
    const tmpLoc = await this.makeTmp();

    if (force) {
      reporter.debug(`[CACHE] Forcing re-fetch of ${name}, ${outLoc}`);
      await asyncRimraf(outLoc);
    } else if (await asyncExists(outLoc)) {
      reporter.debug(`[CACHE] Cache hit at ${outLoc}`);
      return outLoc;
    }

    try {
      await fetchAndExtract({
        url,
        name,
        tmpLoc,
        outLoc,
        raw
      });
    } catch (e) {
      console.log(e);
      reporter.debug(`[CACHE] fetchAndExtract error: ${e}`);
      throw `Failed to fetch ${name}`;
    }
  }

  async purge(pathname) {
    const loc = this.getCacheLocation(pathname);
    reporter.debug(`[CACHE] Purging '${loc}' (${pathname})`);
    return await asyncRimraf(loc);
  }

  async stat(pathname = '/') {
    try {
      const location = this.getCacheLocation(pathname);
      const rootStats = await statAsync(location);
      if (rootStats.isDirectory()) {
        let files = await readdirAsync(location);
        files = files.filter(f => f[0] !== ".").sort((a, b) => a.toLowerCase() > b.toLowerCase());
        const stats = await Promise.all(files
          .map(async f => statAsync(path.join(location, f)))
        )
        const mappedStats = stats.reduce((out, fileStats, i) => ({
          ...out,
          [files[i]]: fileStats,
        }), {});
        return {
          name: path.basename(location),
          stats: rootStats,
          children: mappedStats
        };
      } else {
        return {
          name: path.basename(location),
          stats: rootStats,
        };
      }
    } catch (e) {
      console.error(e);
    }

  }
}

module.exports = new D2Cache();