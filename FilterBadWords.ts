import { BadWords } from "./BadWords";
function filterBadWords(message: string): string {
  let filteredMessage = message;

  BadWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filteredMessage = filteredMessage.replace(regex, "****");
  });

  return filteredMessage;
}

export default filterBadWords;
