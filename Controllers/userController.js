import User from "../Models/userModel.js";
import Artist from "../Models/artistModel.js";
import Song from "../Models/songModel.js";
import Album from "../Models/albumModel.js";
import Stream from "../Models/streamModel.js";

//Admin-only: Get all users
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access Denied: Only admin can access this route" });
    }

    const users = await User.find().select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res
      .status(200)
      .json({ message: "Users fetched successfully", data: users });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting users",
      error: error.message,
    });
  }
};

//Get user by ID (public or authorized)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User fetched successfully", data: user });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting user",
      error: error.message,
    });
  }
};

//Update user (admin or self)
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatePayload = req.body;
    const imageFile = req.file;

    // Find the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow only the user or an admin to update
    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // Check if role is being updated to artist by admin
    const isRoleBeingUpdatedToArtist =
      req.user.role === "admin" &&
      updatePayload.role === "artist" &&
      user.role !== "artist";

    // Set profilePic if a new image is uploaded
    if (imageFile) {
      updatePayload.profilePic = imageFile.path;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
      new: true,
    });

    // If role changed to artist, create artist entry if not exists
    if (isRoleBeingUpdatedToArtist) {
      const existingArtist = await Artist.findOne({ userID: userId });
      if (!existingArtist) {
        await Artist.create({
          userID: userId,
          name: updatedUser.username,
          bio: updatePayload.bio || "This artist hasn't added a bio yet.",
          image: imageFile?.path || "",
        });
      }
    }

    // If already artist, update bio/image
    if (user.role === "artist") {
      const artistUpdate = {};
      if (updatePayload.bio !== undefined) {
        artistUpdate.bio = updatePayload.bio;
      }
      if (imageFile) {
        artistUpdate.image = imageFile.path;
      }

      if (Object.keys(artistUpdate).length > 0) {
        await Artist.findOneAndUpdate({ userID: userId }, artistUpdate);
      }
    }

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error while updating user",
      error: error.message,
    });
  }
};

export const likeSong = async (req, res) => {
  try {
    const userID = req.user.id;
    const { songId } = req.body;

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    const isLiked = user.likedSongs.includes(songId);

    if (isLiked) {
      user.likedSongs = user.likedSongs.filter(
        (id) => id.toString() !== songId.toString()
      );
      song.likes = Math.max(song.likes - 1, 0);
      await user.save();
      await song.save();
      return res.status(200).json({ message: "Song unliked successfully" });
    } else {
      user.likedSongs.push(songId);
      song.likes += 1;
      await user.save();
      await song.save();
      return res.status(200).json({ message: "Song liked successfully" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while liking song",
      error: error.message,
    });
  }
};

export const likeAlbum = async (req, res) => {
  try {
    const userID = req.user.id;
    const { albumId } = req.body;

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });

    const isLiked = user.likedAlbums.includes(albumId);

    if (isLiked) {
      user.likedAlbums = user.likedAlbums.filter(
        (id) => id.toString() !== albumId.toString()
      );
      album.likes = Math.max(album.likes - 1, 0);
      await user.save();
      await album.save();
      return res.status(200).json({ message: "Album unliked successfully" });
    } else {
      user.likedAlbums.push(albumId);
      album.likes += 1;
      await user.save();
      await album.save();
      return res.status(200).json({ message: "Album liked successfully" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while liking album",
      error: error.message,
    });
  }
};

export const getUserLikedSongs = async (req, res) => {
  try {
    const userID = req.user.id;

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    const likedSongs = await Song.find({ _id: { $in: user.likedSongs } })
      .populate("artistID", "name")
      .populate("albumID", "name");

    if (!likedSongs || likedSongs.length === 0) {
      return res
        .status(200)
        .json({ message: "No liked songs found", data: [] });
    }

    const formattedSongs = likedSongs.map((song) => ({
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
    }));

    res.status(200).json({
      message: "Liked songs fetched successfully",
      data: formattedSongs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting liked songs",
      error: error.message,
    });
  }
};

export const getUserLikedAlbums = async (req, res) => {
  try {
    const userID = req.user.id;

    const user = await User.findById(userID);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.likedAlbums || user.likedAlbums.length === 0) {
      return res
        .status(200)
        .json({ message: "No liked albums found", data: [] });
    }

    const albums = await Album.find({ _id: { $in: user.likedAlbums } });

    const formattedAlbums = albums.map((album) => ({
      id: album._id,
      name: album.name,
      desc: album.desc,
      artistID: album.artistID,
      image: album.image,
      releaseDate: album.releaseDate,
      bgColor: album.bgColor,
      likes: album.likes,
    }));

    res.status(200).json({
      message: "Liked albums fetched successfully",
      data: formattedAlbums,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting liked albums",
      error: error.message,
    });
  }
};

export const getUserFollowedArtists = async (req, res) => {
  try {
    const userID = req.user.id;

    const user = await User.findById(userID);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.followedArtists || user.followedArtists.length === 0) {
      return res
        .status(200)
        .json({ message: "No followed artists found", data: [] });
    }

    const artists = await Artist.find({ _id: { $in: user.followedArtists } });

    const formattedArtists = artists.map((artist) => ({
      id: artist._id,
      name: artist.name,
      bio: artist.bio,
      image: artist.image,
    }));

    res.status(200).json({
      message: "Followed artists fetched successfully",
      data: formattedArtists,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting followed artists",
      error: error.message,
    });
  }
};

//Delete user (admin or self)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        message:
          "Access Denied: Only admin or the account owner can delete this user",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while deleting user",
      error: error.message,
    });
  }
};

export const recommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("likedSongs");
    if (!user) return res.status(404).json({ message: "User not found" });

    const likedSongIds = user.likedSongs.map((song) => song._id.toString());
    const likedGenres = user.likedSongs.map((song) => song.genre);
    const likedArtistIDs = user.likedSongs.map((song) =>
      song.artistID.toString()
    );

    const streams = await Stream.find({ user: user._id }).populate("song");

    const genreCount = {};
    const artistCount = {};

    for (const entry of streams) {
      const song = entry.song;
      if (!song) continue;

      if (song.genre)
        genreCount[song.genre] = (genreCount[song.genre] || 0) + 1;

      const artistId = song.artistID.toString();
      artistCount[artistId] = (artistCount[artistId] || 0) + 1;
    }

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);

    const topArtistIDs = Object.entries(artistCount)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, 3);

    const recommendedSongs = await Song.find({
      _id: { $nin: likedSongIds },
      $or: [
        { genre: { $in: [...likedGenres, ...topGenres] } },
        { artistID: { $in: [...likedArtistIDs, ...topArtistIDs] } },
      ],
    })
      .limit(12)
      .sort({ views: -1, releaseDate: -1 });

    const formattedSongs = recommendedSongs.map((song) => ({
      id: song._id,
      name: song.name,
      desc: song.desc,
      albumID: song.albumID?._id,
      artistID: song.artistID?._id,
      genre: song.genre,
      duration: song.duration,
      image: song.image,
      audio: song.audio,
      likes: song.likes,
      views: song.views,
      releaseDate: song.releaseDate,
    }));

    res.status(200).json({
      message: "Recommendations fetched successfully",
      topGenres: [...new Set([...likedGenres, ...topGenres])],
      formattedSongs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error while getting recommendations",
      error: error.message,
    });
  }
};

export const search = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i");

    const artists = await Artist.find({ name: regex });

    const artistIds = artists.map((a) => a._id);

    const albums = await Album.find({
      $or: [{ name: regex }, { artistID: { $in: artistIds } }],
    })
      .populate("artistID", "name")
      .sort({ views: -1 });

    const albumIds = albums.map((a) => a._id);

    const songs = await Song.find({
      $or: [
        { name: regex },
        { genre: regex },
        { artistID: { $in: artistIds } },
        { albumID: { $in: albumIds } },
      ],
    })
      .populate("artistID", "name")
      .populate("albumID", "name")
      .sort({ views: -1 });

    res.status(200).json({
      message: "Search results fetched successfully",
      artists,
      albums,
      songs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error during search",
      error: error.message,
    });
  }
};
