db.run(
  `
  CREATE TABLE IF NOT EXISTS utilizatori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    lastName TEXT,
    firstName TEXT,
    displayName TEXT,
    url TEXT,
    tip TEXT DEFAULT 'utilizator',
    timpInregistrare DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`,
  (err) => {
    if (err) {
      console.error('Eroare la crearea tabelului:', err.message);
    } else {
      console.log('Tabelul utilizatori a fost creat sau există deja.');
    }
  },
);
