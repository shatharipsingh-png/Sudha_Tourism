import bcrypt from 'bcrypt';
import { adminCreationSchema } from '../validators/adminCreation.js';

export async function createAdmin(database, credentials) {
  const {email,password} = adminCreationSchema.parse(credentials);
  const hash = await bcrypt.hash(password,12);
  try {
    const [result] = await database.execute('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email,hash]);
    return {id:result.insertId};
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw Object.assign(new Error('Admin already exists; no password was changed.'), {code:'ADMIN_EXISTS'});
    throw error;
  }
}
