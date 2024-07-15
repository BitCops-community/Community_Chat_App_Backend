import mongoose from "mongoose";

const MessagesSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

const MessagesModel =
  mongoose.models.Messages || mongoose.model("Messages", MessagesSchema);

export default MessagesModel;
