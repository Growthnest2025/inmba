const databaseConfig = {
  host:
    process.env.DB_HOST ||
    "127.0.0.1",

  port:
    Number(process.env.DB_PORT) ||
    3307,

  user:
    process.env.DB_USER ||
    "root",

  password:
    process.env.DB_PASSWORD ||
    "",

  database:
    process.env.DB_NAME ||
    "inmba",

  waitForConnections: true,

  connectionLimit: 5,

  maxIdle: 5,

  idleTimeout: 60000,

  queueLimit: 0,

  connectTimeout: 20000,

  enableKeepAlive: true,

  keepAliveInitialDelay: 0,

  namedPlaceholders: true,

  dateStrings: true,

  charset: "utf8mb4",
};

module.exports =
  databaseConfig;