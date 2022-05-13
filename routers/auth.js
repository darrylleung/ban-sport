const express = require("express");
const router = express.Router();
const db = require("../db");
const { compare, hash } = require("../bc");
const { requireLoggedOutUser, requireLoggedInUser } = require("../middleware");

router.get("/home", (req, res) => {
    res.render("home", {
        title: "Ban Sport 🙅🏻⚽️",
    });
});

router.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        title: "Register",
    });
});

router.post("/register", requireLoggedOutUser, (req, res) => {
    const {
        firstname,
        lastname,
        email,
        password,
        password2,
        resetchoice,
        resetsecret,
    } = req.body;

    if (password != password2) {
        res.render("register", {
            title: "Register",
            err: "Passwords did not match. Please try again. 🥀",
        });
    } else if (password == null || password == "") {
        res.render("register", {
            title: "Register",
            err: "Form incomplete. 📄✍🏻",
        });
    } else {
        hash(password)
            .then((hashedPassword) => {
                db.registerNewUser(
                    firstname,
                    lastname,
                    email,
                    hashedPassword,
                    resetchoice,
                    resetsecret
                )
                    .then((result) => {
                        req.session.userId = result.rows[0].id;
                        res.redirect("/register/secret");
                    })
                    .catch((err) => {
                        console.log("err: ", err);
                        res.render("register", {
                            title: "Register",
                            err: "Form incomplete. 📄✍🏻",
                        });
                    });
            })
            .catch((err) => {
                console.log("error hashing user password: ", err);
                res.render("register", {
                    title: "Register",
                    err: "Oops. Something broke. 💔",
                });
            });
    }
});

router.get("/register/secret", requireLoggedInUser, (req, res) => {
    res.render("resetsecret", {
        title: "Your Secret",
    });
});

router.post("/register/secret", requireLoggedInUser, (req, res) => {
    const user_id = req.session.userId;
    const { resetchoice, resetsecret } = req.body;
    console.log("resetsecret: ", resetsecret);
    if (resetsecret == null || resetsecret == "") {
        res.render("resetsecret", {
            title: "Your Secret",
            err: "Form incomplete. 📄✍🏻",
        });
    }
    hash(resetsecret)
        .then((hashedSecret) => {
            db.setResetSecret(resetchoice, hashedSecret, user_id)
                .then((result) => {
                    console.log(result.rows[0]);
                    res.redirect("/register/profile");
                })
                .catch((err) => {
                    console.log("err: ", err);
                    res.render("resetsecret", {
                        err: "Oops. Something broke. 💔",
                    });
                });
        })
        .catch((err) => {
            console.log("error hashing reset response: ", err);
            res.render("register", {
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        title: "Login",
    });
});

router.post("/login", requireLoggedOutUser, (req, res) => {
    const { email, password } = req.body;
    db.login(email)
        .then((result) => {
            console.log(result);
            let hashedPassword = result.rows[0].password;
            let user_id = result.rows[0].id;
            let sig = result.rows[0].sig;
            compare(password, hashedPassword)
                .then((match) => {
                    console.log(
                        "Does the password match the one stored: ",
                        match
                    );

                    if (match) {
                        req.session.userId = user_id;
                        if (sig != null) {
                            res.redirect("/profile");
                        } else {
                            res.redirect("/register/petition");
                        }
                    } else {
                        res.render("login", {
                            err: "Wrong password! 🚔",
                        });
                    }
                })
                .catch((err) => {
                    console.log("error comparing hash with password", err);
                    res.render("login", {
                        err: "Oops. Something broke. 💔",
                    });
                });
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("login", {
                err: "Oops. Something broke. 💔",
            });
        });
});

router.get("/profile/verify-email", (req, res) => {
    res.render("verifyemail", {
        title: "Confirm your email address",
        step1: "Step 1",
    });
});

router.post("/profile/verify-email", (req, res) => {
    const { email } = req.body;
    db.verifyEmail(email)
        .then((result) => {
            let resetChoice = result.rows[0].resetchoice;
            let hashedSecret = result.rows[0].resetsecret;
            let userEmail = result.rows[0].email;
            req.session.resetChoice = resetChoice;
            req.session.hashedSecret = hashedSecret;
            req.session.email = userEmail;
            res.redirect("/profile/answer-secret");
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("verifyemail", {
                title: "Confirm your email address",
                err: "Email not found. 🚔",
            });
        });
});

module.exports = router;
