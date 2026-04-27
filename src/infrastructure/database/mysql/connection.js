import SequelizePkg from "sequelize";
import mysql from "mysql2/promise";

const Sequelize = SequelizePkg.Sequelize || SequelizePkg;

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  },
);

const ensureDatabaseExists = async () => {
  const dbName = process.env.MYSQL_DATABASE;
  const escapedDbName = String(dbName).replace(/`/g, "");

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
};

export const connectMysql = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Connected to MySQL");
  } catch (error) {
    const dbMissing =
      error?.original?.code === "ER_BAD_DB_ERROR" ||
      error?.parent?.code === "ER_BAD_DB_ERROR";

    if (dbMissing) {
      try {
        console.warn(
          `MySQL database \"${process.env.MYSQL_DATABASE}\" not found. Creating it automatically...`,
        );
        await ensureDatabaseExists();
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log("Connected to MySQL");
        return;
      } catch (dbError) {
        console.error("Error creating MySQL database:", dbError);
        process.exit(1);
      }
    }

    console.error("Error connecting to MySQL:", error);
    process.exit(1);
  }
};

export default sequelize;
