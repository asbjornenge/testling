var fs = require('fs');
var path = require('path');

var argv = require('optimist')
    .usage('Usage: $0 [ test files ]')
    .check(function (argv) {
        if (argv._.length === 0) {
            if (path.existsSync(process.cwd() + '/test')) {
                argv._.unshift(process.cwd() + '/test');
            }
            else if (path.existsSync(process.cwd() + '/tests')) {
                argv._.unshift(process.cwd() + '/tests');
            }
            else throw ''
        }
    })
    .argv
;

var testFiles = argv._.reduce(function reducer (acc, x) {
    if (!path.existsSync(x)) {
        console.error('Test file or directory does not exist: ' + x);
        return [];
    }
    else if (fs.statSync(x).isDirectory()) {
        return fs.readdirSync(x)
            .map(function (file) {
                return path.resolve(x, file)
            })
            .filter(function (file) {
                return !fs.statSync(file).isDirectory()
                    && path.extname(file) === '.js'
            })
        ;
    }
    else if (path.extname(x) === '.js') {
        return acc.concat(x);
    }
    else return [];
}, []);

var testling = require('../');
var suite = testling();

var counts = {};

suite.on('assert', function (res) {
    console.log(res.test.filename + ' : ' + res.test.name);
    if (!res.ok) {
        console.log('    wanted: ' + res.wanted);
        console.log('    found: ' + res.found);
    }
    else {
        console.log('    ok');
    }
});

suite.on('error', function (err) {
    console.log(err.message);
});

suite.on('end', function () {
    var percent = Math.floor(suite.counts.pass / suite.counts.total * 100);
    console.log('\n' + percent + '% OF TESTS PASSED');
});

var pending = testFiles.length;
testFiles.forEach(function (file) {
    fs.readFile(file, function (err, src) {
        if (err) console.error(err)
        else suite.append(src, { filename : file })
        pending --;
        if (pending === 0) suite.run();
    });
});
