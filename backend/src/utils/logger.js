// utils/logger.js
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
  level: "info", // info, debug, error
});

export default logger;
