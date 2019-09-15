
const fs = require('fs-extra');
const Path = require('path');

syzoj.hitokoto = {
  configFile: Path.join(syzoj.rootDir, 'custom-hitokoto.json'),
  list: [],
  load() {
    let result = [];
    try {
      result = JSON.parse(fs.readFileSync(this.configFile));
    } catch (err) {
      syzoj.log(err);
    }
    this.update(result);
  },
  update(list) {
    if (!list.length) {
      list.push({
        hitokoto: '这里什么也没有'
      });
    }
    this.list = list;
  },
  async save() {
    await fs.writeFile(this.configFile, JSON.stringify(this.list, null, 2));
  }
};

syzoj.hitokoto.load();

app.get('/api/hitokoto', async (req, res, next) => {
  try {
    const config = syzoj.config.custom_hitokoto;
    if (!config || !config.enabled) return next();
    const list = syzoj.hitokoto.list;
    if (!list.length) throw new ErrorMessage("这里什么都没有");
    res.send(list[Math.floor(Math.random() * list.length)]);
  } catch (e) {
    syzoj.log(e);
    res.send({
      error: e.message
    });
  }
});
