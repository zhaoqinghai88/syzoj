
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

function weightedRandomFrom(list) {
  let total = 0;
  for (let item of list) {
    total += item.weight || 1;
  }
  let temp = Math.random() * total;
  for (let item of list) {
    temp -= item.weight;
    if (temp < 0) return item;
  }
  return null; // should not be here
}

app.get('/api/hitokoto', async (req, res, next) => {
  try {
    const config = syzoj.config.custom_hitokoto;
    if (!config || !config.enabled) return next();
    const list = syzoj.hitokoto.list;
    if (!list.length) throw new ErrorMessage("这里什么都没有");
    let { hitokoto, from } = weightedRandomFrom(list);
    res.send({ hitokoto, from });
  } catch (e) {
    syzoj.log(e);
    res.send({
      error: e.message
    });
  }
});
