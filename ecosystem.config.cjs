module.exports = {
    apps: [
        {
            name: 'iydef-backend',
            script: 'server/src/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
        },
    ],
};
