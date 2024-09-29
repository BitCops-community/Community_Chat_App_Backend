import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
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
  },
  { timestamps: true },
);

const User = models.Users || model("Users", UserSchema);
export default User;
