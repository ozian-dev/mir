import base64
import json
import os
import time

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

from pywebpush import webpush
from fastapi import Request, HTTPException

from app.conf import const
from app.util import util_file, util_db


def check_ready():

    if 'push' in const.CONF['app'] and \
        'enable' in const.CONF['app']['push'] and \
        const.CONF['app']['push']['enable'] :

        const.WEB_PUSH = True
        if 'public' not in const.CONF['app']['push'] or \
            'private' not in const.CONF['app']['push'] or \
            const.CONF['app']['push']['public'] == '' or \
            const.CONF['app']['push']['private'] == '' :
            
            private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
            public_key = private_key.public_key()

            private_der = private_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

            public_der = public_key.public_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

            vapid_private_key = base64.urlsafe_b64encode(private_der).decode('utf-8').rstrip('=')
            vapid_public_key = base64.urlsafe_b64encode(public_der[26:]).decode('utf-8').rstrip('=')

            const.CONF['app']['push']['private'] = vapid_private_key
            const.CONF['app']['push']['public'] = vapid_public_key
            
            util_file.write_json_file(const.CONF, const.FILE_CONF, 4)


        if 'publisher' not in const.CONF['app']['push'] or \
            const.CONF['app']['push']['publisher'] == '' :
            const.CONF['app']['push']['publisher'] = "publisher@example.com";

            util_file.write_json_file(const.CONF, const.FILE_CONF, 4)

    else:
        const.WEB_PUSH = False


async def subscribe(request: Request):
    data = await request.json()
    data['ui'] = request.cookies.get("ui")
    uid = data.get("uid")
    if not uid or "endpoint" not in data or "keys" not in data:
        raise HTTPException(status_code=400, detail="Invalid subscription data")
    
    add_user(data)

def add_user(data):
    util_file.write_json_file(data, f"{const.PATH_DATA_PUSH}/{data['ui']}")

def get_user(data):
    path = os.path.join (const.PATH_DATA_PUSH, data['ui'])
    if os.path.exists(path):
        os.utime(path, times=(time.time(), time.time()))
        return util_file.load_json_file(path)
    else: 
        return None

def exist_subscription(request):
    ui = request.cookies.get("ui")
    path = os.path.join (const.PATH_DATA_PUSH, ui)
    return os.path.exists(path)

def is_activated():
    return const.WEB_PUSH

def send_msg(data, msg):

    sql = f"select midx from panel where idx = {data['pid']}"
    mid = util_db.select_db(0, sql)["data"][0]['midx']
    push_data = {
        'title': 'New Message',
        'grp': data['grp'],
        'mid': mid,
        'pid': data['pid'],
        'target': data['target'],
        'msg': msg
    }
    subscription = get_user(data)

    try:
        
        if subscription is not None:
            webpush(
                subscription_info={
                    'endpoint': subscription['endpoint'],
                    'keys': subscription['keys']
                },
                data=json.dumps(push_data),
                vapid_private_key=const.CONF['app']['push']['private'],
                vapid_claims={"sub": f"mailto:{const.CONF['app']['push']['publisher']}"}
            )
            return True

    except Exception as e:
        print(f"Push error: {str(e)}")
        return False