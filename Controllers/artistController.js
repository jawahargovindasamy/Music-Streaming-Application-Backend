import User from "../Models/userModel.js";
import Song from "../Models/songModel.js";
import Artist from "../Models/artistModel.js";
import Album from "../Models/albumModel.js";
import Stream from "../Models/streamModel.js";
import { v2 as cloudinary } from "cloudinary";

const calculateGrowth = (current, previous) => {
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getArtistDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "artist") {
      return res
        .status(403)
        .json({ message: "Access denied for non-artist users" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const artist = await Artist.findOne({ userID: user._id }); // ✅ Find the artist
    if (!artist) {
      return res
        .status(400)
        .json({ message: "Artist ID not found in user profile" });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const songs = await Song.find({ artist: artist._id }).select(
      "_id name createdAt"
    );
    const songIds = songs.map((song) => song._id);

    // 2. Streams
    const totalStreams = await Stream.countDocuments({
      song: { $in: songIds },
    });
    const currentMonthStreams = await Stream.countDocuments({
      song: { $in: songIds },
      timestamp: { $gt: thisMonth },
    });
    const previousMonthStreams = await Stream.countDocuments({
      song: { $in: songIds },
      timestamp: { $gt: lastMonth, $lte: thisMonth },
    });
    const streamGrowth = calculateGrowth(
      currentMonthStreams,
      previousMonthStreams
    );

    // 3. Listeners
    const currentListeners = await Stream.distinct("user", {
      song: { $in: songIds },
      timestamp: { $gte: thisMonth },
    });
    const previousListeners = await Stream.distinct("user", {
      song: { $in: songIds },
      timestamp: { $gte: lastMonth, $lt: thisMonth },
    });
    const listenerGrowth = calculateGrowth(
      currentListeners.length,
      previousListeners.length
    );

    // 4. Followers
    const totalFollowers = artist.followers.length;
    const currentFollowers = artist.followers.filter(
      (f) => f.createdAt && f.createdAt >= thisMonth
    ).length;
    const previousFollowers = artist.followers.filter(
      (f) => f.createdAt && f.createdAt >= lastMonth && f.createdAt < thisMonth
    ).length;
    const followerGrowth = calculateGrowth(currentFollowers, previousFollowers);

    // 5. Recent Songs
    const recentSongs = await Song.find({ artist: artist._id })
      .sort({ createdAt: -1 })
      .limit(5);
    const recentSongStats = await Promise.all(
      recentSongs.map(async (song) => {
        const totalStreams = await Stream.countDocuments({ song: song._id });
        return {
          id: song._id,
          name: song.name,
          createdAt: song.createdAt,
          totalStreams,
        };
      })
    );

    res.status(200).json({
      totalStreams,
      currentMonthStreams,
      streamGrowth: streamGrowth.toFixed(2),
      monthlyListeners: currentListeners.length,
      listenerGrowth: listenerGrowth.toFixed(2),
      totalFollowers,
      followerGrowth: followerGrowth.toFixed(2),
      recentSongs: recentSongStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while fetching Artist dashboard stats",
      error: error.message,
    });
  }
};

export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find().populate("userID", "username");

    if (artists.length === 0) {
      return res.status(404).json({ message: "No artists found" });
    }

    const formattedArtists = artists.map((artists) => ({
      id: artists._id,
      username: artists.userID.username,
      bio: artists.bio,
      image: artists.image,
    }));

    res.status(200).json({
      message: "Artists fetched successfully",
      data: formattedArtists,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting artists",
      error: error.message,
    });
  }
};

export const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const songs = await Song.find({ artistID: id });

    const albums = await Album.find({ artistID: id });

    res.status(200).json({
      message: "Artist fetched successfully",
      data: {
        artist,
        songs,
        albums,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting artist by ID",
      error: error.message,
    });
  }
};

export const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, bio } = req.body;
    const imageFile = req.file;

    const artist = await Artist.findById(id);

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    if (
      req.user.role !== "artist" ||
      artist.userID.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message: "Access Denied: Only artist can update artist",
      });
    }

    if (username) {
      await User.findByIdAndUpdate(artist.userID, { username });
    }

    if (bio) artist.bio = bio;
    if (imageFile) {
      artist.image = imageFile.secure_url || imageFile.path;
    }

    artist.updatedAt = Date.now();
    await artist.save();

    const updatedArtist = await Artist.findById(id)
      .populate("userID", "username")
      .select("bio image userID");

    const formattedArtist = {
      username: updatedArtist.userID.username,
      bio: updatedArtist.bio,
      image: updatedArtist.image,
    };

    res.status(200).json({
      message: "Artist updated successfully",
      data: formattedArtist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while updating artist",
      error: error.message,
    });
  }
};

export const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const isOwner =
      req.user.role === "artist" &&
      artist.userID.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Access denied: Only the artist or an admin can delete this profile",
      });
    }

    // Delete all songs by this artist
    await Song.deleteMany({ artist: artist._id });

    // Delete all albums by this artist
    await Album.deleteMany({ artist: artist._id });

    // Delete the artist profile
    await Artist.findByIdAndDelete(artist._id);

    // Delete the associated user account
    await User.findByIdAndDelete(artist.userID);

    res.status(200).json({
      message: "Artist, songs, albums, and user account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting artist",
      error: error.message,
    });
  }
};

export const addFollower = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = artist.followers.includes(user._id);

    if (isFollowing) {
      artist.followers = artist.followers.filter(
        (follower) => follower.toString() !== user._id.toString()
      );
      user.followedArtists = user.followedArtists.filter(
        (artist) => artist.toString() !== id.toString()
      )
      await artist.save();
      await user.save();
      return res.status(200).json({ message: "Unfollowed successfully" });
    }
    else{
      artist.followers.push(user._id);
      user.followedArtists.push(artist._id);

      await artist.save();
      await user.save();
      
      return res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while adding follower",
      error: error.message,
    });
  }
};
