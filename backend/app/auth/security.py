import hashlib
import hmac
import os

# scrypt is a deliberately slow, memory-hard KDF built into Python's stdlib
# (via OpenSSL) — no bcrypt/passlib dependency needed for a project that
# otherwise avoids adding packages when the stdlib already covers it.
_N, _R, _P, _DKLEN = 2**14, 8, 1, 32


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, dklen=_DKLEN)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, hash_hex = stored.split("$")
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return False
    dk = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, dklen=_DKLEN)
    return hmac.compare_digest(dk.hex(), hash_hex)


def new_token() -> str:
    return os.urandom(24).hex()
