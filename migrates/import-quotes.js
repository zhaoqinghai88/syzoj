
const fn = async () => {
  require('..');
  await syzoj.untilStarted;

  const User = syzoj.model('user');
  const Quote = syzoj.model('quote');

  const fs = require('fs-extra');
  const pathlib = require('path');

  // deal with hitokoto
  const hitokotoList = require('../custom-hitokoto.json');

  function checkDialog(item) {
    const { hitokoto, from } = item;

    const lines = hitokoto.split('\n');
    if (lines.length === 1) return null;

    const fromList = new Set();

    for (const line of lines) {
      const tmp = line.match(/^([a-zA-Z0-9_-]+)(: |：)(.+)$/);
      if (!tmp) return null;
      fromList.add(tmp[1]);
    }

    item.hitokoto = lines.join('\n\n');
    item.from = [...fromList];
    item.is_dialog = true;
  }

  for (const item of hitokotoList) {
    try {
      checkDialog(item);
  
      item.from = item.from || '佚名';
      if (typeof item.from === 'string') {
        item.from = [item.from];
      }
  
      const quote = Quote.create({
        type: 'hitokoto',
        content: {
          hitokoto: item.hitokoto,
          is_dialog: item.is_dialog
        },
        provider_id: 1,
        weight: item.weight || 1,
        creation_time: new Date()
      });
  
      await quote.save();
      await quote.setFrom(item.from, true);

      console.log('success', item);
    } catch (err) {
      console.warn('failed', item, err);
    }
  }

  // deal with images
  const { baseDir } = Quote;

  await fs.copy(baseDir, pathlib.join(pathlib.dirname(baseDir), 'quote_image_backup'));

  for (const from of await fs.readdir(baseDir)) {
    const dir = pathlib.join(baseDir, from);
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) continue;

    for (const filename of await fs.readdir(dir)) {
      const path = pathlib.join(dir, filename);
      const stat = await fs.stat(path);
      if (!stat.isFile()) continue;

      try {
        const quote = Quote.create({
          type: 'image',
          content: {},
          provider_id: 1,
          weight: 1,
          creation_time: stat.mtime
        });
  
        await quote.setImage({
          filename, path, size: stat.size
        });
        await quote.save();
        await quote.setFrom([from], true);

        console.log('success', from, filename);
      } catch (err) {
        console.warn('failed', from, filename, err);
      }
    }
  }

  process.exit();
};

fn();
