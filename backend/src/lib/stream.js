import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.log("Stream APi key or secret is missing !");
}
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    console.log("Upserting user:", userData);
    if (
      !userData.id ||
      typeof userData.id !== "string" ||
      userData.id.length === 0
    ) {
      throw new Error("Invalid or missing user ID.");
    }
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream User: ", error);
    throw error; // rethrow to handle upstream if needed
  }
};

//todo: Do it later
export const generateStreamToken = (userId) => {};
