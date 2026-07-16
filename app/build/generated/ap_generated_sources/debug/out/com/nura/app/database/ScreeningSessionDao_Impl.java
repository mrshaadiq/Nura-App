package com.nura.app.database;

import android.database.Cursor;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@SuppressWarnings({"unchecked", "deprecation"})
public final class ScreeningSessionDao_Impl implements ScreeningSessionDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ScreeningSession> __insertionAdapterOfScreeningSession;

  private final EntityDeletionOrUpdateAdapter<ScreeningSession> __deletionAdapterOfScreeningSession;

  public ScreeningSessionDao_Impl(RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfScreeningSession = new EntityInsertionAdapter<ScreeningSession>(__db) {
      @Override
      public String createQuery() {
        return "INSERT OR ABORT INTO `screening_sessions` (`id`,`patient_id`,`usia_tahun`,`usia_bulan`,`foto_muka_path`,`foto_mata_path`,`foto_kuku_path`,`analisis_muka`,`analisis_mata`,`analisis_kuku`,`jawaban_kuesioner`,`analisis_gabungan`,`rekomendasi`,`level_risiko`,`created_at`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      public void bind(SupportSQLiteStatement stmt, ScreeningSession value) {
        stmt.bindLong(1, value.id);
        stmt.bindLong(2, value.patientId);
        stmt.bindLong(3, value.usiaTahun);
        stmt.bindLong(4, value.usiaBulan);
        if (value.fotoMukaPath == null) {
          stmt.bindNull(5);
        } else {
          stmt.bindString(5, value.fotoMukaPath);
        }
        if (value.fotoMataPath == null) {
          stmt.bindNull(6);
        } else {
          stmt.bindString(6, value.fotoMataPath);
        }
        if (value.fotoKukuPath == null) {
          stmt.bindNull(7);
        } else {
          stmt.bindString(7, value.fotoKukuPath);
        }
        if (value.analisisMuka == null) {
          stmt.bindNull(8);
        } else {
          stmt.bindString(8, value.analisisMuka);
        }
        if (value.analisisMata == null) {
          stmt.bindNull(9);
        } else {
          stmt.bindString(9, value.analisisMata);
        }
        if (value.analisisKuku == null) {
          stmt.bindNull(10);
        } else {
          stmt.bindString(10, value.analisisKuku);
        }
        if (value.jawabanKuesioner == null) {
          stmt.bindNull(11);
        } else {
          stmt.bindString(11, value.jawabanKuesioner);
        }
        if (value.analisisGabungan == null) {
          stmt.bindNull(12);
        } else {
          stmt.bindString(12, value.analisisGabungan);
        }
        if (value.rekomendasi == null) {
          stmt.bindNull(13);
        } else {
          stmt.bindString(13, value.rekomendasi);
        }
        if (value.levelRisiko == null) {
          stmt.bindNull(14);
        } else {
          stmt.bindString(14, value.levelRisiko);
        }
        stmt.bindLong(15, value.createdAt);
      }
    };
    this.__deletionAdapterOfScreeningSession = new EntityDeletionOrUpdateAdapter<ScreeningSession>(__db) {
      @Override
      public String createQuery() {
        return "DELETE FROM `screening_sessions` WHERE `id` = ?";
      }

      @Override
      public void bind(SupportSQLiteStatement stmt, ScreeningSession value) {
        stmt.bindLong(1, value.id);
      }
    };
  }

  @Override
  public long insert(final ScreeningSession session) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      long _result = __insertionAdapterOfScreeningSession.insertAndReturnId(session);
      __db.setTransactionSuccessful();
      return _result;
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void delete(final ScreeningSession session) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __deletionAdapterOfScreeningSession.handle(session);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public List<ScreeningSession> getSessionsForPatient(final int patientId) {
    final String _sql = "SELECT * FROM screening_sessions WHERE patient_id = ? ORDER BY created_at DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, patientId);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patient_id");
      final int _cursorIndexOfUsiaTahun = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_tahun");
      final int _cursorIndexOfUsiaBulan = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_bulan");
      final int _cursorIndexOfFotoMukaPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_muka_path");
      final int _cursorIndexOfFotoMataPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_mata_path");
      final int _cursorIndexOfFotoKukuPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_kuku_path");
      final int _cursorIndexOfAnalisisMuka = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_muka");
      final int _cursorIndexOfAnalisisMata = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_mata");
      final int _cursorIndexOfAnalisisKuku = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_kuku");
      final int _cursorIndexOfJawabanKuesioner = CursorUtil.getColumnIndexOrThrow(_cursor, "jawaban_kuesioner");
      final int _cursorIndexOfAnalisisGabungan = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_gabungan");
      final int _cursorIndexOfRekomendasi = CursorUtil.getColumnIndexOrThrow(_cursor, "rekomendasi");
      final int _cursorIndexOfLevelRisiko = CursorUtil.getColumnIndexOrThrow(_cursor, "level_risiko");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
      final List<ScreeningSession> _result = new ArrayList<ScreeningSession>(_cursor.getCount());
      while(_cursor.moveToNext()) {
        final ScreeningSession _item;
        _item = new ScreeningSession();
        _item.id = _cursor.getInt(_cursorIndexOfId);
        _item.patientId = _cursor.getInt(_cursorIndexOfPatientId);
        _item.usiaTahun = _cursor.getInt(_cursorIndexOfUsiaTahun);
        _item.usiaBulan = _cursor.getInt(_cursorIndexOfUsiaBulan);
        if (_cursor.isNull(_cursorIndexOfFotoMukaPath)) {
          _item.fotoMukaPath = null;
        } else {
          _item.fotoMukaPath = _cursor.getString(_cursorIndexOfFotoMukaPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoMataPath)) {
          _item.fotoMataPath = null;
        } else {
          _item.fotoMataPath = _cursor.getString(_cursorIndexOfFotoMataPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoKukuPath)) {
          _item.fotoKukuPath = null;
        } else {
          _item.fotoKukuPath = _cursor.getString(_cursorIndexOfFotoKukuPath);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMuka)) {
          _item.analisisMuka = null;
        } else {
          _item.analisisMuka = _cursor.getString(_cursorIndexOfAnalisisMuka);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMata)) {
          _item.analisisMata = null;
        } else {
          _item.analisisMata = _cursor.getString(_cursorIndexOfAnalisisMata);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisKuku)) {
          _item.analisisKuku = null;
        } else {
          _item.analisisKuku = _cursor.getString(_cursorIndexOfAnalisisKuku);
        }
        if (_cursor.isNull(_cursorIndexOfJawabanKuesioner)) {
          _item.jawabanKuesioner = null;
        } else {
          _item.jawabanKuesioner = _cursor.getString(_cursorIndexOfJawabanKuesioner);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisGabungan)) {
          _item.analisisGabungan = null;
        } else {
          _item.analisisGabungan = _cursor.getString(_cursorIndexOfAnalisisGabungan);
        }
        if (_cursor.isNull(_cursorIndexOfRekomendasi)) {
          _item.rekomendasi = null;
        } else {
          _item.rekomendasi = _cursor.getString(_cursorIndexOfRekomendasi);
        }
        if (_cursor.isNull(_cursorIndexOfLevelRisiko)) {
          _item.levelRisiko = null;
        } else {
          _item.levelRisiko = _cursor.getString(_cursorIndexOfLevelRisiko);
        }
        _item.createdAt = _cursor.getLong(_cursorIndexOfCreatedAt);
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public List<ScreeningSession> getAllSessions() {
    final String _sql = "SELECT * FROM screening_sessions ORDER BY created_at DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patient_id");
      final int _cursorIndexOfUsiaTahun = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_tahun");
      final int _cursorIndexOfUsiaBulan = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_bulan");
      final int _cursorIndexOfFotoMukaPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_muka_path");
      final int _cursorIndexOfFotoMataPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_mata_path");
      final int _cursorIndexOfFotoKukuPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_kuku_path");
      final int _cursorIndexOfAnalisisMuka = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_muka");
      final int _cursorIndexOfAnalisisMata = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_mata");
      final int _cursorIndexOfAnalisisKuku = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_kuku");
      final int _cursorIndexOfJawabanKuesioner = CursorUtil.getColumnIndexOrThrow(_cursor, "jawaban_kuesioner");
      final int _cursorIndexOfAnalisisGabungan = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_gabungan");
      final int _cursorIndexOfRekomendasi = CursorUtil.getColumnIndexOrThrow(_cursor, "rekomendasi");
      final int _cursorIndexOfLevelRisiko = CursorUtil.getColumnIndexOrThrow(_cursor, "level_risiko");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
      final List<ScreeningSession> _result = new ArrayList<ScreeningSession>(_cursor.getCount());
      while(_cursor.moveToNext()) {
        final ScreeningSession _item;
        _item = new ScreeningSession();
        _item.id = _cursor.getInt(_cursorIndexOfId);
        _item.patientId = _cursor.getInt(_cursorIndexOfPatientId);
        _item.usiaTahun = _cursor.getInt(_cursorIndexOfUsiaTahun);
        _item.usiaBulan = _cursor.getInt(_cursorIndexOfUsiaBulan);
        if (_cursor.isNull(_cursorIndexOfFotoMukaPath)) {
          _item.fotoMukaPath = null;
        } else {
          _item.fotoMukaPath = _cursor.getString(_cursorIndexOfFotoMukaPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoMataPath)) {
          _item.fotoMataPath = null;
        } else {
          _item.fotoMataPath = _cursor.getString(_cursorIndexOfFotoMataPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoKukuPath)) {
          _item.fotoKukuPath = null;
        } else {
          _item.fotoKukuPath = _cursor.getString(_cursorIndexOfFotoKukuPath);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMuka)) {
          _item.analisisMuka = null;
        } else {
          _item.analisisMuka = _cursor.getString(_cursorIndexOfAnalisisMuka);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMata)) {
          _item.analisisMata = null;
        } else {
          _item.analisisMata = _cursor.getString(_cursorIndexOfAnalisisMata);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisKuku)) {
          _item.analisisKuku = null;
        } else {
          _item.analisisKuku = _cursor.getString(_cursorIndexOfAnalisisKuku);
        }
        if (_cursor.isNull(_cursorIndexOfJawabanKuesioner)) {
          _item.jawabanKuesioner = null;
        } else {
          _item.jawabanKuesioner = _cursor.getString(_cursorIndexOfJawabanKuesioner);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisGabungan)) {
          _item.analisisGabungan = null;
        } else {
          _item.analisisGabungan = _cursor.getString(_cursorIndexOfAnalisisGabungan);
        }
        if (_cursor.isNull(_cursorIndexOfRekomendasi)) {
          _item.rekomendasi = null;
        } else {
          _item.rekomendasi = _cursor.getString(_cursorIndexOfRekomendasi);
        }
        if (_cursor.isNull(_cursorIndexOfLevelRisiko)) {
          _item.levelRisiko = null;
        } else {
          _item.levelRisiko = _cursor.getString(_cursorIndexOfLevelRisiko);
        }
        _item.createdAt = _cursor.getLong(_cursorIndexOfCreatedAt);
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public ScreeningSession getSessionById(final int id) {
    final String _sql = "SELECT * FROM screening_sessions WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patient_id");
      final int _cursorIndexOfUsiaTahun = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_tahun");
      final int _cursorIndexOfUsiaBulan = CursorUtil.getColumnIndexOrThrow(_cursor, "usia_bulan");
      final int _cursorIndexOfFotoMukaPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_muka_path");
      final int _cursorIndexOfFotoMataPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_mata_path");
      final int _cursorIndexOfFotoKukuPath = CursorUtil.getColumnIndexOrThrow(_cursor, "foto_kuku_path");
      final int _cursorIndexOfAnalisisMuka = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_muka");
      final int _cursorIndexOfAnalisisMata = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_mata");
      final int _cursorIndexOfAnalisisKuku = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_kuku");
      final int _cursorIndexOfJawabanKuesioner = CursorUtil.getColumnIndexOrThrow(_cursor, "jawaban_kuesioner");
      final int _cursorIndexOfAnalisisGabungan = CursorUtil.getColumnIndexOrThrow(_cursor, "analisis_gabungan");
      final int _cursorIndexOfRekomendasi = CursorUtil.getColumnIndexOrThrow(_cursor, "rekomendasi");
      final int _cursorIndexOfLevelRisiko = CursorUtil.getColumnIndexOrThrow(_cursor, "level_risiko");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
      final ScreeningSession _result;
      if(_cursor.moveToFirst()) {
        _result = new ScreeningSession();
        _result.id = _cursor.getInt(_cursorIndexOfId);
        _result.patientId = _cursor.getInt(_cursorIndexOfPatientId);
        _result.usiaTahun = _cursor.getInt(_cursorIndexOfUsiaTahun);
        _result.usiaBulan = _cursor.getInt(_cursorIndexOfUsiaBulan);
        if (_cursor.isNull(_cursorIndexOfFotoMukaPath)) {
          _result.fotoMukaPath = null;
        } else {
          _result.fotoMukaPath = _cursor.getString(_cursorIndexOfFotoMukaPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoMataPath)) {
          _result.fotoMataPath = null;
        } else {
          _result.fotoMataPath = _cursor.getString(_cursorIndexOfFotoMataPath);
        }
        if (_cursor.isNull(_cursorIndexOfFotoKukuPath)) {
          _result.fotoKukuPath = null;
        } else {
          _result.fotoKukuPath = _cursor.getString(_cursorIndexOfFotoKukuPath);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMuka)) {
          _result.analisisMuka = null;
        } else {
          _result.analisisMuka = _cursor.getString(_cursorIndexOfAnalisisMuka);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisMata)) {
          _result.analisisMata = null;
        } else {
          _result.analisisMata = _cursor.getString(_cursorIndexOfAnalisisMata);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisKuku)) {
          _result.analisisKuku = null;
        } else {
          _result.analisisKuku = _cursor.getString(_cursorIndexOfAnalisisKuku);
        }
        if (_cursor.isNull(_cursorIndexOfJawabanKuesioner)) {
          _result.jawabanKuesioner = null;
        } else {
          _result.jawabanKuesioner = _cursor.getString(_cursorIndexOfJawabanKuesioner);
        }
        if (_cursor.isNull(_cursorIndexOfAnalisisGabungan)) {
          _result.analisisGabungan = null;
        } else {
          _result.analisisGabungan = _cursor.getString(_cursorIndexOfAnalisisGabungan);
        }
        if (_cursor.isNull(_cursorIndexOfRekomendasi)) {
          _result.rekomendasi = null;
        } else {
          _result.rekomendasi = _cursor.getString(_cursorIndexOfRekomendasi);
        }
        if (_cursor.isNull(_cursorIndexOfLevelRisiko)) {
          _result.levelRisiko = null;
        } else {
          _result.levelRisiko = _cursor.getString(_cursorIndexOfLevelRisiko);
        }
        _result.createdAt = _cursor.getLong(_cursorIndexOfCreatedAt);
      } else {
        _result = null;
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
