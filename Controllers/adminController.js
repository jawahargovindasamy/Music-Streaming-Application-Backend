import User from "../Models/userModel.js";
import Song from "../Models/songModel.js";
import Stream from "../Models/streamModel.js";
import Artist from "../Models/artistModel.js";

const calculateGrowth = (current, previous) => {
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied for non-admin users" });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();
    const currentMonthUsers = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const previousMonthUsers = await User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } });
    const userGrowth = calculateGrowth(currentMonthUsers, previousMonthUsers);

    const currentMonthStreams = await Stream.countDocuments({ timestamp: { $gte: thisMonth } });
    const previousMonthStreams = await Stream.countDocuments({ timestamp: { $gte: lastMonth, $lt: thisMonth } });
    const streamGrowth = calculateGrowth(currentMonthStreams, previousMonthStreams);

    const currentMonthActiveSongs = await Stream.distinct("song", { timestamp: { $gte: thisMonth } });
    const currentArtistCount = await Song.find({ _id: { $in: currentMonthActiveSongs } }).distinct("artist");
    const previousMonthActiveSongs = await Stream.distinct("song", { timestamp: { $gte: lastMonth, $lt: thisMonth } });
    const previousArtistCount = await Song.find({ _id: { $in: previousMonthActiveSongs } }).distinct("artist");
    const artistGrowth = calculateGrowth(currentArtistCount.length, previousArtistCount.length);

    const topTracks = await Stream.aggregate([
      { $match: { timestamp: { $gte: oneWeekAgo } } },
      { $group: { _id: "$song", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: "$song" },
    ]);

    const topArtists = await Stream.aggregate([
      { $match: { timestamp: { $gte: oneWeekAgo } } },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "songDetails",
        },
      },
      { $unwind: "$songDetails" },
      {
        $group: {
          _id: "$songDetails.artist",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "artists",
          localField: "_id",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
    ]);

    res.status(200).json({
      totalUsers,
      currentMonthUsers,
      userGrowth: userGrowth.toFixed(2),
      currentMonthStreams,
      streamGrowth: streamGrowth.toFixed(2),
      activeArtists: currentArtistCount.length,
      artistGrowth: artistGrowth.toFixed(2),
      topTracks,
      topArtists,
    });
  } catch (err) {
    console.error("Error getting admin dashboard stats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
