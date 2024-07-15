import express, { Request, Response, urlencoded } from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import MessagesModel from "./Models/MessageModel";
import ConnectToDB from "./Models/db";
dotenv.config();

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

      const newMessage = new MessagesModel({
        id: Math.floor(Math.random() * 9999999),
        name: userName,
        senderId: userId,
        avatar: avatar,
        message: UserMessage,
      });

      await newMessage.save();

      socket.broadcast.emit("message", newMessage);
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
