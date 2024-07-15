"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MessagesSchema = new mongoose_1.default.Schema({
    id: {
        type: Number,
    },
    name: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
        default: "",
    },
}, { timestamps: true });
const MessagesModel = mongoose_1.default.models.Messages || mongoose_1.default.model("Messages", MessagesSchema);
exports.default = MessagesModel;
