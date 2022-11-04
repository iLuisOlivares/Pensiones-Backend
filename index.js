const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "Meraki",
    database: "pensiones"
});


//CLient
app.post('/register', (req, res) => {

    const nombre = req.body.nombre;
    const celular = req.body.celular;
    const correo = req.body.correo;
    const contra = req.body.contra;

    db.query("INSERT INTO Usuarios ( Nombre, Celular, Correo, Contra) VALUES (?,?,?,?)",
        [nombre, celular, correo, contra],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
        });
})

app.post('/login', (req, res) => {

    const correo = req.body.correo;
    const contra = req.body.contra;

    db.query("SELECT * FROM Usuarios WHERE Correo = ? AND Contra = ?",
        [correo, contra],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "User Not Found"
                });
            }

        });
})

app.get('/propiedades', (req, res) => {

    db.query("select Inmueble.*, Usuarios.Nombre, Usuarios.Celular from Inmueble inner join Usuarios on Inmueble.Usuario_id = Usuarios.Id",
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "Not Found"
                });
            }

        });
});

app.get('/notificaciones', (req, res) => {


    db.query("SELECT * FROM Notificaciones",
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "Not Found"
                });
            }

        });
});

app.get('/favoritos/:id', (req, res) => {

    const usuarioId = req.params.id;
    db.query("SELECT  Favoritos.*,  Inmueble.* FROM Favoritos left join Inmueble on  Favoritos.Inmueble_id = Inmueble.Id where Favoritos.Usuario_id = ?",
        [usuarioId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No tiene favoritos"
                });
            }

        });
});
app.get('/propiedades/:id', (req, res) => {

    const usuarioId = req.params.id;
    db.query("SELECT  * FROM Inmueble where Usuario_id = ?",
        [usuarioId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No tiene Pensiones"
                });
            }

        });
});


app.post('/agregar/pension', (req, res) => {

    const titulo = req.body.titulo;
    const barrio = req.body.barrio;
    const imagen = req.body.imagen;
    const descripcion = req.body.descripcion;
    const habitaciones = req.body.habitaciones;
    const direccion = req.body.direccion;
    const usuarioId = req.body.usuarioId;

    db.query("INSERT INTO Inmueble ( titulo, barrio, imagen, descripcion, habitaciones, direccion, usuario_id) VALUES (?,?,?,?,?,?,?)",
        [titulo, barrio, imagen, descripcion, habitaciones, direccion, usuarioId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            res.send({
                message: "Agregada nueva pension"
            });
        });

});

app.get('/perfil/:id', (req, res) => {

    const usuarioId = req.params.id;

    db.query("SELECT * FROM Usuarios where id = ?",
        [usuarioId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send({
                    user: result
                }
                );
            } else {
                res.send({
                    message: "Usuario no encontrado"
                });
            }
        });

});

app.post('/agregar/favorito', (req, res) => {

    const usuarioId = req.body.usuarioId;
    const pensionId = req.body.pensionId;

    db.query("SELECT * FROM favoritos WHERE Usuario_id = ? and Inmueble_id = ?",
        [usuarioId, pensionId],
        (err, result) => {
            if (result.length > 0) {

                db.query("DELETE FROM Favoritos WHERE Usuario_id = ? and Inmueble_id = ?",
                    [usuarioId, pensionId],
                    (err, result) => {
                        if (err) {
                            res.send({ err: err })
                        }
                        res.send({
                            message: "Eliminado de favoritos"
                        });
                    });

            } else {

                db.query("INSERT INTO Favoritos ( Usuario_id, Inmueble_id) VALUES (?,?) ",
                    [usuarioId, pensionId],
                    (err, result) => {
                        if (err) {
                            res.send({ err: err })
                        }
                        res.send({
                            message: "Agregado a favoritos"
                        });
                    });

            }
        });


});





app.listen(3001, () => {
    console.log("running server");
});