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
app.get('/psicopedagogias', (req, res) => {
  const query = 'SELECT * FROM Psicopedagoga';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving estudiantes:', err);
      res.status(500).send('Error retrieving estudiantes');
      return;
    }
    res.json(results);
  });
});


app.get('/psicopedagogias/:id', (req, res) => {
  const { id } = req.params;

  // Consulta para obtener un registro por ID
  const query = 'SELECT * FROM Psicopedagogia WHERE IdPsico = ?';
  
  // Ejecutar la consulta y devolver el resultado
  connection.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json(results[0]);
  });
});





// Ruta para obtener el perfil del psicólogo por ID
app.get('/api/perfil/:id', (req, res) => {
  const idPsico = parseInt(req.params.id, 10);

  if (isNaN(idPsico)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  connection.query('SELECT * FROM Psicopedagogia WHERE IdPsico = ?', [idPsico], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Psicólogo no encontrado' });
    }

    res.json(results[0]);
  });
});

app.get('/estudiantes', (req, res) => {
  const query = 'SELECT * FROM Estudiante';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving estudiantes:', err);
      res.status(500).send('Error retrieving estudiantes');
      return;
    }
    res.json(results);
  });
});

app.get('/estudiantes/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM Estudiante WHERE IdUsuario = ?';
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error retrieving estudiante:', err);
      res.status(500).send('Error retrieving estudiante');
      return;
    }
    res.json(results[0]);
  });
});
app.post('/estudiantes', (req, res) => {
  const { nombre, area, grupo, email, numero } = req.body;

  const query = 'INSERT INTO Estudiante (Nombre, AreaAcademica, Grupo, EmailA, NumControl) VALUES (?, ?, ?, ?, ?)';
  
  connection.query(query, [nombre, area, grupo, email, numero], (err, result) => {
    if (err) {
      console.error('Error inserting estudiante:', err);
      console.log(nombre, area, grupo, email, numero);
      res.status(500).send('Error inserting estudiante');
      return;
    }
    
    // Send the ID of the newly inserted record
    const newId = result.insertId;
    res.status(201).json({ IdUsuario: newId, message: 'Estudiante creado exitosamente' });
  });
});


app.put('/estudiantes/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, area, grupo, email, numero } = req.body;
  const query = 'UPDATE Estudiante SET Nombre = ?, AreaAcademica = ?, Grupo = ?, EmailA = ?, NumControl = ? WHERE IdUsuario = ?';
  console.log(nombre, area, grupo, email, numero)
  connection.query(query, [nombre, area, grupo, email, numero, id], (err, result) => {
    if (err) {
      console.error('Error updating estudiante:', err);
      console.log(nombre, area, grupo, email, numero)
      res.status(500).send('Error updating estudiante');
      return;
    }
    res.json({ id });
  });
});

app.delete('/estudiantes/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Begin transaction for data consistency
    await connection.beginTransaction();

    // Delete from 'cita' table first
    // Delete from 'cita' table first
await connection.query(
  'DELETE FROM cita WHERE IdUsuario = ?',
  [id]
);

// Delete from 'Estudiante' table
await connection.query(
  'DELETE FROM Estudiante WHERE IdUsuario = ?',
  [id]
);


  // Commit the transaction
  await connection.commit();

  res.sendStatus(204); // No content response
} catch (err) {
  console.error('Error deleting estudiante:', err);
  await connection.rollback(); // Rollback transaction on error
  res.status(500).send('Error deleting estudiante');
}
});

app.get('/citas', (req, res) => {
  const IdPsico = req.params.IdPsico;
  const query = `SELECT * FROM cita 
                 INNER JOIN estudiante ON estudiante.IdUsuario = cita.IdUsuario
                 INNER JOIN psicopedagogia ON psicopedagogia.IdPsico = cita.IdPsico`;
  connection.query(query, [IdPsico], (err, results) => {
    if (err) {
      console.error('Error al obtener las citas', err);
      res.status(500).send('Error al obtener las citas');
      return;
    }
    res.json(results);
  });
});

app.post('/citas', (req, res) => {
  const { IdUsuario, IdPsico, HoraC, FechaCita } = req.body;

  // Validación simple
  if (!IdUsuario || !IdPsico || !HoraC || !FechaCita) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const query = `
    INSERT INTO cita (IdUsuario, IdPsico, HoraC, FechaCita)
    VALUES (?, ?, ?, ?)
  `;

  connection.query(query, [IdUsuario, IdPsico, HoraC, FechaCita], (err, results) => {
    if (err) {
      console.error('Error al insertar la cita:', err);
      return res.status(500).json({ error: 'Error al insertar la cita' });
    }
    res.status(201).json({ message: 'Cita creada exitosamente', id: results.insertId });
  });
});

app.get('/psico', (req, res) => {
  const query = 'SELECT * FROM psicopedagogia';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving psicopedagogia:', err);
      res.status(500).send('Error retrieving psicopedagogia');
      return;
    }
    res.json(results);
  });
});

app.delete('/citas/:id', (req, res) => {
  const id = req.params.id;
  // Lógica para eliminar la cita con el ID dado
  // Asegúrate de que se busque la cita en la base de datos y se elimine correctamente
  res.status(200).send('Cita con ID ${id} eliminada');
});
