import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        {
          _id: { $ne: currentUserId }, //exclude the current user
        },
        {
          $id: { $nin: currentUser.friends }, //exclude the current user friends
        },
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.log("Error in getRecommendedUsers controller", error.message);
    res.status(200).json({ message: "Internal server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error !" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    //prevent sending req to yourself
    if (myId === recipientId)
      return res
        .status(400)
        .json({ message: "You can't send friend request to your self" });
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found !" });
    }

    //check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }
    //check if a req already exists
    const exitsingRequest = await FriendRequest.findOne({
      $or: [
        {
          sender: myId,
          recipient: recipientId,
        },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (exitsingRequest) {
      return res.status(400).json({
        message: "A friend request alreaddy exists between you and this user",
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });
    res.status(200).json(friendRequest);
  } catch (error) {
    console.log("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found!" });
    }
    //verify the current user is recipient
    if (!friendRequest.recipientId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorize to accept this request !" });
    }

    friendRequest.status == "accepted";
    await friendRequest.save();

    //add each user to each other friends array
    //$addToSet : add elements to an array only if they do not already exists
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend Request accepted !" });
  } catch (error) {
    console.log(
      "Error occured in acceptFriendRequest controller",
      error.message
    );

    res.status(500).json({ message: "Internal server Error !" });
  }
}
