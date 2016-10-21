const http = require('http');
var jsdom = require("jsdom").jsdom;
var fs = require('fs');

var path = require('path');

var port = process.env.PORT || 8080;

var options = {
    method: 'GET',
    hostname: 'radiominsk.by',
    path: '/',
    headers: {
    }
};
var cookie = [];

function getCaptchaCode() {
    return new Promise((resolve, reject) => {
        var req = http.request(options, (res) => {
            var data = '';
            cookie = res.headers['set-cookie'];

            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                var document = jsdom(data);
                var window = document.defaultView;
                var captchaCode = window.document.getElementById('CaptchaDeText').value;
                console.log('captchaCode', captchaCode);
                resolve(captchaCode);
            });
        });
        req.end();
    });
}

function getCaptcha(captchaCode, client) {
    var getCaptchaOptions = Object.assign({}, options);
    getCaptchaOptions.path = `/DefaultCaptcha/Generate?t=${captchaCode}`;
    getCaptchaOptions.headers['Referer'] = 'http://radiominsk.by/';
    getCaptchaOptions.headers['Cookie'] = cookie.join('; ');

    var req = http.request(getCaptchaOptions, (res) => {
        console.log('getCapcha');
        client.writeHead(200, {
            'Content-Type': 'image/gif',
            'captchacode': captchaCode
        });
        res.pipe(client);
    });
    req.end();
}

function sendMessage(postData) {
    return new Promise((resolve, reject) => {
        var sendMessageOptions = Object.assign({}, options);
        sendMessageOptions.method = 'POST';
        sendMessageOptions.path = '/Home/SendMessage';
        sendMessageOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        sendMessageOptions.headers['Cookie'] = cookie.join('; ');

        var req = http.request(sendMessageOptions, (res) => {
            var data = '';
            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                var document = jsdom(data);
                var window = document.defaultView;
                var div = window.document.getElementsByClassName('content');
                var text = div[0] ? div[0].innerHTML.trim() : 'Сообщение не отправлено';
                console.log(text);
                resolve(text);
            });
            console.log('status code:', res.statusCode);

        });
        req.write(postData);
        req.end();
    });
}

const server = http.createServer((req, res) => {
    if (req.url == '/api/GetCaptcha' && req.method == 'GET') {
        console.log('client headers', req.headers);
        if (req.headers.cook1 && req.headers.cook2) {
            cookie[0] = req.headers.cook1;
            cookie[1] = req.headers.cook2;
            res.setHeader('cook1', cookie[0]);
            res.setHeader('cook2', cookie[1]);
            getCaptcha(req.headers.captchacode, res);
        }
        else {
            getCaptchaCode()
                .then(captchaCode => {
                    res.setHeader('cook1', cookie[0]);
                    res.setHeader('cook2', cookie[1]);
                    getCaptcha(captchaCode, res);
                });
        }
    }
    else if (req.url == '/api/SendMessage' && req.method == 'GET') {
        console.log('SendMessage', req.headers.query);
        cookie[0] = req.headers.cook1;
        cookie[1] = req.headers.cook2;
        sendMessage(req.headers.query)
            .then(text => {
                if (text == '<h2>Сообщение отправлено</h2>') {
                    res.writeHead(200);
                }
                else {
                    res.writeHead(400);
                }
                res.end();
            });
    }
    else {
        var filePath = './build' + req.url;
        if (filePath == './build/')
            filePath = './build/index.html';
        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    fs.readFile('./build/index.html', function (error, content) {
                        res.writeHead(404);
                        res.end(content, 'utf-8');
                    });
                }
                else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    res.end();
                }
            }
            else {
                res.writeHead(200);
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(port);