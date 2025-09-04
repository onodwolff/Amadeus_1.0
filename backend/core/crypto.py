import os
from cryptography.fernet import Fernet, InvalidToken

def _get_key() -> bytes:
    k = os.getenv("ENCRYPTION_KEY", "")
    if not k:
        # Dev fallback: generate ephemeral key (not for prod)
        k = Fernet.generate_key().decode()
        os.environ["ENCRYPTION_KEY"] = k
    return k.encode()

def encrypt(plaintext: str) -> str:
    f = Fernet(_get_key())
    return f.encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    f = Fernet(_get_key())
    try:
        return f.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return ""
