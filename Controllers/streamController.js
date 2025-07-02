import Song from "../Models/songModel.js";
import Stream from "../Models/streamModel.js";
import User from "../Models/userModel.js";

export const createStream = async (req, res) => {
  try {
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const newStream = new Stream({
      user: req.user.id,
      song: songId,
    });

    await newStream.save();

    res
      .status(200)
      .json({ message: "Stream created successfully", data: newStream });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while creating stream",
      error: error.message,
    });
  }
};

export const recentlyPlayed = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const streams = await Stream.find({ user: id })
      .populate("song")
      .sort({ timestamp: -1 });

    const seen = new Set();
    const uniqueSongs = [];

    for (const stream of streams) {
      if (!seen.has(stream.song._id.toString())) {
        seen.add(stream.song._id.toString());
        uniqueSongs.push(stream.song);
      }
    }

    const recentlyPlayedSongs = uniqueSongs;

    if (!recentlyPlayedSongs || recentlyPlayedSongs.length === 0) {
      return res.status(200).json({ message: "No recently played songs found" , data: []});
    }

    const formattedSongs = recentlyPlayedSongs.map((song) => ({
      id: song._id,
      name: song.name,
      desc: song.desc,
      albumID: song.albumID?._id,
      albumName: song.albumID?.name || "Unknown Album",
      artistID: song.artistID?._id,
      artistName: song.artistID?.name || "Unknown Artist",
      genre: song.genre,
      duration: song.duration,
      image: song.image,
      audio: song.audio,
      likes: song.likes,
      views: song.views,
      releaseDate: song.releaseDate,
      createdAt: song.createdAt,
    }));

    return res.status(200).json({
      message: "Recently played songs",
      data: formattedSongs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while fetching recently played songs",
      error: error.message,
    });
  }
};
