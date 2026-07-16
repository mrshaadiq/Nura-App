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
public final class PatientDao_Impl implements PatientDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<Patient> __insertionAdapterOfPatient;

  private final EntityDeletionOrUpdateAdapter<Patient> __deletionAdapterOfPatient;

  private final EntityDeletionOrUpdateAdapter<Patient> __updateAdapterOfPatient;

  public PatientDao_Impl(RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPatient = new EntityInsertionAdapter<Patient>(__db) {
      @Override
      public String createQuery() {
        return "INSERT OR ABORT INTO `patients` (`id`,`nama_pasien`,`tanggal_lahir`,`jenis_kelamin`,`created_at`) VALUES (nullif(?, 0),?,?,?,?)";
      }

      @Override
      public void bind(SupportSQLiteStatement stmt, Patient value) {
        stmt.bindLong(1, value.id);
        if (value.namaPasien == null) {
          stmt.bindNull(2);
        } else {
          stmt.bindString(2, value.namaPasien);
        }
        if (value.tanggalLahir == null) {
          stmt.bindNull(3);
        } else {
          stmt.bindString(3, value.tanggalLahir);
        }
        if (value.jenisKelamin == null) {
          stmt.bindNull(4);
        } else {
          stmt.bindString(4, value.jenisKelamin);
        }
        stmt.bindLong(5, value.createdAt);
      }
    };
    this.__deletionAdapterOfPatient = new EntityDeletionOrUpdateAdapter<Patient>(__db) {
      @Override
      public String createQuery() {
        return "DELETE FROM `patients` WHERE `id` = ?";
      }

      @Override
      public void bind(SupportSQLiteStatement stmt, Patient value) {
        stmt.bindLong(1, value.id);
      }
    };
    this.__updateAdapterOfPatient = new EntityDeletionOrUpdateAdapter<Patient>(__db) {
      @Override
      public String createQuery() {
        return "UPDATE OR ABORT `patients` SET `id` = ?,`nama_pasien` = ?,`tanggal_lahir` = ?,`jenis_kelamin` = ?,`created_at` = ? WHERE `id` = ?";
      }

      @Override
      public void bind(SupportSQLiteStatement stmt, Patient value) {
        stmt.bindLong(1, value.id);
        if (value.namaPasien == null) {
          stmt.bindNull(2);
        } else {
          stmt.bindString(2, value.namaPasien);
        }
        if (value.tanggalLahir == null) {
          stmt.bindNull(3);
        } else {
          stmt.bindString(3, value.tanggalLahir);
        }
        if (value.jenisKelamin == null) {
          stmt.bindNull(4);
        } else {
          stmt.bindString(4, value.jenisKelamin);
        }
        stmt.bindLong(5, value.createdAt);
        stmt.bindLong(6, value.id);
      }
    };
  }

  @Override
  public long insert(final Patient patient) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      long _result = __insertionAdapterOfPatient.insertAndReturnId(patient);
      __db.setTransactionSuccessful();
      return _result;
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void delete(final Patient patient) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __deletionAdapterOfPatient.handle(patient);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final Patient patient) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfPatient.handle(patient);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public List<Patient> getAllPatients() {
    final String _sql = "SELECT * FROM patients ORDER BY created_at DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfNamaPasien = CursorUtil.getColumnIndexOrThrow(_cursor, "nama_pasien");
      final int _cursorIndexOfTanggalLahir = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal_lahir");
      final int _cursorIndexOfJenisKelamin = CursorUtil.getColumnIndexOrThrow(_cursor, "jenis_kelamin");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
      final List<Patient> _result = new ArrayList<Patient>(_cursor.getCount());
      while(_cursor.moveToNext()) {
        final Patient _item;
        _item = new Patient();
        _item.id = _cursor.getInt(_cursorIndexOfId);
        if (_cursor.isNull(_cursorIndexOfNamaPasien)) {
          _item.namaPasien = null;
        } else {
          _item.namaPasien = _cursor.getString(_cursorIndexOfNamaPasien);
        }
        if (_cursor.isNull(_cursorIndexOfTanggalLahir)) {
          _item.tanggalLahir = null;
        } else {
          _item.tanggalLahir = _cursor.getString(_cursorIndexOfTanggalLahir);
        }
        if (_cursor.isNull(_cursorIndexOfJenisKelamin)) {
          _item.jenisKelamin = null;
        } else {
          _item.jenisKelamin = _cursor.getString(_cursorIndexOfJenisKelamin);
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
  public Patient getPatientById(final int id) {
    final String _sql = "SELECT * FROM patients WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfNamaPasien = CursorUtil.getColumnIndexOrThrow(_cursor, "nama_pasien");
      final int _cursorIndexOfTanggalLahir = CursorUtil.getColumnIndexOrThrow(_cursor, "tanggal_lahir");
      final int _cursorIndexOfJenisKelamin = CursorUtil.getColumnIndexOrThrow(_cursor, "jenis_kelamin");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
      final Patient _result;
      if(_cursor.moveToFirst()) {
        _result = new Patient();
        _result.id = _cursor.getInt(_cursorIndexOfId);
        if (_cursor.isNull(_cursorIndexOfNamaPasien)) {
          _result.namaPasien = null;
        } else {
          _result.namaPasien = _cursor.getString(_cursorIndexOfNamaPasien);
        }
        if (_cursor.isNull(_cursorIndexOfTanggalLahir)) {
          _result.tanggalLahir = null;
        } else {
          _result.tanggalLahir = _cursor.getString(_cursorIndexOfTanggalLahir);
        }
        if (_cursor.isNull(_cursorIndexOfJenisKelamin)) {
          _result.jenisKelamin = null;
        } else {
          _result.jenisKelamin = _cursor.getString(_cursorIndexOfJenisKelamin);
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
