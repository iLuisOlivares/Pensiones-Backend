const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
import { PORT } from "./config.js";

const saltRounds = 10;

const app = express();



app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}

));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        key: "userId",
        secret: "PensionesSecretAPP",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60 * 60 * 24

        }
    })
)


const db = mysql.createConnection({
    user: "root",
    host: "containers-us-west-118.railway.app",
    port: 6605,
    password: "rlGPy9ODdRDvV6xm9ULX",
    database: "railway",
});

db.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});


//CLient
app.post('/register', (req, res) => {

    const nombre = req.body.nombre;
    const celular = req.body.celular;
    const correo = req.body.correo;
    const contra = req.body.contra;


    if (nombre == '' || celular == '' || correo == '' || contra == '') {
        res.send({ message: 'Por favor, completar todos los campos!!' });
    } else {

        bcrypt.hash(contra, saltRounds, (err, hash) => {

            if (err) {
                console.log(err);
            }

            db.query("INSERT INTO Usuarios ( Nombre, Celular, Correo, Contra) VALUES (?,?,?,?)",
                [nombre, celular, correo, hash],
                (err, result) => {
                    if (err) {
                        if (err.code == "ER_DUP_ENTRY") {
                            res.send({ err: err, message: "Correo electronico no disponible" })
                        }
                        else {
                            res.send({ err: err, message: err.message })
                        }
                    }

                    res.send(result);

                });
        })

    }


})

app.put('/actualizar/perfil', (req, res) => {

    const nombre = req.body.nombre;
    const celular = req.body.celular;
    const correo = req.body.correo;
    const id = req.body.usuarioId;
    const foto = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/2048px-Circle-icons-profile.svg.png"

    if (nombre == '' || celular == '' || correo == '' || foto == '') {
        res.send({ message: 'Por favor, completar todos los campos!!' });
    } else {
        db.query("UPDATE Usuarios SET Nombre= ?, Celular= ?, Correo= ?, foto=? WHERE  id = ? ",
            [nombre, celular, correo, foto, id],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                } else {
                    res.send({
                        message: "Perfil actualizado",
                        icon: 'success'
                    });
                }

            });
    }

})

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user })
    } else {
        res.send({ loggedIn: false });
    }

});

app.post('/login', (req, res) => {

    const correo = req.body.correo;
    const contra = req.body.contra;

    if (correo == '' || contra == '') {
        res.send({
            message: "Por favor, completar todos los campos!!"
        });
    } else {
        db.query("SELECT * FROM Usuarios WHERE Correo = ?",
            [correo],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                }
                else if (result.length > 0) {
                    bcrypt.compare(contra, result[0].Contra, (err, response) => {
                        if (response) {
                            req.session.user = result;
                            console.log(req.session.user);
                            res.send(result)
                        } else {
                            res.send({
                                message: "Usuario o Contraseña incorrectos!"
                            });
                        }
                    })
                } else {
                    res.send({
                        message: "Usuario no existe!"
                    });
                }

            });
    }
})

app.get('/propiedades', (req, res) => {

    console.log("entrando a prop");

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
app.get('/propiedad/:id', (req, res) => {


    const usuarioId = req.params.id;

    db.query("select Inmueble.*, Usuarios.Nombre, Usuarios.Celular from Inmueble inner join Usuarios on Inmueble.Usuario_id = Usuarios.Id where Inmueble.Id = ?", [usuarioId],
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

            res.send(result);
            console.log(result);

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
            res.send(result);
            console.log(result);

        });
});


app.post('/agregar/propiedad', (req, res) => {

    const titulo = req.body.titulo;
    const barrio = req.body.barrio;
    const descripcion = req.body.descripcion;
    const imagen = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/180051990.jpg?k=97b4df49c92a434c13a6814aa28d8693547d1e16d51f6d3e8fbb337959ac7b17&o=&hp=1";
    const direccion = req.body.direccion;
    const precio = req.body.precio;
    const usuarioId = req.body.usuarioId;

    if (titulo == '' || barrio == '' || descripcion == '' || imagen == '' || direccion == '' || precio == '' || usuarioId == '') {
        res.send({
            message: "Por favor, completar todos los campos!!",
            icon: 'error'
        });
    } else {
        db.query("INSERT INTO Inmueble ( titulo, precio, barrio, descripcion, direccion, usuario_id, imagen) VALUES (?,?,?,?,?,?,?)",
            [titulo, precio, barrio, descripcion, direccion, usuarioId, imagen],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                }
                res.send({
                    message: "Pension agregada",
                    icon: 'success'
                });
            });
    }



});

app.put('/actualizar/propiedad', (req, res) => {

    const titulo = req.body.titulo;
    const barrio = req.body.barrio;
    const descripcion = req.body.descripcion;
    const imagen = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/180051990.jpg?k=97b4df49c92a434c13a6814aa28d8693547d1e16d51f6d3e8fbb337959ac7b17&o=&hp=1";
    const direccion = req.body.direccion;
    const precio = req.body.precio;
    const id = req.body.id;

    console.log(id);

    if (titulo == '' || barrio == '' || descripcion == '' || imagen == '' || direccion == '' || precio == '' || id == '') {
        res.send({
            message: "Por favor, completar todos los campos!!",
            icon: 'error'
        });
    } else {
        db.query("UPDATE Inmueble SET titulo = ?, precio = ?, barrio = ?, descripcion = ?, direccion = ? , imagen = ? where id = ?",
            [titulo, precio, barrio, descripcion, direccion, imagen, id],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                }
                res.send({
                    message: "Pension Actualizada",
                    icon: 'success'
                });
            });
    }



});

app.post('/agregar/propiedad', (req, res) => {

    const titulo = req.body.titulo;
    const barrio = req.body.barrio;
    const descripcion = req.body.descripcion;
    const imagen = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/180051990.jpg?k=97b4df49c92a434c13a6814aa28d8693547d1e16d51f6d3e8fbb337959ac7b17&o=&hp=1";
    const direccion = req.body.direccion;
    const precio = req.body.precio;
    const usuarioId = req.body.usuarioId;

    if (titulo == '' || barrio == '' || descripcion == '' || imagen == '' || direccion == '' || precio == '' || usuarioId == '') {
        res.send({
            message: "Por favor, completar todos los campos!!",
            icon: 'error'
        });
    } else {
        db.query("INSERT INTO Inmueble ( titulo, precio, barrio, descripcion, direccion, usuario_id, imagen) VALUES (?,?,?,?,?,?,?)",
            [titulo, precio, barrio, descripcion, direccion, usuarioId, imagen],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                }
                res.send({
                    message: "Pension agregada",
                    icon: 'success'
                });
            });
    }



});

app.post('/eliminar/propiedad', (req, res) => {

    const pensionId = req.body.pensionId;
    const usuarioId = req.body.usuarioId;

    console.log(pensionId)
    db.query("DELETE FROM Inmueble WHERE Usuario_id = ? and id = ?",
        [usuarioId, pensionId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
                console.log(err)
            }
            res.send({
                message: "Pension Eliminada"
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
                    user: result[0]
                }
                );
            } else {
                res.send({
                    message: "Usuario no encontrado"
                });
            }
        });

});
app.get('/propiedad/:id', (req, res) => {

    const inmuebleId = req.params.id;

    db.query("SELECT * FROM Inmueble where id = ?",
        [inmuebleId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send({
                    Property: result[0]
                }
                );
            } else {
                res.send({
                    message: "Inmueble no encontrado"
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





app.listen(PORT, () => {
    console.log("running server");
});