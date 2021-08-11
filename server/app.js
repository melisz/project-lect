/**
 * Server application - contains all server config and api endpoints
 *
 */
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const db = require("./utils/databaseHelper");
// const cryptoHelper = require("./utils/cryptoHelper");
const corsConfig = require("./utils/corsConfigHelper");
const app = express();
//const fileUpload = require("express-fileupload");//

//logger lib  - 'short' is basic logging info
app.use(morgan("short"));

//init mysql connectionpool
const connectionPool = db.init();

//parsing request bodies from json to javascript objects
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//CORS config - Cross Origin Requests
app.use(corsConfig);

//File uploads
//app.use(fileUpload());//

// ------ ROUTES - add all api endpoints here ------
const httpOkCode = 200;
const badRequestCode = 400;
const authorizationErrCode = 401;

app.post("/user/login", (req, res) => {
    const username = req.body.username;

    //TODO: We shouldn't save a password unencrypted!! Improve this by using cryptoHelper :)
    const password = req.body.password;

    db.handleQuery(connectionPool, {
        query: "SELECT name, id FROM user WHERE username = ? AND password = ?",
        values: [username, password]
    }, (data) => {
        if (data.length === 1) {
            //return just the username for now, never send password back!
            res.status(httpOkCode).json({"username": data[0].name, "id": data[0].id});
        } else {
            //wrong username
            res.status(authorizationErrCode).json({reason: "Inloggegevens onjuist."});
        }

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/user/getBalance", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT balance FROM user WHERE id = ?",
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data[0].balance);
    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/user/updateBalance", (req, res) => {

    db.handleQuery(connectionPool, {
        query: "UPDATE user SET balance = balance + ? WHERE id = ?",
        values: [req.body.points, req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}));
});


app.post("/user/setSelectedCursor", (req, res) => {

    db.handleQuery(connectionPool, {
        query: "UPDATE user SET selected_cursor = ? WHERE id = ?",
        values: [req.body.cursorId, req.body.userId]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/user/getSelectedCursor", (req, res) => {

    db.handleQuery(connectionPool, {
        query: "SELECT selected_cursor FROM user WHERE id = ?",
        values: [req.body.userId]
    }, (data) => {
        res.status(httpOkCode).json(data[0].selected_cursor);
    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/docent/login", (req, res) => {
    const username = req.body.username;

    //TODO: We shouldn't save a password unencrypted!! Improve this by using cryptoHelper :)
    const password = req.body.password;

    db.handleQuery(connectionPool, {
        query: "SELECT username, id FROM docent WHERE username = ? AND password = ?",
        values: [username, password]
    }, (data) => {
        if (data.length === 1) {
            //return just the username for now, never send password back!
            res.status(httpOkCode).json({"username": data[0].username, "id": data[0].id});
        } else {
            //wrong username
            res.status(authorizationErrCode).json({reason: "Inloggegevens onjuist."});
        }

    }, (err) => res.status(badRequestCode).json({reason: err}));
});


//dummy data example - rooms
app.post("/room_example", (req, res) => {

    db.handleQuery(connectionPool, {
            query: "SELECT id, surface FROM room_example WHERE id = ?",
            values: [req.body.id]
        }, (data) => {
            //just give all data back as json
            res.status(httpOkCode).json(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );

});

// -----   Get the diagraminformation in desc order-------//
app.get("/diagram/all", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT * FROM diagram ORDER BY id desc"
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.get("/diagram/getTotal", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT COUNT(*) AS totalCount FROM diagram "
    }, (data) => {
        res.status(httpOkCode).json(data[0].totalCount);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/withId", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT * FROM diagram WHERE id = ?",
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/withCreator", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT * FROM diagram WHERE creator = ?",
        values: [req.body.creator]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})



app.post("/diagram/search", (req, res) => {
    const sql = `SELECT * FROM diagram WHERE name LIKE '%${req.body.term}%'`

    db.handleQuery(connectionPool, {
        query: sql
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/setProgress", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "INSERT INTO progress (user_id, diagram_id) VALUES (?, ?)",
        values: [req.body.user, req.body.diagram]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/getProgress", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT COUNT(*) AS completed FROM progress WHERE user_id = ? AND diagram_id = ?",
        values: [req.body.user, req.body.diagram]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.post("/diagram/getProgressList", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT name,
                       IF(EXISTS(SELECT * FROM progress WHERE diagram_id = d.id AND user_id = ?),
                          "<strong class='text-success'>✓</strong>", "-") AS completed
                FROM diagram d
                ORDER BY completed DESC;`,
        values: [req.body.user]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/getAllProgress", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT diagram_id AS completed_diagram FROM progress WHERE user_id = ?",
        values: [req.body.user]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagram/getProgressForDiagram", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT user.name,
                       (SELECT EXISTS(SELECT * from progress where user_id = user.id and diagram_id = ?)) as completed
                FROM user
                         LEFT JOIN progress p on user.id = p.user_id
                WHERE class_id = ?
                GROUP BY user.name ORDER BY user.name;`,
        values: [req.body.diagram, req.body.class]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/shop/getBoughtCursors", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT cursor_id FROM `order` WHERE user_id = ?",
        values: [req.body.userId]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/shop/getAllCursors", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT * FROM `cursor`"
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/shop/buyCursor", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "INSERT INTO `order` (user_id, cursor_id) VALUES (?, ?)",
        values: [req.body.user, req.body.cursor]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.post("/shop/getCursorPrice", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT price FROM `cursor` WHERE id =  ?",
        values: req.body.cursorId
    }, (data) => {
        res.status(httpOkCode).json(data[0].price);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.post("/diagramManagement/addDiagram", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `INSERT INTO \`diagram\` (\`creator\`, \`name\`, \`node_structure\`, \`answers\`,
                                         \`descriptions\`, \`explanation\`)
                VALUES (?, ?, ?, ?, ?, ?)`,
        values: [req.body.creator, req.body.name, req.body.structure, req.body.answers,
            req.body.descriptions, req.body.explanation]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/diagramManagement/deleteDiagram", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM `diagram` WHERE `diagram`.`id` = ? ",
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getLimit", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT number_of_classes FROM docent WHERE id = ?",
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data[0].number_of_classes);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getClasses", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT class.id, class.name, COUNT(username) AS 'numberOfStudents'
                FROM class
                         LEFT JOIN user ON user.class_id = class.id
                WHERE docent_id = ?
                GROUP BY class.name
                ORDER BY class.name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getCountClasses", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT COUNT(*) as count FROM class WHERE docent_id = ?`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data[0].count);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})



app.post("/administration/getClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT class.id, class.name, COUNT(username) AS 'numberOfStudents'
                FROM class
                         LEFT JOIN user ON user.class_id = class.id
                WHERE class.id = ?
                GROUP BY class.name
                ORDER BY class.name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data[0]);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getStudentInfo", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT id, name, username, password
                FROM user
                WHERE class_id = ?
                ORDER BY name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getStudentProgress", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT user.id, user.name, COUNT(user_id) as progress
                FROM user
                         LEFT JOIN progress p
                                   ON p.user_id = user.id
                WHERE class_id = ?
                GROUP BY user.name
                ORDER BY user.name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/addStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `INSERT INTO user (name, username, password, class_id)
                VALUES (?, ?, ?, ?);`,
        values: [req.body.name, req.body.username, req.body.password, req.body.class]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/editStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `UPDATE user
                SET name     = ?,
                    username = ?,
                    password = ?
                WHERE id = ?`,
        values: [req.body.name, req.body.username, req.body.password, req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.post("/administration/deleteStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `DELETE
                FROM user
                WHERE id = ?`,
        values: [req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/moveStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `UPDATE user
                SET class_id = ?
                WHERE id = ?`,
        values: [req.body.class, req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/checkUsername", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT COUNT(*) AS usernameCount
                FROM user
                WHERE username = ?`,
        values: [req.body.username]
    }, (data) => {
        console.log(data[0].usernameCount)
        if (data[0].usernameCount) {
            res.status(httpOkCode).json(true);
        } else {
            res.status(httpOkCode).json(false);
        }
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/addClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "CALL add_class(?, ?)",
        values: [req.body.name, req.body.docent]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/deleteClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM class WHERE name = ? AND docent_id = ?",
        values: [req.body.name, req.body.docent]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/deleteClassById", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM class WHERE id = ?",
        values: [req.body.class]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/editName", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "UPDATE class SET name = ? WHERE id = ?",
        values: [req.body.name, req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/upload", function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(badRequestCode).json({reason: "No files were uploaded."});
    }
})


app.post("/administration/getClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT class.id, class.name, COUNT(username) AS 'numberOfStudents'
                FROM class
                         LEFT JOIN user ON user.class_id = class.id
                WHERE class.id = ?
                GROUP BY class.name
                ORDER BY class.name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data[0]);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getStudentInfo", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT id, name, username, password
                FROM user
                WHERE class_id = ?
                ORDER BY name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/getStudentProgress", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT user.id, user.name, COUNT(user_id) as progress
                FROM user
                         LEFT JOIN progress p
                                   ON p.user_id = user.id
                WHERE class_id = ?
                GROUP BY user.name
                ORDER BY user.name`,
        values: [req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/addStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `INSERT INTO user (name, username, password, class_id)
                VALUES (?, ?, ?, ?);`,
        values: [req.body.name, req.body.username, req.body.password, req.body.class]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/editStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `UPDATE user
                SET name     = ?,
                    username = ?,
                    password = ?
                WHERE id = ?`,
        values: [req.body.name, req.body.username, req.body.password, req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})


app.post("/administration/deleteStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `DELETE
                FROM user
                WHERE id = ?`,
        values: [req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/moveStudent", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `UPDATE user
                SET class_id = ?
                WHERE id = ?`,
        values: [req.body.class, req.body.student]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/checkUsername", (req, res) => {
    db.handleQuery(connectionPool, {
        query: `SELECT COUNT(*) AS usernameCount
                FROM user
                WHERE username = ?`,
        values: [req.body.username]
    }, (data) => {
        console.log(data[0].usernameCount)
        if (data[0].usernameCount) {
            res.status(httpOkCode).json(true);
        } else {
            res.status(httpOkCode).json(false);
        }
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/addClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "CALL add_class(?, ?)",
        values: [req.body.name, req.body.docent]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/deleteClass", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM class WHERE name = ? AND docent_id = ?",
        values: [req.body.name, req.body.docent]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/deleteClassById", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM class WHERE id = ?",
        values: [req.body.class]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

app.post("/administration/editName", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "UPDATE class SET name = ? WHERE id = ?",
        values: [req.body.name, req.body.id]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))

})

//------- END ROUTES -------

module.exports = app;

