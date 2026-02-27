const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const jwtSecret = process.env.JWT_SECRET || 'secretSuperSeguroToken123';

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: 'Por favor complete todos los campos' });
    }

    // Verificar si el usuario ya existe
    const userExist = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Guardar el usuario
    const newUser = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );

    const user = newUser.rows[0];

    // Crear contenido (Payload) del JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    // Firmar JWT
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username } });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: 'Proporcione usuario y contraseña' });
    }

    // Comprobar usuario
    const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Retornar JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username } });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.getMe = async (req, res) => {
  try {
    const userResult = await db.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};
