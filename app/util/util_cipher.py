import base64
import json
from urllib import parse

from app.conf import const
from cryptography.fernet import Fernet

def encrypt_json ( obj: object ) :

    enc_key_base64 = base64.urlsafe_b64encode(const.CONF['enc_key'].encode())
    cipher_suite = Fernet(enc_key_base64)
        
    objStr = cipher_suite.encrypt(json.dumps(obj).encode()).decode()
    return objStr

def decrypt_json ( str: str ) :

    str = parse.unquote(str)

    enc_key_base64 = base64.urlsafe_b64encode(const.CONF['enc_key'].encode())
    cipher_suite = Fernet(enc_key_base64)

    dec_obj = cipher_suite.decrypt(str.encode())
    dec_str = dec_obj.decode()

    dec_dict = json.loads(dec_str)

    return dec_dict