module.exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId && req.url != "/profile") {
        return res.redirect("/profile");
    }
    next();
};

module.exports.requireLoggedInUser = (req, res, next) => {
    if (
        !req.session.userId &&
        req.url != "/register" &&
        req.url != "/login" &&
        req.url != "/home"
    ) {
        return res.redirect("/home");
    }
    next();
};

// module.exports.hasSignature = (req, res, next) => {
//     if (req.session.sigId) {
//         return res.redirect("/profile");
//     }
//     next();
// };

// module.exports.requireSignature = (req, res, next) => {
//     if (!req.session.sigId) {
//         return res.redirect("/petition");
//     }
//     next();
// };
