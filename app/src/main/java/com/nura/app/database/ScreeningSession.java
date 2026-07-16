package com.nura.app.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.PrimaryKey;

@Entity(
    tableName = "screening_sessions",
    foreignKeys = @ForeignKey(
        entity = Patient.class,
        parentColumns = "id",
        childColumns = "patient_id",
        onDelete = ForeignKey.CASCADE
    )
)
public class ScreeningSession {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "patient_id")
    public int patientId;

    @ColumnInfo(name = "usia_tahun")
    public int usiaTahun;

    @ColumnInfo(name = "usia_bulan")
    public int usiaBulan;

    @ColumnInfo(name = "foto_muka_path")
    public String fotoMukaPath;

    @ColumnInfo(name = "foto_mata_path")
    public String fotoMataPath;

    @ColumnInfo(name = "foto_kuku_path")
    public String fotoKukuPath;

    @ColumnInfo(name = "analisis_muka")
    public String analisisMuka;

    @ColumnInfo(name = "analisis_mata")
    public String analisisMata;

    @ColumnInfo(name = "analisis_kuku")
    public String analisisKuku;

    @ColumnInfo(name = "jawaban_kuesioner")
    public String jawabanKuesioner; // JSON String

    @ColumnInfo(name = "analisis_gabungan")
    public String analisisGabungan;

    @ColumnInfo(name = "rekomendasi")
    public String rekomendasi;

    @ColumnInfo(name = "level_risiko")
    public String levelRisiko; // rendah, sedang, tinggi

    @ColumnInfo(name = "created_at")
    public long createdAt;
}
