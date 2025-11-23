const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./Utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");


// ---------------------- LOGIN CHECK ----------------------
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in first");
        return res.redirect("/login");
    }
    next();
};


// ---------------------- SAVE REDIRECT URL ----------------------
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};


// ---------------------- OWNER CHECK ----------------------
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};


// ---------------------- LISTING VALIDATION ----------------------
module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, msg);
    }
    next();
};


// ---------------------- REVIEW VALIDATION ----------------------
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, msg);
    }
    next();
};


// ---------------------- REVIEW AUTHOR CHECK ----------------------
module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);

    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
