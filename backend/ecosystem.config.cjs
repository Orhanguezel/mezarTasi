module.exports = {
  apps: [
    {
      name: "mezartasi-backend",
      cwd: "/var/www/mezarTasi/backend",
      script: "dist/index.js",
      interpreter: "/root/.bun/bin/bun",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1", 
        PORT: "8083"
      },
      out_file: "/var/log/pm2/mezartasi-backend.out.log",
      error_file: "/var/log/pm2/mezartasi-backend.err.log",
      combine_logs: true,
      time: true
    }
  ]
};
