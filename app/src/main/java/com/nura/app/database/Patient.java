package com.nura.app.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "patients")
public class Patient {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "nama_pasien")
    public String namaPasien;

    @ColumnInfo(name = "tanggal_lahir")
    public String tanggalLahir; // format: "YYYY-MM-DD"

    @ColumnInfo(name = "jenis_kelamin")
    public String jenisKelamin; // "L" or "P"

    @ColumnInfo(name = "created_at")
    public long createdAt;
}
