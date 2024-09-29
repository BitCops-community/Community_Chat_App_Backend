"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BadWords_1 = require("./BadWords");
function filterBadWords(message) {
    let filteredMessage = message;
    BadWords_1.BadWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        filteredMessage = filteredMessage.replace(regex, "****");
    });
    return filteredMessage;
}
exports.default = filterBadWords;
