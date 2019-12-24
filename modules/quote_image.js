
const fs = require('fs-extra');
const Path = require('path');

const baseDir = Path.join(syzoj.rootDir, 'uploads', 'quote_image');

let quotes = [];

function loadQuotes() {
  let result = [];
  fs.readdirSync(baseDir).forEach(dir => {
    let dirPath = Path.join(baseDir, dir);
    let stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      fs.readdirSync(dirPath).forEach(filename => {
        let ext = Path.extname(filename).slice(1);
        if (['png', 'jpg', 'gif'].includes(ext)) {
          let path = Path.join(dirPath, filename);
          let stat = fs.statSync(path);
          if (stat.isFile()) {
            let buffer = fs.readFileSync(path);
            result.push({
              of: dir,
              type: ext,
              buffer: buffer
            });
          }
        }
      });
    }
  });
  return result;
}

try {
  quotes = loadQuotes();
} catch (err) {
  syzoj.log(err);
}

function getRandomFrom(array) {
  if (!Array.isArray(array) || !array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
}

app.get('/api/quote', (req, res) => {
  try {
    let list = quotes;
    let name = req.query.of;
    if (name) {
      name = name.toLowerCase();
      list = list.filter(quote => quote.of.toLowerCase() === name);
    }
    let quote = getRandomFrom(list);
    if (!quote) {
      throw new ErrorMessage("no quotes are available");
    }
    res.type(quote.type).send(quote.buffer);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.get('/api/quote/reload', (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
    quotes = loadQuotes();
    res.redirect(syzoj.utils.makeUrl(['api', 'quote']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
