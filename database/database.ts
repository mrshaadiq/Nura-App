import * as SQLite from 'expo-sqlite';

export interface Patient {
  id: number;
  nama_pasien: string;
  tanggal_lahir: string; // YYYY-MM-DD
  jenis_kelamin: 'L' | 'P';
  created_at: string;
  // Joined fields for dashboard convenience
  last_risk_level?: 'rendah' | 'sedang' | 'tinggi';
  last_scan_date?: string;
}

export interface ScreeningSession {
  id: number;
  patient_id: number;
  usia_tahun: number;
  usia_bulan: number;
  foto_muka_path: string | null;
  foto_mata_path: string | null;
  foto_kuku_path: string | null;
  analisis_muka: string;
  analisis_mata: string;
  analisis_kuku: string;
  jawaban_kuesioner: string; // JSON stringified array of { question: string, score: number }
  analisis_gabungan: string;
  rekomendasi: string;
  level_risiko: 'rendah' | 'sedang' | 'tinggi';
  sesi_tipe: string; // 'awal' | 'tindak_lanjut'
  sesi_sebelumnya_id: number | null;
  status_perbandingan: string | null; // 'membaik' | 'belum_membaik' | 'memburuk'
  created_at: string; // ISO string or timestamp
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('nura.db');
  }
  return dbInstance;
}

/**
 * Initialize database tables
 */
export async function initDb(): Promise<void> {
  const db = await getDb();
  
  // Create tables
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_pasien TEXT NOT NULL,
      tanggal_lahir TEXT NOT NULL,
      jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS screening_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      usia_tahun INTEGER,
      usia_bulan INTEGER,
      foto_muka_path TEXT,
      foto_mata_path TEXT,
      foto_kuku_path TEXT,
      analisis_muka TEXT,
      analisis_mata TEXT,
      analisis_kuku TEXT,
      jawaban_kuesioner TEXT,
      analisis_gabungan TEXT,
      rekomendasi TEXT,
      level_risiko TEXT CHECK(level_risiko IN ('rendah', 'sedang', 'tinggi')),
      sesi_tipe TEXT DEFAULT 'awal',
      sesi_sebelumnya_id INTEGER,
      status_perbandingan TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(sesi_sebelumnya_id) REFERENCES screening_sessions(id) ON DELETE SET NULL
    );
  `);
}

/**
 * Register a new patient
 */
export async function addPatient(
  namaPasien: string,
  tanggalLahir: string,
  jenisKelamin: 'L' | 'P'
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO patients (nama_pasien, tanggal_lahir, jenis_kelamin) VALUES (?, ?, ?)',
    [namaPasien, tanggalLahir, jenisKelamin]
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all patients, decorated with latest screening details
 */
export async function getPatients(): Promise<Patient[]> {
  const db = await getDb();
  // Fetch latest screening session per patient using window function ROW_NUMBER
  const rows = await db.getAllAsync<Patient>(`
    SELECT p.*, s.level_risiko as last_risk_level, s.created_at as last_scan_date
    FROM patients p
    LEFT JOIN (
      SELECT patient_id, level_risiko, created_at,
             ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY created_at DESC) as rn
      FROM screening_sessions
    ) s ON p.id = s.patient_id AND s.rn = 1
    ORDER BY p.created_at DESC
  `);
  return rows;
}

/**
 * Get single patient details
 */
export async function getPatientById(id: number): Promise<Patient | null> {
  const db = await getDb();
  const patient = await db.getFirstAsync<Patient>(
    'SELECT * FROM patients WHERE id = ?',
    [id]
  );
  return patient;
}

/**
 * Add a new screening session
 */
export async function addScreeningSession(
  session: Omit<ScreeningSession, 'id' | 'created_at'>
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO screening_sessions (
      patient_id, usia_tahun, usia_bulan, 
      foto_muka_path, foto_mata_path, foto_kuku_path, 
      analisis_muka, analisis_mata, analisis_kuku, 
      jawaban_kuesioner, analisis_gabungan, rekomendasi, 
      level_risiko, sesi_tipe, sesi_sebelumnya_id, status_perbandingan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.patient_id,
      session.usia_tahun,
      session.usia_bulan,
      session.foto_muka_path,
      session.foto_mata_path,
      session.foto_kuku_path,
      session.analisis_muka,
      session.analisis_mata,
      session.analisis_kuku,
      session.jawaban_kuesioner,
      session.analisis_gabungan,
      session.rekomendasi,
      session.level_risiko,
      session.sesi_tipe,
      session.sesi_sebelumnya_id,
      session.status_perbandingan
    ]
  );
  return result.lastInsertRowId;
}

/**
 * Get screening history for a specific patient
 */
export async function getScreeningSessions(patientId: number): Promise<ScreeningSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScreeningSession>(
    'SELECT * FROM screening_sessions WHERE patient_id = ? ORDER BY created_at DESC',
    [patientId]
  );
  return rows;
}

/**
 * Get a specific screening session by its ID
 */
export async function getScreeningSessionById(id: number): Promise<ScreeningSession | null> {
  const db = await getDb();
  const session = await db.getFirstAsync<ScreeningSession>(
    'SELECT * FROM screening_sessions WHERE id = ?',
    [id]
  );
  return session;
}
