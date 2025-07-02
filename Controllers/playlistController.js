import Playlist from "../Models/playlistModel.js";
import Song from "../Models/songModel.js";
import User from "../Models/userModel.js";
import mongoose from "mongoose";

export const createPlaylist = async (req, res) => {
  try {
    const { title } = req.body;
    const imageFile = req.file;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!imageFile)
      return res.status(400).json({ message: "Image is required" });

    const newPlaylist = new Playlist({
      title,
      image: imageFile.secure_url || imageFile.path,
      user: req.user.id,
    });

    await newPlaylist.save();

    return res.status(201).json({
      message: "Playlist created successfully",
      data: newPlaylist,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error while creating playlist",
      error: error.message,
    });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const { songId } = req.body;
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const alreadyExists = playlist.songs.some((id) => id.toString() === songId);

    if (alreadyExists) {
      return res.status(400).json({ message: "Song already in playlist" });
    }

    playlist.songs.push(songId);

    await playlist.save();

    return res.status(200).json({
      message: "Song added to playlist successfully",
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while adding song to playlist",
      error: error.message,
    });
  }
};

export const getPlaylist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const playlist = await Playlist.find({ user: req.user.id }).populate(
      "songs"
    );

    return res.status(200).json({
      message: "Playlist fetched successfully",
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting playlist",
      error: error.message,
    });
  }
};

export const getPlaylistbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const playlist = await Playlist.findById(id).populate({
      path: "songs",
      populate: [
        { path: "albumID", select: "name" },
        { path: "artistID", select: "name" },
      ],
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    console.log(playlist.songs);

    const songs = playlist.songs.map((song) => ({
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

    const data = {
      id: playlist._id,
      title: playlist.title,
      image: playlist.image,
      user: playlist.user,
      songs: songs,
    };

    return res.status(200).json({
      message: "Playlist fetched successfully",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting playlist by ID",
      error: error.message,
    });
  }
};

export const updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const imageFile = req.file;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const playlist = await Playlist.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.user.toString() !== req.user.id)
      return res
        .status(400)
        .json({ message: "You are not authorized to update this playlist" });

    if (title) playlist.title = title;
    if (imageFile) playlist.image = imageFile.secure_url || imageFile.path;

    await playlist.save();

    return res.status(200).json({
      message: "Playlist updated successfully",
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while updating playlist",
      error: error.message,
    });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const playlist = await Playlist.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.user.toString() !== req.user.id)
      return res
        .status(400)
        .json({ message: "You are not authorized to delete this playlist" });

    await playlist.deleteOne();

    return res.status(200).json({
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting playlist",
      error: error.message,
    });
  }
};

export const deleteSongFromPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const playlist = await Playlist.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "You are not authorized to modify this playlist" });

    const exists = playlist.songs.some((song) => song.toString() === songId);

    if (!exists)
      return res.status(400).json({ message: "Song not found in playlist" });

    playlist.songs = playlist.songs.filter(
      (song) => song.toString() !== songId.toString()
    );

    await playlist.save();

    return res.status(200).json({
      message: "Song deleted from playlist successfully",
      data: playlist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting song from playlist",
      error: error.message,
    });
  }
};
