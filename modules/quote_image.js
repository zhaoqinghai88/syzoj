
const fs = require('fs-extra');
const Path = require('path');
const randomstring = require('randomstring');

const baseDir = Path.join(syzoj.rootDir, 'uploads', 'quote_image');

syzoj.quotes = [];

function isValidImageExt(ext) {
  return ext.startsWith('.') && ['png', 'jpg', 'gif'].includes(ext.slice(1));
}

function loadQuotes() {
  let result = [];
  fs.readdirSync(baseDir).forEach(dir => {
    let dirPath = Path.join(baseDir, dir);
    let stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      fs.readdirSync(dirPath).forEach(filename => {
        let ext = Path.extname(filename);
        if (isValidImageExt(ext)) {
          let path = Path.join(dirPath, filename);
          let stat = fs.statSync(path);
          if (stat.isFile()) {
            let buffer = fs.readFileSync(path);
            result.push({
              from: dir,
              filename: filename,
              type: ext.slice(1),
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
syzoj.findQuote = (from, filename) =>
  syzoj.quotes.find(quote =>
    quote.from === from && quote.filename === filename
  );
syzoj.addQuote = (from, filename, buffer) => {
  let ext = Path.extname(filename);
  if (!isValidImageExt(ext)) throw new ErrorMessage("扩展名不合法");
  let path = Path.join(baseDir, from, filename);
  if (fs.existsSync(path)) throw new ErrorMessage("文件已存在");
  fs.ensureDirSync(Path.dirname(path));
  fs.writeFileSync(path, buffer);
  let stat = fs.statSync(path);
  let quote = {
    from, filename, type: ext.slice(1),
    time: stat.mtime, buffer
  };
  syzoj.quotes.push(quote);
  return quote;
};
syzoj.deleteQuote = (quote) => {
  let oldPath = Path.join(baseDir, quote.from, quote.filename);
  let newPath = Path.join(baseDir, ['deleted', randomstring.generate(8), quote.from, quote.filename].join('-'));
  fs.renameSync(oldPath, newPath);
  let index = syzoj.quotes.indexOf(quote);
  syzoj.quotes.splice(index, 1);
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

app.use('/quote', (req, res, next) => {
  try {
    if (!res.locals.user) throw new ErrorMessage("登录后才可以查看语录。");
    return next();
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.get('/quote', quoteHandler);
app.get('/quote/:from', quoteHandler);

app.get('/quote/:from/:filename', (req, res) => {
  try {
    let quote = syzoj.findQuote(req.params.from, req.params.filename);
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
