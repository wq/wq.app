import commonjs from 'rollup-plugin-commonjs';
export default [{
    'input': 'packages/jquery-mobile/vendor/jquery-mobile.js',
    'plugins': [commonjs()],
    'output': [
        {
            'file': 'packages/jquery-mobile/dist/jquery.mobile.js',
            'format': 'amd',
            'indent': false
        }
    ]
}];
