const express = require('express');
const mysql = require('mysql');
const app = express();

// Configuración de la conexión a la base de datos
const coneccion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'CitasMedicas'
});

coneccion.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

app.get('/perfil/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT * FROM Psicopedagogia WHERE IdPsico = ?';
    coneccion.query(query, [userId], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.listen(3000, () => {
    console.log('Servidor en el puerto 3000');
});
