const svgCaptcha = require("svg-captcha");

app.get('/captcha', (req, res) => {
    let captcha = svgCaptcha.create({
        size: 4,
        noise: Math.floor(Math.random() * 2) + 1,
        color: true,
        background: '#f7f7f7',
        width: 100,
        height: 45,
        fontSize: 45
    });
    req.session.captcha = captcha.text;
    res.type('svg').send(captcha.data);
});