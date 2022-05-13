const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

exports.registerNewUser = (
    firstname,
    lastname,
    email,
    hashedPassword,
    resetchoice,
    resetsecret
) => {
    return db.query(
        `INSERT INTO users
        (firstname, lastname, email, password, resetchoice, resetsecret)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [firstname, lastname, email, hashedPassword, resetchoice, resetsecret]
    );
};

exports.setResetSecret = (resetchoice, hashedSecret, user_id) => {
    return db.query(
        `UPDATE users SET
        resetchoice = $1, resetsecret = $2 WHERE id = $3`,
        [resetchoice, hashedSecret, user_id]
    );
};

exports.verifyEmail = (email) => {
    return db.query(
        `SELECT resetchoice, resetsecret, email FROM users WHERE email = $1`,
        [email]
    );
};

exports.resetPassword = (userEmail, hashedPassword) => {
    return db.query(`UPDATE users SET password = $2 WHERE email = $1`, [
        userEmail,
        hashedPassword,
    ]);
};

exports.userProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles
        (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)`,
        [age, city, url, user_id]
    );
};

// exports.login = (email) => {
//     return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
// };

exports.login = (email) => {
    return db.query(
        `SELECT users.password AS password, users.id AS ID, signatures.sig FROM users FULL JOIN signatures ON users.id = signatures.user_id WHERE email = $1`,
        [email]
    );
};

exports.signPetition = (user_id, sig) => {
    return db.query(
        `INSERT INTO signatures
        (user_id, sig)
        VALUES ($1, $2)
        RETURNING id`,
        [user_id, sig]
    );
};

exports.getSigners = () => {
    return db.query(`SELECT users.firstname AS firstname, users.lastname AS lastname, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS homepage
    FROM users
    FULL JOIN user_profiles
    ON users.id = user_profiles.user_id`);
};

// FULL JOIN signatures
// ON users.id = signatures.user_id

exports.getSignature = (id) => {
    return db.query(`SELECT sig FROM signatures WHERE user_id = $1`, [id]);
};

exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT users.firstname AS firstname, users.lastname AS lastname, user_profiles.city AS city
    FROM users
    FULL JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`,
        [city]
    );
};

exports.fillProfile = (id) => {
    return db.query(
        `SELECT users.firstname AS firstname, users.lastname AS lastname,
    users.email AS email, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS homepage
    FROM users
    FULL JOIN user_profiles
    ON users.id = user_profiles.user_id
    FULL JOIN signatures
    ON users.id = signatures.user_id
    WHERE signatures.user_id = ($1)`,
        [id]
    );
};

exports.verifyPassword = (id) => {
    return db.query(`SELECT password FROM users WHERE id = $1`, [id]);
};

exports.updateUser1 = (firstname, lastname, email, id) => {
    return db.query(
        `UPDATE users SET firstname = $1, lastname = $2, email = $3 WHERE id = $4`,
        [firstname, lastname, email, id]
    );
};

exports.updateUser2 = (firstname, lastname, email, password, id) => {
    return db.query(
        `UPDATE users SET firstname = $1, lastname = $2, email = $3, password = $4 WHERE id = $5`,
        [firstname, lastname, email, password, id]
    );
};

exports.updateUserProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, user_id]
    );
};

exports.deleteProfile = (id) => {
    return db.query(`DELETE FROM users WHERE id = $1`, [id]);
};
