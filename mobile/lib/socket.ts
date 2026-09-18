import {
  io,
} from "socket.io-client";

import {
  API_URL,
} from "./api";

export const socket =
  io(
    API_URL,
    {
      autoConnect:
        false,

      transports: [
        "websocket",
      ],

      reconnection:
        true,

      reconnectionAttempts:
        10,

      reconnectionDelay:
        1000,

      reconnectionDelayMax:
        5000,

      timeout:
        10000,
    },
  );