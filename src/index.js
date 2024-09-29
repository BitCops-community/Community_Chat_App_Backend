"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const MessageModel_1 = __importDefault(require("./Models/MessageModel"));
const db_1 = __importDefault(require("./Models/db"));
const xss_1 = __importDefault(require("xss"));
dotenv_1.default.config();
const FilterBadWords_1 = __importDefault(require("./FilterBadWords"));
const UserModel_1 = __importDefault(require("./Models/UserModel"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = 3002;
app.use(express_1.default.json());
app.use((0, express_1.urlencoded)({ extended: true }));
const { JWT_SECRET_KEY } = process.env;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
function removeUrls(message) {
    // Regular expression to match URLs in different formats
    const urlRegex = /(\b(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w]{2,}(?:\.[\w]{2,})?\b)/gi;
    // Remove URLs from the message using replace method
    return message.replace(urlRegex, "");
}
const getTotalUsersCount = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield UserModel_1.default.find({});
    return users && users.length > 0 ? users.length : 1;
});
let connectedClients = new Map();
// Map to store the last message timestamp for each socket
const lastMessageTimestamp = new Map();
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    let totalUsers = yield getTotalUsersCount();
    // console.log(`User ${socket.id} Connected`);
    io.emit("totalUsers", totalUsers);
    socket.on("userJoined", () => {
        console.log(`New User Joined : Current Connected Users : ${connectedClients.size}`);
        connectedClients.set(socket.id, "connected");
        io.emit("connectedUsers", connectedClients.size);
    });
    socket.on("message", ({ token, message }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id: userId, name: userName, isAdmin, } = jsonwebtoken_1.default.verify(token, JWT_SECRET_KEY);
            let { id: messageId, senderId, name, avatar, message: UserMessage, } = message;
            if (!isAdmin) {
                UserMessage = removeUrls(UserMessage);
            }
            UserMessage = (0, FilterBadWords_1.default)(UserMessage);
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
            const newMessage = new MessageModel_1.default({
                id: Math.floor(Math.random() * 9999999),
                name: userName,
                senderId: userId,
                avatar: avatar,
                message: (0, xss_1.default)(UserMessage),
            });
            yield newMessage.save();
            socket.broadcast.emit("message", (0, xss_1.default)(newMessage));
        }
        catch (error) {
            console.error("Error verifying token:", error instanceof Error ? error.message : error);
            socket.emit("error", { message: "Invalid token" });
        }
    }));
    socket.on("userDisconnect", () => {
        if (connectedClients.has(socket.id)) {
            connectedClients.delete(socket.id);
        }
        console.log(`User Leaved : Current Connected Users : ${connectedClients.size}`);
        io.emit("connectedUsers", connectedClients.size);
    });
    socket.on("disconnect", () => {
        lastMessageTimestamp.delete(socket.id); // Clean up the timestamp map
        if (connectedClients.has(socket.id)) {
            connectedClients.delete(socket.id);
        }
        console.log(`User Leaved : Current Connected Users : ${connectedClients.size}`);
        io.emit("connectedUsers", connectedClients.size);
    });
}));
app.get("/", (req, res) => {
    const domain = req.headers.host;
    res.json({
        success: true,
        message: "Welcome to the chat application",
        domain,
    });
});
httpServer.listen(port, function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        console.log(`Server running on port ${port}`);
    });
});
