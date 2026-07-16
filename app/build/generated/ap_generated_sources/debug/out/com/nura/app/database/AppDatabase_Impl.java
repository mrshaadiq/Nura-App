package com.nura.app.database;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomOpenHelper;
import androidx.room.RoomOpenHelper.Delegate;
import androidx.room.RoomOpenHelper.ValidationResult;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.room.util.TableInfo.Column;
import androidx.room.util.TableInfo.ForeignKey;
import androidx.room.util.TableInfo.Index;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import androidx.sqlite.db.SupportSQLiteOpenHelper.Callback;
import androidx.sqlite.db.SupportSQLiteOpenHelper.Configuration;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@SuppressWarnings({"unchecked", "deprecation"})
public final class AppDatabase_Impl extends AppDatabase {
  private volatile PatientDao _patientDao;

  private volatile ScreeningSessionDao _screeningSessionDao;

  @Override
  protected SupportSQLiteOpenHelper createOpenHelper(DatabaseConfiguration configuration) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(configuration, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(SupportSQLiteDatabase _db) {
        _db.execSQL("CREATE TABLE IF NOT EXISTS `patients` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `nama_pasien` TEXT, `tanggal_lahir` TEXT, `jenis_kelamin` TEXT, `created_at` INTEGER NOT NULL)");
        _db.execSQL("CREATE TABLE IF NOT EXISTS `screening_sessions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `patient_id` INTEGER NOT NULL, `usia_tahun` INTEGER NOT NULL, `usia_bulan` INTEGER NOT NULL, `foto_muka_path` TEXT, `foto_mata_path` TEXT, `foto_kuku_path` TEXT, `analisis_muka` TEXT, `analisis_mata` TEXT, `analisis_kuku` TEXT, `jawaban_kuesioner` TEXT, `analisis_gabungan` TEXT, `rekomendasi` TEXT, `level_risiko` TEXT, `created_at` INTEGER NOT NULL, FOREIGN KEY(`patient_id`) REFERENCES `patients`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )");
        _db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        _db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '82c78d4f002a7e44a608514bd797944c')");
      }

      @Override
      public void dropAllTables(SupportSQLiteDatabase _db) {
        _db.execSQL("DROP TABLE IF EXISTS `patients`");
        _db.execSQL("DROP TABLE IF EXISTS `screening_sessions`");
        if (mCallbacks != null) {
          for (int _i = 0, _size = mCallbacks.size(); _i < _size; _i++) {
            mCallbacks.get(_i).onDestructiveMigration(_db);
          }
        }
      }

      @Override
      public void onCreate(SupportSQLiteDatabase _db) {
        if (mCallbacks != null) {
          for (int _i = 0, _size = mCallbacks.size(); _i < _size; _i++) {
            mCallbacks.get(_i).onCreate(_db);
          }
        }
      }

      @Override
      public void onOpen(SupportSQLiteDatabase _db) {
        mDatabase = _db;
        _db.execSQL("PRAGMA foreign_keys = ON");
        internalInitInvalidationTracker(_db);
        if (mCallbacks != null) {
          for (int _i = 0, _size = mCallbacks.size(); _i < _size; _i++) {
            mCallbacks.get(_i).onOpen(_db);
          }
        }
      }

      @Override
      public void onPreMigrate(SupportSQLiteDatabase _db) {
        DBUtil.dropFtsSyncTriggers(_db);
      }

      @Override
      public void onPostMigrate(SupportSQLiteDatabase _db) {
      }

      @Override
      public RoomOpenHelper.ValidationResult onValidateSchema(SupportSQLiteDatabase _db) {
        final HashMap<String, TableInfo.Column> _columnsPatients = new HashMap<String, TableInfo.Column>(5);
        _columnsPatients.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPatients.put("nama_pasien", new TableInfo.Column("nama_pasien", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPatients.put("tanggal_lahir", new TableInfo.Column("tanggal_lahir", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPatients.put("jenis_kelamin", new TableInfo.Column("jenis_kelamin", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPatients.put("created_at", new TableInfo.Column("created_at", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPatients = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPatients = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPatients = new TableInfo("patients", _columnsPatients, _foreignKeysPatients, _indicesPatients);
        final TableInfo _existingPatients = TableInfo.read(_db, "patients");
        if (! _infoPatients.equals(_existingPatients)) {
          return new RoomOpenHelper.ValidationResult(false, "patients(com.nura.app.database.Patient).\n"
                  + " Expected:\n" + _infoPatients + "\n"
                  + " Found:\n" + _existingPatients);
        }
        final HashMap<String, TableInfo.Column> _columnsScreeningSessions = new HashMap<String, TableInfo.Column>(15);
        _columnsScreeningSessions.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("patient_id", new TableInfo.Column("patient_id", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("usia_tahun", new TableInfo.Column("usia_tahun", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("usia_bulan", new TableInfo.Column("usia_bulan", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("foto_muka_path", new TableInfo.Column("foto_muka_path", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("foto_mata_path", new TableInfo.Column("foto_mata_path", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("foto_kuku_path", new TableInfo.Column("foto_kuku_path", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("analisis_muka", new TableInfo.Column("analisis_muka", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("analisis_mata", new TableInfo.Column("analisis_mata", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("analisis_kuku", new TableInfo.Column("analisis_kuku", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("jawaban_kuesioner", new TableInfo.Column("jawaban_kuesioner", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("analisis_gabungan", new TableInfo.Column("analisis_gabungan", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("rekomendasi", new TableInfo.Column("rekomendasi", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("level_risiko", new TableInfo.Column("level_risiko", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScreeningSessions.put("created_at", new TableInfo.Column("created_at", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysScreeningSessions = new HashSet<TableInfo.ForeignKey>(1);
        _foreignKeysScreeningSessions.add(new TableInfo.ForeignKey("patients", "CASCADE", "NO ACTION",Arrays.asList("patient_id"), Arrays.asList("id")));
        final HashSet<TableInfo.Index> _indicesScreeningSessions = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoScreeningSessions = new TableInfo("screening_sessions", _columnsScreeningSessions, _foreignKeysScreeningSessions, _indicesScreeningSessions);
        final TableInfo _existingScreeningSessions = TableInfo.read(_db, "screening_sessions");
        if (! _infoScreeningSessions.equals(_existingScreeningSessions)) {
          return new RoomOpenHelper.ValidationResult(false, "screening_sessions(com.nura.app.database.ScreeningSession).\n"
                  + " Expected:\n" + _infoScreeningSessions + "\n"
                  + " Found:\n" + _existingScreeningSessions);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "82c78d4f002a7e44a608514bd797944c", "b65ea6e4b2efea67bab1d964b2f1df7b");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(configuration.context)
        .name(configuration.name)
        .callback(_openCallback)
        .build();
    final SupportSQLiteOpenHelper _helper = configuration.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "patients","screening_sessions");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    boolean _supportsDeferForeignKeys = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP;
    try {
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = FALSE");
      }
      super.beginTransaction();
      if (_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA defer_foreign_keys = TRUE");
      }
      _db.execSQL("DELETE FROM `patients`");
      _db.execSQL("DELETE FROM `screening_sessions`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = TRUE");
      }
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(PatientDao.class, PatientDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ScreeningSessionDao.class, ScreeningSessionDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  public List<Migration> getAutoMigrations(
      @NonNull Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecsMap) {
    return Arrays.asList();
  }

  @Override
  public PatientDao patientDao() {
    if (_patientDao != null) {
      return _patientDao;
    } else {
      synchronized(this) {
        if(_patientDao == null) {
          _patientDao = new PatientDao_Impl(this);
        }
        return _patientDao;
      }
    }
  }

  @Override
  public ScreeningSessionDao screeningSessionDao() {
    if (_screeningSessionDao != null) {
      return _screeningSessionDao;
    } else {
      synchronized(this) {
        if(_screeningSessionDao == null) {
          _screeningSessionDao = new ScreeningSessionDao_Impl(this);
        }
        return _screeningSessionDao;
      }
    }
  }
}
