
const fs = require('fs-extra');
const Path = require('path');

const baseDir = Path.join(syzoj.rootDir, 'uploads', 'quote_image');

syzoj.quotes = [];

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
              from: dir,
              filename: filename,
              type: ext,
              time: stat.mtime,
              buffer: buffer
            });
          }
        }
      });
    }
  });
  return result;
}

syzoj.loadQuotes = () => {
  syzoj.quotes = loadQuotes();
};

try {
  syzoj.loadQuotes();
} catch (err) {
  syzoj.log(err);
}

function getRandomFrom(array) {
  if (!Array.isArray(array) || !array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
}

function quoteHandler(req, res) {
  try {
    let list = syzoj.quotes;
    if (req.params.from) {
      list = list.filter(quote => quote.from === req.params.from);
    }
    let quote = getRandomFrom(list);
    if (!quote) {
      res.status(404);
      throw new ErrorMessage("这里似乎还没有语录……不如搜集一些？");
    } else {
      if (['1', 'true'].includes(req.query.noredirect)) {
        res.type(quote.type).send(quote.buffer);
      } else {
        res.redirect(syzoj.utils.makeQuoteUrl(quote.from, quote.filename));
      }
    }
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
};

app.get('/quote', (req, res) => quoteHandler(req, res));
app.get('/quote/:from', (req, res) => quoteHandler(req, res));

app.get('/quote/:from/:filename', (req, res) => {
  try {
    let quote = syzoj.quotes.find(quote =>
      quote.from === req.params.from && quote.filename === req.params.filename
    );
    if (quote) {
      res.type(quote.type).send(quote.buffer);
    } else {
      res.status(404);
      throw new ErrorMessage("这条语录消失了……");
    }
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});
