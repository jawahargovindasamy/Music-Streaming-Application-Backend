import Album from "../Models/albumModel.js";
import Artist from "../Models/artistModel.js";
import Song from "../Models/songModel.js";
import User from "../Models/userModel.js";

export const uploadAlbum = async (req, res) => {
  try {
    const { name, desc, bgColor, releaseDate } = req.body;
    const imageFile = req.file;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "artist") {
      return res.status(400).json({ message: "User is not an artist" });
    }

    const artist = await Artist.findOne({ userID: user._id });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    if (!name || !desc || !releaseDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const album = new Album({
      name,
      desc,
      artistID: artist._id,
      image: imageFile.secure_url || imageFile.path,
      releaseDate: new Date(releaseDate),
      bgColor,
    });

    await album.save();

    res.status(200).json({
      message: "Album uploaded successfully",
      data: album,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while uploading album",
      error: error.message,
    });
  }
};

export const getAllAlbum = async (req, res) => {
  try {
    const allAlbums = await Album.find({}).sort({ likes: -1 });

    const allSongs = await Song.find({});

    const albums = allAlbums.map((album) => {
      const songs = allSongs
        .filter((song) => String(song.albumID) === String(album._id))
        .map((song, songIndex) => ({
          id: songIndex + 1,
          name: song.name,
          desc: song.desc,
          genre: song.genre,
          duration: song.duration,
          albumID: song.albumID,
        }));

      return {
        id: album._id,
        name: album.name,
        desc: album.desc,
        artistID: album.artistID,
        image: album.image,
        releaseDate: album.releaseDate,
        bgColor: album.bgColor,
        likes: album.likes,
        songs,
      };
    });

    res
      .status(200)
      .json({ message: "Albums fetched successfully", data: albums });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    const songs = await Song.find({ albumID: id });

    const artist = await Artist.findById(album.artistID);

    const songList = songs.map((song) => ({
      id: song._id,
      name: song.name,
      desc: song.desc,
      genre: song.genre,
      duration: song.duration,
      albumID: song.albumID,
      audio: song.audio,
      image: song.image,
      releaseDate: song.releaseDate,
      artistID: song.artistID,
      artistName: artist.name,
      likes: song.likes,
      views: song.views,
    }));

    const response = {
      id: album._id,
      name: album.name,
      desc: album.desc,
      artistID: album.artistID,
      artistName: artist.name,
      image: album.image,
      releaseDate: album.releaseDate,
      bgColor: album.bgColor,
      songs: songList,
    };

    res
      .status(200)
      .json({ message: "Album fetched successfully", data: response });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting album",
      error: error.message,
    });
  }
};

export const updateAlbumById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, desc, bgColor, releaseDate } = req.body;
    const imageFile = req.file;
    const userId = req.user.id;
    // console.log(userId);

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "artist") {
      return res.status(400).json({ message: "User is not an artist" });
    }

    const artist = await Artist.findOne({ userID: user._id });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Validate album

    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    console.log(album.artistID, artist._id);

    if (album.artistID.toString() !== artist._id.toString()) {
      return res
        .status(400)
        .json({ message: "You are not authorized to update this album" });
    }

    if (name) {
      album.name = name;
    }
    if (desc) {
      album.desc = desc;
    }
    if (bgColor) {
      album.bgColor = bgColor;
    }
    if (releaseDate) {
      album.releaseDate = new Date(releaseDate);
    }
    if (imageFile) {
      album.image = imageFile.path;
    }

    await album.save();

    res
      .status(200)
      .json({ message: "Album updated successfully", data: album });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while updating album",
      error: error.message,
    });
  }
};

export const getAlbumByArtistId = async (req, res) => {
  try {
    const { id } = req.params;
    const allAlbums = await Album.find({ artistID: id }).sort({ _id: -1 });

    const allSongs = await Song.find({});

    const album = allAlbums.map((album) => {
      const songs = allSongs
        .filter((song) => String(song.albumID) === String(album._id))
        .map((song, songIndex) => ({
          id: song._id,
          name: song.name,
          desc: song.desc,
          genre: song.genre,
          duration: song.duration,
          albumID: song.albumID,
          audio: song.audio,
        }));

      return {
        id: album._id,
        name: album.name,
        desc: album.desc,
        artistID: album.artistID,
        image: album.image,
        releaseDate: album.releaseDate,
        bgColor: album.bgColor,
        songs,
      };
    });

    res
      .status(200)
      .json({ message: "Albums fetched successfully", data: album });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting album by artist ID",
      error: error.message,
    });
  }
};

export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    await albumModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting album",
      error: error.message,
    });
  }
};
