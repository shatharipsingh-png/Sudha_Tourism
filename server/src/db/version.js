export async function assertMySQL8(connection) {
  const [rows] = await connection.query('SELECT VERSION() AS version');
  const version = String(rows[0]?.version ?? '');
  if (!/^\d+\./.test(version) || Number(version.split('.')[0]) < 8 || /mariadb/i.test(version)) {
    throw new Error('MySQL 8+ is required.');
  }
}
