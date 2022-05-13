const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const { requireLoggedInUser } = require("./middleware");

//routers
const authRouter = require("./routers/auth");
const profileRouter = require("./routers/profile");

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("./public"));

app.use((req, res, next) => {
    console.log("req.url: ", req.url);
    return next();
});

app.use((req, res, next) => {
    res.set("x-frame-options", "deny");
    next();
});

//setting sessionSecret for Heroku
let sessionSecret;
if (process.env.NODE_ENV == "production") {
    sessionSecret = process.env.SESSION_SECRET;
} else {
    sessionSecret = require("./secrets.json").SESSION_SECRET;
}

app.use(
    cookieSession({
        secret: sessionSecret,
        maxAge: 1000 * 60 * 60 * 24 * 14, //maxAge in milliseconds
        sameSite: true,
    })
);

app.locals.helpers = {
    capitalize(str) {
        if (!str) {
            return;
        } else {
            return str.toUpperCase();
        }
    },
};

app.get("/", (req, res) => {
    res.redirect("/home");
});

app.use("/", authRouter);
app.use("/", requireLoggedInUser, profileRouter);

//404
app.use(function (req, res, next) {
    res.status(404);

    res.format({
        html: function () {
            res.render("404", { url: req.url });
        },
        json: function () {
            res.json({ error: "Page not found" });
        },
        default: function () {
            res.type("txt").send("Page not found");
        },
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("I'm listening.");
});
