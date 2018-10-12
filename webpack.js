module.exports    = {
    entry: {main: './build/src/index.js'},
    externals: {
        'hash-stream-validation': 'require("hash-stream-validation")',
    },
    mode: 'none',
    output: {filename: 'index.js', library: 'index', path: __dirname},
    target: 'node'
};
