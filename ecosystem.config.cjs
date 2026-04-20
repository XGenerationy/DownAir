module.exports = {
  apps: [
    {
      name: 'downair',
      script: 'node',
      args: '--import tsx/esm server/index.ts',
      cwd: '/var/www/downair.net',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
