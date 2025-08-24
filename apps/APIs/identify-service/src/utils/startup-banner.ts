import figlet from "figlet";
import chalk from "chalk";
import { ENV } from "../configs/env";

/**
 * Display a fun startup banner for Identity Service
 */
export function showStartupBanner(config: {
  serviceName: string;
  port: number;
  environment: string;
  databaseStatus: "connected" | "error";
  swaggerEnabled: boolean;
}) {
  const { serviceName, port, environment, databaseStatus, swaggerEnabled } =
    config;

  try {
    // Create ASCII art title
    const asciiTitle = figlet.textSync("IDENTITY", {
      font: "Big",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    const asciiSubtitle = figlet.textSync("API", {
      font: "Big",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    // Get current timestamp
    const startTime = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    console.log();

    // Display ASCII art with colors
    asciiTitle.split("\n").forEach((line) => {
      if (line.trim()) {
        console.log(chalk.bold.yellow(line));
      }
    });

    asciiSubtitle.split("\n").forEach((line) => {
      if (line.trim()) {
        console.log(chalk.bold.yellow(line));
      }
    });

    console.log();

    // Log environment variables (excluding passwords)
    console.log(chalk.bold.cyan("🔧 Environment Variables:"));
    for (const key in ENV) {
      if (key.toLowerCase().includes("password")) continue;
      console.log(
        chalk.gray(`   ${key}: `) + chalk.white(ENV[key as keyof typeof ENV]),
      );
    }

    console.log();

    // Server info
    console.log(
      chalk.green("🚀 Server: ") + chalk.bold.white(`http://localhost:${port}`),
    );

    // Database status
    const dbStatusText =
      databaseStatus === "connected" ? "Connected ✅" : "Error ❌";
    const dbColor = databaseStatus === "connected" ? chalk.green : chalk.red;
    console.log(chalk.blue("📊 Database: ") + dbColor(dbStatusText));

    // Environment
    const envColor =
      environment === "production"
        ? chalk.red
        : environment === "staging"
          ? chalk.yellow
          : chalk.green;
    console.log(chalk.blue("🌍 Environment: ") + envColor(environment));

    // Swagger URL
    if (swaggerEnabled) {
      console.log(
        chalk.magenta("📝 Swagger: ") +
          chalk.bold.white(`http://localhost:${port}/swagger`),
      );
    }

    // Start time
    console.log(chalk.gray("⏰ Started at: ") + chalk.bold.white(startTime));

    console.log();

    // Fun startup message
    console.log(
      chalk.bold.green(
        "🎉 Identity Service is ready to serve anime lovers! 🎌",
      ),
    );
    console.log(chalk.gray("   Authentication, user management, and more..."));
    console.log();
  } catch (error) {
    // Fallback simple banner if figlet fails
    console.log(chalk.bold.cyan("🎯 WIBUTIME IDENTITY API STARTED 🎯"));
    console.log(chalk.green(`🚀 Server: http://localhost:${port}`));
    console.log(
      chalk.blue(
        `📊 Database: ${databaseStatus === "connected" ? "Connected ✅" : "Error ❌"}`,
      ),
    );
    console.log(chalk.yellow(`🌍 Environment: ${environment}`));
    if (swaggerEnabled) {
      console.log(
        chalk.magenta(`📝 Swagger: http://localhost:${port}/swagger`),
      );
    }
    console.log();
  }
}
