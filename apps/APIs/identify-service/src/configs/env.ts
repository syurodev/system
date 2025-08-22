export const ENV = {
  CONFIG_SERVICE_PORT: parseInt(process.env.CONFIG_SERVICE_PORT ?? "3101"),
  CONFIG_SERVICE_GRPC_PORT: parseInt(
    process.env.CONFIG_SERVICE_GRPC_PORT ?? "5101",
  ),

  CONFIG_PG_USER_HOST: process.env.CONFIG_PG_USER_HOST ?? "localhost",
  CONFIG_PG_USER_PORT: parseInt(process.env.CONFIG_PG_USER_PORT ?? "5432"),
  CONFIG_PG_USER_USERNAME: process.env.CONFIG_PG_USER_USERNAME ?? "postgres",
  CONFIG_PG_USER_PASSWORD: process.env.CONFIG_PG_USER_PASSWORD ?? "postgres",
  CONFIG_PG_USER_DBNAME: process.env.CONFIG_PG_USER_DBNAME ?? "postgres",
  CONFIG_PG_USER_SSL: process.env.CONFIG_PG_USER_SSL ?? "false",
  CONFIG_PG_USER_MAX_CONNECTIONS: parseInt(
    process.env.CONFIG_PG_USER_MAX_CONNECTIONS ?? "20",
  ),
  CONFIG_PG_USER_IDLE_TIMEOUT: parseInt(
    process.env.CONFIG_PG_USER_IDLE_TIMEOUT ?? "30000",
  ),
};
