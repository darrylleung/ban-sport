const express = require("express");
const router = express.Router();
const db = require("../db");
const { compare, hash } = require("../bc");

router.get("/register/profile", (req, res) => {
    res.render("newprofile", {
        title: "Create a new profile",
    });
});

router.post("/register/profile", (req, res) => {
    let { age, city, url } = req.body;
    const user_id = req.session.userId;

    if (!url) {
        url = null;
        return res.redirect("/register/petition");
    }

    if (!url.startsWith("http" || "https")) {
        url = "https://" + url;
        console.log("new url: ", url);
    }

    db.userProfile(age, city, url, user_id)
        .then((result) => {
            console.log(result);
            res.redirect("/register/petition");
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("newprofile", {
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/register/petition", (req, res) => {
    if (req.session.noSig) {
        res.render("petition", {
            title: "Complete petition",
            err: "Complete your profile by signing the petition. 📄✍🏻",
        });
        req.session.noSig = null;
    } else {
        res.render("petition", {
            title: "Sign petition",
        });
    }
});

router.post("/register/petition", (req, res) => {
    const { sig } = req.body;
    const user_id = req.session.userId;
    console.log("sig: ", sig);
    db.signPetition(user_id, sig)
        .then(() => {
            req.session.thanks = "thank you!";
            res.redirect("/profile");
        })
        .catch((err) => {
            console.log(err);
            res.render("petition", {
                err: "Complete your profile by signing the petition. 📄✍🏻",
            });
        });
});

router.get("/profile", (req, res) => {
    const user_id = req.session.userId;
    if (req.session.thanks) {
        db.getSignature(user_id)
            .then((result) => {
                let sig = result.rows[0].sig;
                res.render("profile", {
                    title: "Profile",
                    sigUrl: sig,
                });
                req.session.thanks = null;
            })
            .catch((err) => {
                console.log("err: ", err);
                res.render("login", {
                    title: "Log in",
                    err: "Oops. Something broke. 💔",
                });
            });
    } else {
        db.getSignature(user_id)
            .then((result) => {
                let sig = result.rows[0].sig;
                res.render("profile", {
                    title: "Profile",
                    sigUrl: sig,
                });
            })
            .catch((err) => {
                console.log("err: ", err);
                req.session.noSig =
                    "Please complete your profile by signing the petition.";
                res.redirect("/register/petition");
            });
    }
});

// router.post("/profile", (req, res) => {
//     req.session = null;
//     res.redirect("/home");
// });

router.get("/profile/verify-password", (req, res) => {
    res.render("verifypassword");
});

router.post("/profile/verify-password", (req, res) => {
    const { password } = req.body;
    const user_id = req.session.userId;
    const destination = req.session.destination;
    db.verifyPassword(user_id)
        .then((result) => {
            let hashedPassword = result.rows[0].password;
            console.log("inputted password: ", password);
            compare(password, hashedPassword).then((match) => {
                console.log("Password verified: ", match);
                if (match) {
                    req.session.verified = "verified";
                    res.redirect(destination);
                    req.session.destination = null;
                    console.log(req.session.destination);
                } else {
                    res.render("verifypassword", {
                        err: "Could not verify. 🚔",
                    });
                }
            });
        })
        .catch((err) => {
            console.log("error: ", err);
            res.render("verifypassword", {
                err: "Could not verify. 🚔",
            });
        });
});

router.get("/profile/edit", (req, res) => {
    const user_id = req.session.userId;
    console.log("user_id: ", user_id);
    if (!req.session.verified) {
        req.session.destination = "/profile/edit";
        res.redirect("/profile/verify-password");
    } else {
        db.fillProfile(user_id)
            .then((result) => {
                console.log(result);
                const { firstname, lastname, email, age, city, homepage } =
                    result.rows[0];
                res.render("editprofile", {
                    title: "Edit profile",
                    firstname,
                    lastname,
                    email,
                    age,
                    city,
                    homepage,
                });
            })
            .catch((err) => {
                console.log("error: ", err);
                res.render("editprofile", {
                    title: "Edit profile",
                    err: "Oops. Something broke. 💔",
                });
            });
    }
});

router.post("/profile/edit", (req, res) => {
    let { firstname, lastname, email, password, age, city, homepage } =
        req.body;
    const user_id = req.session.userId;

    if (age == "") {
        age = null;
    }

    if (password.length === 0) {
        Promise.all([
            db.updateUser1(firstname, lastname, email, user_id),
            db.updateUserProfile(age, city, homepage, user_id),
        ])
            .then(() => {
                req.session.verified = null;
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("err: ", err);
                res.render("editprofile", {
                    title: "Edit profile",
                    err: "Oops. Something broke. 💔",
                });
            });
    } else {
        hash(password)
            .then((hashedPassword) => {
                Promise.all([
                    db.updateUser2(
                        firstname,
                        lastname,
                        email,
                        hashedPassword,
                        user_id
                    ),
                    db.updateUserProfile(age, city, homepage, user_id),
                ])
                    .then(() => {
                        req.session.verified = null;
                        res.redirect("/profile");
                    })
                    .catch((err) => {
                        console.log("err: ", err);
                        res.render("editprofile", {
                            title: "Edit profile",
                            err: "Oops. Something broke. 💔",
                        });
                    });
            })
            .catch((err) => {
                console.log("err: ", err);
                res.render("editprofile", {
                    title: "Edit profile",
                    err: "Oops. Something broke. 💔",
                });
            });
    }
});

router.get("/profile/delete", (req, res) => {
    if (!req.session.verified) {
        req.session.destination = "/profile/delete";
        res.redirect("/profile/verify-password");
    } else {
        res.render("deleteprofile", {
            title: "Delete profile",
        });
    }
});

router.post("/profile/delete", (req, res) => {
    const user_id = req.session.userId;

    db.deleteProfile(user_id)
        .then(() => {
            req.session = null;
            res.redirect("/home");
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("deleteprofile", {
                title: "Delete profile",
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/profile/answer-secret", (req, res) => {
    let resetChoice = req.session.resetChoice;
    res.render("answersecret", {
        title: "Answer secret",
        resetChoice,
    });
});

router.post("/profile/answer-secret", (req, res) => {
    let hashedSecret = req.session.hashedSecret;
    let resetChoice = req.session.resetChoice;
    const { resetsecret } = req.body;
    console.log("resetsecret: ", resetsecret);
    console.log("hashedSecret: ", hashedSecret);
    compare(resetsecret, hashedSecret)
        .then((match) => {
            if (match) {
                res.redirect("/profile/reset-password");
            } else {
                res.render("answersecret", {
                    title: "Answer secret",
                    resetChoice,
                    err: "Could not verify. 🚔",
                });
            }
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("answersecret", {
                title: "Answer secret",
                err: "Wrong answer. 🚔",
                resetChoice,
            });
        });
});

router.get("/profile/reset-password", (req, res) => {
    res.render("resetpassword", {
        title: "Reset password",
    });
});

router.post("/profile/reset-password", (req, res) => {
    let userEmail = req.session.email;
    const { password, password2 } = req.body;

    if (password != password2) {
        res.render("resetpassword", {
            title: "Reset password",
            err: "Passwords did not match. 🥀",
        });
    } else {
        hash(password)
            .then((hashedPassword) => {
                db.resetPassword(userEmail, hashedPassword)
                    .then(() => {
                        req.session = null;
                        res.redirect("/login");
                    })
                    .catch((err) => {
                        console.log("err: ", err);
                        res.render("resetpassword", {
                            title: "Reset password",
                            err: "Oops. Something broke. 💔",
                        });
                    });
            })
            .catch((err) => {
                console.log("err: ", err);
                res.render("resetpassword", {
                    title: "Reset password",
                    err: "Oops. Something broke. 💔",
                });
            });
    }
});

router.get("/profile/signers", (req, res) => {
    db.getSigners()
        .then((result) => {
            const signers = result.rows;
            res.render("signatures", {
                title: "Signers",
                signers,
            });
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("signatures", {
                title: "Signers",
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/profile/signers/:city", (req, res) => {
    const { city } = req.params;
    db.getSignersByCity(city)
        .then((result) => {
            const signers = result.rows;
            res.render("signaturesbycity", {
                title: "Signers",
                signers,
                city,
            });
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("signatures", {
                title: "Signers",
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/home");
});

module.exports = router;
