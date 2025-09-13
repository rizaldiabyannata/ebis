# HepiBite

## Aturan Kolaborasi

1. **Diskusi & Persetujuan**: Sebelum melakukan perubahan besar, diskusikan terlebih dahulu di issue atau pull request.
2. **Code Review**: Setiap perubahan harus melalui proses review sebelum di-merge ke branch utama.
3. **Commit Message**: Gunakan pesan commit yang jelas dan deskriptif.

## Penamaan Branch

Gunakan format berikut untuk penamaan branch:

- `feat/nama-fitur` — Untuk penambahan fitur baru (feature)
- `fix/nama-perbaikan` — Untuk perbaikan bug
- `chore/nama-tugas` — Untuk tugas non-fungsional (misal: update dependensi)
- `docs/nama-dokumentasi` — Untuk perubahan dokumentasi
- `refactor/nama-refactor` — Untuk refaktor kode

Contoh:

```
feat/auth-login
fix/navbar-overlap
chore/update-eslint
```

## Panduan Menjalankan Project (Development)

1. **Install Dependencies**
   Jalankan perintah berikut:

   ```bash
   npm install
   ```

2. **Migrasi Database (Prisma)**
   Jalankan migrasi agar database sesuai dengan schema:

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Menjalankan Project**
   Jalankan server development:

   ```bash
   npm run dev
   ```

4. **(Opsional) Generate Prisma Client**
   Jika ada perubahan pada schema:

   ```bash
   npx prisma generate
   ```

5. **Testing**
   (Tambahkan instruksi testing jika sudah tersedia)

---

Silakan update bagian ini jika ada perubahan workflow atau tools.
