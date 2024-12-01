
import firebase_admin
from firebase_admin import credentials, messaging

from app.conf import const

# initialize a firebase project
def init_firebase(key_file=None):

    if key_file is None : key_file = f"{const.PATH_KEY}/{const.CONF['keys']['fcm']}"
    cred = credentials.Certificate(key_file)
    firebase_admin.initialize_app(cred)


def send_aos(token, title, body):

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token,
    )
    try:
        response = messaging.send(message)
        return {"result":"9510", "fail_msg": ""}
    except Exception as e:
        return {"result":"9590", "fail_msg": str(e)}


def send_ios(token, title, body, badge=None):

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload (
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=title,
                        body=body,
                    ),
                    badge=badge,
                    sound="default",
                ),
            ),
        ),
    )

    try:
        response = messaging.send(message)
        return {"result":"9510", "fail_msg": ""}
    except Exception as e:
        return {"result":"9590", "fail_msg": str(e)}
