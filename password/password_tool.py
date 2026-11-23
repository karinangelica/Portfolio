import math
import re
import secrets
import string

MIN_GENERATE_LENGTH = 4

COMMON_PASSWORDS = {
    "password", "password1", "password123", "123456", "12345678", "123456789",
    "qwerty", "qwerty123", "abc123", "admin", "admin123", "letmein",
    "welcome", "111111", "000000",
}


def generate_password(length=16):
    """Buat password acak yang aman secara kriptografis."""
    if length < MIN_GENERATE_LENGTH:
        raise ValueError(
            f"Panjang password minimal {MIN_GENERATE_LENGTH} karakter."
        )

    # menggabungkan semua jenis karakter (total 94 karakter)
    alphabet = string.ascii_letters + string.digits + string.punctuation

    # ulangi sampai ada setidaknya 1 dari setiap jenis karakter
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in string.punctuation for c in password)
        ):
            return password


def calculate_entropy(password):
    """Hitung entropi (dalam bit) dengan rumus E = L x log2(R)."""
    pool_size = 0
    if re.search(r"[a-z]", password):
        pool_size += 26
    if re.search(r"[A-Z]", password):
        pool_size += 26
    if re.search(r"[0-9]", password):
        pool_size += 10
    if re.search(r"[^a-zA-Z0-9]", password):
        pool_size += 32

    if pool_size == 0:
        return 0

    return len(password) * math.log2(pool_size)


def check_password_strength(password):
    """Nilai kekuatan password berdasarkan panjang, kompleksitas, dan entropi."""
    entropy = calculate_entropy(password)

    if len(password) < 8:
        return f"Sangat Lemah (Entropi: {entropy:.2f} bits) - Terlalu pendek!"
    if password.lower() in COMMON_PASSWORDS:
        return (
            f"Sangat Lemah (Entropi: {entropy:.2f} bits) - "
            "Password ini sangat umum dan ada di daftar tebakan pertama penyerang!"
        )
    if entropy < 40:
        return f"Lemah (Entropi: {entropy:.2f} bits) - Mudah di-brute-force."
    if entropy < 60:
        return f"Sedang (Entropi: {entropy:.2f} bits) - Cukup aman."
    if entropy >= 80:
        return f"Sangat Kuat (Entropi: {entropy:.2f} bits) - Aman dari serangan."
    return f"Kuat (Entropi: {entropy:.2f} bits) - Aman untuk penggunaan umum."


def main():
    print("=== Cybersecurity Password Tool ===")
    pilihan = input("1. Cek Password\n2. Generate Password\nPilih (1/2): ").strip()

    if pilihan == "1":
        pwd = input("Masukkan password untuk diuji: ")
        print("Hasil:", check_password_strength(pwd))
    elif pilihan == "2":
        try:
            length = int(input("Masukkan panjang password (min 12 direkomendasikan): "))
            password = generate_password(length)
        except ValueError as e:
            # menangkap input non-angka maupun panjang yang terlalu kecil
            print("Input tidak valid:", e)
            return
        print("Password baru:", password)
        print("Kekuatan     :", check_password_strength(password))
    else:
        print("Pilihan tidak dikenal. Masukkan 1 atau 2.")


if __name__ == "__main__":
    main()
