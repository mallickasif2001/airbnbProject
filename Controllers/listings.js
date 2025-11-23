const Listing = require("../models/listing");
const axios = require("axios");

// 1️⃣ Show All Listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// 2️⃣ Render New Listing Form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// 3️⃣ Show Single Listing
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// 4️⃣ Create New Listing + GeoCoding + GeoJSON
module.exports.createListing = async (req, res) => {
  try {
    const { location } = req.body.listing;

    if (!location) {
      req.flash("error", "Location is required!");
      return res.redirect("/listings/new");
    }

    // PositionStack API with HTTPS and URL encoding
    const geoUrl = `https://api.positionstack.com/v1/forward?access_key=${process.env.MAP_TOKEN}&query=${encodeURIComponent(location)}&output=geojson`;
    const response = await axios.get(geoUrl);

    if (!response.data?.data || response.data.data.length === 0) {
      req.flash("error", "Location not found!");
      return res.redirect("/listings/new");
    }

    const geoData = response.data.data[0];
    const coordinates = geoData.geometry?.coordinates || [0, 0];

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    newListing.geometry = {
      type: "Point",
      coordinates
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error("Create Error:", err.message);
    req.flash("error", "Error creating listing. Check API key or location.");
    res.redirect("/listings/new");
  }
};

// 5️⃣ Render Edit Form
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image?.url || "";
  if (originalImageUrl) originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// 6️⃣ Update Listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// 7️⃣ Delete Listing
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

// 8️⃣ AJAX PositionStack API
module.exports.getCoordinates = async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.json({ error: "Location required" });

    const geoUrl = `https://api.positionstack.com/v1/forward?access_key=${process.env.MAP_TOKEN}&query=${encodeURIComponent(location)}&output=geojson`;
    const response = await axios.get(geoUrl);

    if (!response.data?.data || response.data.data.length === 0) {
      return res.json({ error: "Location not found" });
    }

    const info = response.data.data[0];
    const coords = info.geometry?.coordinates || [0, 0];

    res.json({
      latitude: coords[1],
      longitude: coords[0]
    });
  } catch (err) {
    console.error("Geo API Error:", err.message);
    res.json({ error: "Server error" });
  }
};
