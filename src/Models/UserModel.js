"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, required: false },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    lastPassowrdChanged: {
        type: String,
        require: false,
        default: "",
    },
}, { timestamps: true });
const User = mongoose_1.models.Users || (0, mongoose_1.model)("Users", UserSchema);
exports.default = User;
