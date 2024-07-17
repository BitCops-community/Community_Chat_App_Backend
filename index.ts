import express, { Request, Response, urlencoded } from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import MessagesModel from "./Models/MessageModel";
import ConnectToDB from "./Models/db";
import xss from "xss";
dotenv.config();

import { BadWords } from "./BadWords";
import filterBadWords from "./FilterBadWords";

const app = express();
const httpServer = createServer(app);
const port = 3002;
app.use(express.json());
app.use(urlencoded({ extended: true }));
const { JWT_SECRET_KEY } = process.env;

interface UserPayload extends JwtPayload {
  id: string;
  name: string;
  isAdmin: boolean;
}

interface MessagePayload {
  token: string;
  message: {
    id: number;
    name: string;
    senderId: string;
    avatar: string;
    message: string;
  };
}

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

function removeUrls(message: string): string {
  // Regular expression to match URLs in different formats
  const urlRegex =
    /(\b(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w]{2,}(?:\.[\w]{2,})?\b)/gi;

  // Remove URLs from the message using replace method
  return message.replace(urlRegex, "");
}

let connectedClients = 0;

// Map to store the last message timestamp for each socket
const lastMessageTimestamp = new Map<string, number>();

io.on("connection", (socket: Socket) => {
  console.log(`User ${socket.id} Connected`);
  connectedClients += 1;
  io.emit("connectedUsers", connectedClients);

  socket.on("message", async ({ token, message }: MessagePayload) => {
    try {
      const {
        id: userId,
        name: userName,
        isAdmin,
      }: UserPayload = jwt.verify(token, JWT_SECRET_KEY!) as UserPayload;

      let {
        id: messageId,
        senderId,
        name,
        avatar,
        message: UserMessage,
      } = message;

      if (!isAdmin) {
        UserMessage = removeUrls(UserMessage);
      }
      UserMessage = filterBadWords(UserMessage);
      const currentTime = Date.now();
      const lastTime = lastMessageTimestamp.get(socket.id) || 0;

      if (currentTime - lastTime < 3000) {
        // If the last message was sent within the last 3 seconds, return an error
        socket.emit("error", {
          message: "You can only send one message every 3 seconds",
        });
        return;
      }

      // Update the last message timestamp
      lastMessageTimestamp.set(socket.id, currentTime);

      const newMessage = new MessagesModel({
        id: Math.floor(Math.random() * 9999999),
        name: userName,
        senderId: userId,
        avatar: avatar,
        message: xss(UserMessage),
      });

      await newMessage.save();

      socket.broadcast.emit("message", xss(newMessage));
    } catch (error) {
      console.error(
        "Error verifying token:",
        error instanceof Error ? error.message : error
      );
      socket.emit("error", { message: "Invalid token" });
    }
  });

  socket.on("disconnect", () => {
    connectedClients -= 1;
    console.log(`User ${socket.id} Disconnected`);
    io.emit("connectedUsers", connectedClients);
    lastMessageTimestamp.delete(socket.id); // Clean up the timestamp map
  });
});

app.get("/", (req: Request, res: Response) => {
  const domain = req.headers.host;

  res.json({
    success: true,
    message: "Welcome to the chat application",
    domain,
  });
});

httpServer.listen(port, async function () {
  await ConnectToDB();
  console.log(`Server running on port ${port}`);
});
