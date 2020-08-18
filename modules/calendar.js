const fetch = require("node-fetch");
const moment = require('moment');

function parseMinutes(minutes) {
  const days = parseInt(minutes / 60 / 24), hours = parseInt(minutes / 60) % 24;
  minutes = minutes % 60;
  return [
    days && `${days} 天`,
    hours && `${hours} 小时`,
    minutes && `${minutes} 分钟`
  ].filter(str => !!str).join(' ');
}

app.get('/calendar', async (req, res) => {
  if (!syzoj.config.calendar.enable) {
    res.render('error', {
      err: '未开启日历功能。'
    });
  } else if (!syzoj.config.calendar.api_url) {
    res.render('error', {
      err: '日历配置有误，请联系管理员。'
    });
  } else {
    try {
      const data = await(await fetch(syzoj.config.calendar.api_url)).json();

      if (data.status !== 'OK') {
        res.render('error', {
          err: 'API 可能出现了些小问题？<br><a href="' + syzoj.config.calendar.api_url + '">戳这里看看。</a>'
        });
      } else {
        let contests = [];
        for (let oj of data.oj) {
          for (let contest of oj.contests) {
            contest.oj = oj;
            contests.push(contest);
          }
        }
        contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        for (let contest of contests) {
          contest.lastTime = parseMinutes(moment(contest.endTime).diff(contest.startTime, 'm'));
          contest.startTime = moment(contest.startTime).format('MM 月 DD 日 HH:mm');
          contest.endTime = moment(contest.endTime).format('MM 月 DD 日 HH:mm');
        }
        res.render('calendar', {
          contests: contests
        });
      }
    } catch (err) {
      res.render('error', {
        err: err
      });
    }
  }
});
