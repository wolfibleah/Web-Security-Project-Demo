const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./utilizatori.db', (err) => {
  if (err) {
    console.error('Eroare DB:', err.message);
    return;
  }
  console.log('Conectat la DB');
});

// Găsim username-urile duplicate
db.all(
  `
  SELECT username, GROUP_CONCAT(id) AS ids, COUNT(*) AS count
  FROM utilizatori
  GROUP BY username
  HAVING count > 1
`,
  [],
  (err, rows) => {
    if (err) throw err;

    if (rows.length === 0) {
      console.log('Nu există useri duplicați 👍');
      db.close();
      return;
    }

    rows.forEach((row) => {
      const ids = row.ids.split(',').map(Number);

      // păstrăm primul ID (cel mai mic)
      const keepId = Math.min(...ids);
      const deleteIds = ids.filter((id) => id !== keepId);

      console.log(`Username "${row.username}" → păstrăm ID ${keepId}, ștergem ${deleteIds}`);

      db.run(`DELETE FROM utilizatori WHERE id IN (${deleteIds.join(',')})`, [], (err) => {
        if (err) console.error(err.message);
      });
    });

    setTimeout(() => {
      console.log('Curățare finalizată ✅');
      db.close();
    }, 500);
  },
);
