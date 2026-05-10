# backend/services/key_vault_service.py
import hashlib
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.config.settings import settings

def _derive_key(user_id: str) -> bytes:
    master_key = settings.master_encryption_key.encode()
    salt = user_id.encode()
    # Using scrypt to derive a 256-bit key
    key = hashlib.scrypt(
        master_key,
        salt=salt,
        n=2**14, r=8, p=1, dklen=32
    )
    return key

def encrypt_api_key(api_key: str, user_id: str) -> str:
    key = _derive_key(user_id)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, api_key.encode(), None)
    # Return base64 of nonce + ciphertext
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_api_key(encrypted: str, user_id: str) -> str:
    key = _derive_key(user_id)
    aesgcm = AESGCM(key)
    
    try:
        data = base64.b64decode(encrypted.encode('utf-8'))
        nonce = data[:12]
        ciphertext = data[12:]
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode('utf-8')
    except Exception as e:
        raise ValueError("Failed to decrypt API key") from e
