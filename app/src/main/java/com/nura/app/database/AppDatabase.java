package com.nura.app.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {Patient.class, ScreeningSession.class}, version = 1, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {
    private static volatile AppDatabase INSTANCE;

    public abstract PatientDao patientDao();
    public abstract ScreeningSessionDao screeningSessionDao();

    public static AppDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                                    AppDatabase.class, "nura_database")
                            .fallbackToDestructiveMigration()
                            .allowMainThreadQueries() // Enabled for simple execution in Hackathon MVP
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
