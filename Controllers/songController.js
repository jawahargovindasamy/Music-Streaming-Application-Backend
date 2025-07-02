import User from "../Models/userModel.js";
import Artist from "../Models/artistModel.js";
import Album from "../Models/albumModel.js";
import Song from "../Models/songModel.js";
import Stream from "../Models/streamModel.js";

export const uploadSong = async (req, res) => {
  try {
    const { name, desc, albumID, genre, duration } = req.body;
    const userId = req.user.id;

    // ✅ Get the uploaded file
    const audioFile = req.file;

    // Validate required fields
    if (!name || !albumID || !genre || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(duration) || Number(duration) <= 0) {
      return res
        .status(400)
        .json({ message: "Duration must be a positive number" });
    }

    // Validate album
    const album = await Album.findById(albumID);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Validate artist
    const artist = await Artist.findById(album.artistID);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "artist") {
      return res.status(400).json({ message: "User is not an artist" });
    }

    // Validate uploaded audio
    if (!audioFile) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    // Create new song
    const newSong = new Song({
      name,
      desc,
      albumID: album._id,
      artistID: artist._id,
      image: album.image,
      genre,
      duration: Number(duration),
      audio: audioFile.path,
    });

    // Save song
    await newSong.save();

    return res.status(201).json({
      message: "Song uploaded successfully",
      song: newSong,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while uploading song",
      error: error.message,
    });
  }
};

export const listSong = async (req, res) => {
  try {
    const allSongs = await Song.find({})
      .populate("albumID", "name")
      .populate("artistID", "name")
      .sort({ views: -1 });

    const songs = allSongs.map((song) => ({
      id: song._id,
      name: song.name,
      desc: song.desc,
      albumID: song.albumID?._id?.toString() || null,
      albumName: song.albumID?.name || null,
      artistID: song.artistID?._id?.toString() || null,
      artistName: song.artistID?.name || null,
      genre: song.genre,
      duration: song.duration,
      image: song.image,
      audio: song.audio,
      likes: song.likes,
      views: song.views,
      releaseDate: song.releaseDate,
    }));

    res
      .status(200)
      .json({ message: "Songs fetched successfully", data: songs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSongById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, desc, albumID, genre, duration } = req.body;
    const userId = req.user.id;

    // Validate user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "artist")
      return res.status(400).json({ message: "User is not an artist" });

    const artist = await Artist.findOne({ userID: user._id });
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    if (song.artistID.toString() !== artist._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this song" });
    }

    // Conditionally update only if a new value is provided
    if (name) song.name = name;
    if (desc) song.desc = desc;
    if (albumID) song.albumID = albumID;
    if (genre) song.genre = genre;
    if (duration) song.duration = duration;

    // Optional audio file update
    if (req.file) {
      song.audio = req.file.path;
    }

    await song.save();

    res.status(200).json({ message: "Song updated successfully", data: song });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while updating song",
      error: error.message,
    });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    await Song.findByIdAndDelete(id);
    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting song",
      error: error.message,
    });
  }
};

export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    song.views = (song.views || 0) + 1;
    await song.save();

    res
      .status(200)
      .json({ message: "Views incremented successfully", data: song.views });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while incrementing views",
      error: error.message,
    });
  }
};
