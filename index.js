const cors= require('cors');

// Creación de la API
const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');


// Se crea la app en express
const app = express()

// Uso de cors
app.use(cors());

// Configuración de la cabecera donde se solicita permita
// peticiones de todos los sitios y todos los metodos que consuma la app
app.use(function(req, res, next){
    res.setHeader('Access-control-Allow-Origin','*')
    res.setHeader('Access-control-Allow-Methods','*')
    next()
})

// En este punto se utiliza el bodyparser
app.use(bodyParser.json())

// Se configura el puerto a utilizar
const PUERTO = 3000

// Se crea la instancia de la conexión a Base de datos
const connection = mysql.createConnection(
    {
        host: 'localhost',
        // nombre de la base de datos
        database: 'CitasMedicas',
        // credenciales de mysql
        user: 'root',
        password: '123456'
    }
)
// Puerto a utilizar y se muestra mensaje de ejecución
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en el puerto ${PUERTO}`)
})

// Verificar que la conexión sea exitosa
connection.connect(error => {
  if (error) throw error
  console.log('Conexión exitosa a la BD')
})

// Se crea la raíz de la API
app.get('/', (req, res) => {
  res.send('API')
})

app.post('/register', async (req, res) => {
  const { email, firstname, lastname, userType, password } = req.body;

  // Hash de la contraseña
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Error hasheando la contraseña:', err.stack);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    const query = 'INSERT INTO Psicopedagogia (NombreP, ApellidoP, Puesto, EmailP, Contraseña) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [firstname, lastname, userType, email, hash], (err, results) => {
      if (err) {
        console.error('Error ejecutando la consulta:', err.stack);
        return res.status(500).json({ message: 'Error interno del servidor' });
      }

      return res.status(201).json({ message: 'Usuario registrado exitosamente' });
    });
  });
});

// Endpoint para el login

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Email:', email);
  console.log('Password:', password);

  const query = 'SELECT * FROM Psicopedagogia WHERE EmailP = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err.stack);
      return res.status(500).json({ message: 'Error interno del servidor al ejecutar la consulta' });
    }

    console.log('Resultados de la consulta:', results);

    if (results.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Verificar la contraseña
    const hash = user.Contraseña.toString(); // Asegúrate de que el hash es una cadena
    bcrypt.compare(password, hash, (err, isMatch) => {
      if (err) {
        console.error('Error comparando contraseñas:', err.stack);
        return res.status(500).json({ message: 'Error interno del servidor al comparar contraseñas' });
      }

      console.log('Contraseña comparada, es igual:', isMatch);

      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña incorrecta' });
      }

      // Login exitoso
      return res.status(200).json({ message: 'Registro agregado', registro: user });
    });
  });
});

// Endpoint para actualizar
// Ruta para actualizar un registro
app.put('/update_psicopedagogia/:id', (req, res) => {
  const id = req.params.id;
  const data = req.body; // Asegúrate de que 'data' esté definido aquí
  const sql = 'UPDATE psicopedagogia SET ? WHERE IdPsico = ?';
  connection.query(sql, [data, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el registro:', err);
      res.status(500).send('Error al actualizar el registro');
      return;
    }
    console.log(`Registro con IdPsico=${id} actualizado. Datos:`, data);
    res.send('Registro actualizado');
  });
});

// Endpoint para eliminar
app.delete('/delete_psicopedagogia/:id', (req, res) => {
  const id = req.params.id;
  const sql = `DELETE FROM psicopedagogia WHERE IdPsico = ?`;

  connection.query(sql, [id], (err, result) => {
      if (err) throw err;
      console.log(`Registro con IdPsico=${id} eliminado.`);
      res.send({ message: 'Registro eliminado exitosamente' });
  });
});

//Ontener los datos
app.get('/perfil/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM Psicopedagogia WHERE IdPsico = ?';
  connection.query(query, [userId], (err, results) => {
      if (err) throw err;
      res.json(results[0]);
  });
});

// Ruta para obtener los registros de la tabla Psicopedagogia
app.get('/api/psicopedagogia', (req, res) => {
  const query = 'SELECT * FROM Psicopedagogia';
  connection.query(query, (err, results) => {
      if (err) {
          res.status(500).send('Error al obtener los registros');
      } else {
          res.json(results);
      }
  });
});