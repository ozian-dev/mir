import os
import json
import mimetypes
import io
import uuid
import shutil
import time

from datetime import datetime
from google.cloud import storage
from google.oauth2 import service_account

import boto3
from botocore.exceptions import NoCredentialsError

from app.conf import const

def check_make_directory (dir_path: str) :
    path_arr = dir_path.split("/")
    path_str = ""
    try :
        for p in path_arr :
            path_str = os.path.join(path_str, p)
            if not os.path.exists(path_str) : 
                os.makedirs(path_str)
    except : 
        return False
    
    return True

def make_directory (dir_path: str) :
    os.makedirs(dir_path, exist_ok=True)
    return dir_path

def load_json_file(file_path):
    with open(file_path, 'r') as file:
        json_data = json.load(file)
    return json_data

def write_json_file(data, file_path, indent:int=None):
    with open(file_path, 'w') as file:
        if indent is None : json.dump(data, file)
        else : json.dump(data, file, indent=indent)

def write_json_file_force(data, file_path, indent:int=None):
    with open(file_path, 'w') as file:
        if indent is None : json.dump(data, file, default=str)
        else : json.dump(data, file, default=str, indent=indent)

def load_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()

def write_file(data, file_path):
    if isinstance(data, bytes):
        with open(file_path, 'wb') as f:
            f.write(data)
    else :
        with open(file_path, 'w') as f:
            f.write(data)

def delete_file(file_path):
    try:
        os.remove(file_path)
        return True
    except Exception as e:
        raise Exception(e)

def get_directories(directory_path):
    sub_directories = []
    all_names = os.listdir(directory_path)
    for name in all_names:
        full_path = os.path.join(directory_path, name)
        if os.path.isdir(full_path):
            sub_directories.append(full_path) 
    return sub_directories

def get_files(directory_path):
    sub_files = []
    all_names = os.listdir(directory_path)
    for name in all_names:
        full_path = os.path.join(directory_path, name)
        if os.path.isfile(full_path) and not name.startswith('.') :
            sub_files.append(full_path) 
    return sub_files

def get_file_modified_time (file_path: str) :
    if os.path.exists(file_path) == False : return "" 
    if (os.path.getmtime(file_path)) : return os.path.getmtime(file_path)
    else : return "" ;

def get_file_modified_time_gap (file_path: str, is_raw: bool = False) :
    
    file_time = get_file_modified_time(file_path)
    if file_time == "" : return "none"
    else :
        gap = round ( (file_time - datetime.now().timestamp()) / 60 ) * -1
        if is_raw : return gap

        if gap < 1 : return "just now"
        else : return f"{gap} min. ago"


def save_with_backup(new_content: str, file_path: str, max_backups: int = 10):
    dir_name = os.path.dirname(file_path) or "."
    base_name = os.path.basename(file_path)
    name, ext = os.path.splitext(base_name)

    if os.path.exists(file_path):
        timestamp = datetime.now().strftime("%y%m%d.%H%M%S")
        backup_name = f"{name}{ext}.{timestamp}"
        backup_path = os.path.join(dir_name, backup_name)

        shutil.copy2(file_path, backup_path)

        backups = sorted(
             [f for f in os.listdir(dir_name) if f.startswith(name + ext + ".")]
        )
        while len(backups) > max_backups:
            oldest = backups.pop(0)
            os.remove(os.path.join(dir_name, oldest))

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)




def get_extension(filename):
    return filename.rsplit('.', 1)[-1].lower()


def upload (upload_info, file) :

    file_info = {}
    file_info["date"] = datetime.now().strftime("%y%m%d")
    file_info["time"] = datetime.now().strftime("%H%M%S")
    file_info["name"] = file.filename.rsplit('.', 1)[0].lower()
    file_info["mime"] = file.content_type
    file_info["ext"] = file.filename.rsplit('.', 1)[-1].lower()
    file_info["hash"] = str(uuid.uuid4()).replace("-", "")
    file_info["path"] = make_directory(f"{upload_info["upload_path"]}/{upload_info["user"]}") + f"/{file_info["hash"]}"
    
    with open( file_info["path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        file.file.close()

    if upload_info["type"] == "gcs" : res = upload_gcs(upload_info, file_info)
    elif upload_info["type"] == "s3" : res = upload_s3(upload_info, file_info)
    else  : res = upload_server(upload_info, file_info)

    res["return"] = upload_info["return"]
    return res


def upload_server (upload_info, file_info) :

    upload_info["return"] = "url"

    file_name = f"{file_info["name"]}.{file_info["time"]}.{file_info["ext"]}"
    server_path = make_directory(f"{upload_info["asset_path"]}/{upload_info["idx"]}/{file_info["date"]}") + f"/{file_name}"
    url_link = f"{upload_info["idx"]}/{file_info["date"]}/{file_name}"

    try:
        shutil.move(file_info["path"], server_path)

    except Exception as e:
        raise Exception(e)

    res = {}
    res["filename"] = file_name
    res["url"] = url_link
    res["mime"] = file_info["mime"]
    
    return res

def upload_gcs (upload_info, file_info) :

    start = f"d/{file_info["date"]}"

    file_name = f"{file_info["name"]}.{file_info["time"]}.{file_info["ext"]}"
    if "filename" in upload_info : 
        file_name = upload_info["filename"]
        start = "f"

    gcs_path = f"{upload_info["path_cloud"]}/{start}/{file_name}"
    url_link = f"{upload_info["path_url"]}/{start}/{file_name}"

    content_type = file_info["mime"]

    try:
        key_path = f"{const.PATH_KEY}/{const.CONF['keys']['gcs']}"
        credentials = service_account.Credentials.from_service_account_file(key_path)
        client = storage.Client(credentials=credentials)

        bucket = client.get_bucket(upload_info["bucket"])
        blob = bucket.blob(gcs_path)
        blob.cache_control = "no-store"
        blob.upload_from_file(io.open(file_info["path"], 'rb'), content_type=content_type)

        delete_file(file_info["path"])

    except Exception as e:
        raise Exception(e)

    res = {}
    res["filename"] = file_name
    res["url"] = url_link
    res["mime"] = file_info["mime"]
    
    return res


def upload_s3 (upload_info, file_info) :

    start = f"d/{file_info["date"]}"

    file_name = f"{file_info["name"]}.{file_info["time"]}.{file_info["ext"]}"
    if "filename" in upload_info : 
        file_name = upload_info["filename"]
        start = "f"

    s3_path = f"{upload_info["path_cloud"]}/{start}/{file_name}"
    url_link = f"{upload_info["path_url"]}/{start}/{file_name}"

    content_type = file_info["mime"]

    try:
        s3_info = load_json_file(f"{const.PATH_KEY}/{const.CONF['keys']['s3']}")
        
        session = boto3.Session(region_name=s3_info["aws_region_name"])
        s3 = session.client('s3', 
                        aws_access_key_id=s3_info["aws_access_key_id"],
                        aws_secret_access_key=s3_info["aws_secret_access_key"])

        bucket = upload_info["bucket"]
        with open(file_info["path"], 'rb') as file:
            s3.upload_fileobj(file, bucket, s3_path, ExtraArgs={'ContentType': content_type})
        
        purge_s3(f"/{s3_path}")
        delete_file(file_info["path"])

    except FileNotFoundError as e:
        raise Exception(e)
    except NoCredentialsError as e:
        raise Exception(e)
    except Exception as e:
        raise Exception(e)

    res = {}
    res["filename"] = file_name
    res["url"] = url_link
    res["mime"] = file_info["mime"]
    
    return res


def purge_s3(path) :

    """
    uri = f"/client/video/{week_number}/{file_base_name}"
    purge_s3(uri)
    """
    try:
        s3_info = load_json_file(f"{const.PATH_KEY}/{const.CONF['keys']['s3']}")        
        aws_access_key_id = s3_info["aws_access_key_id"]
        aws_secret_access_key = s3_info["aws_secret_access_key"]
        aws_region_name = s3_info["aws_region_name"]
        aws_distribution_id = s3_info["aws_distribution_id"]

        paths = [path]
        cloudfront_client = boto3.client('cloudfront', region_name=aws_region_name,
                                        aws_access_key_id=aws_access_key_id,
                                        aws_secret_access_key=aws_secret_access_key)

        invalidation_request = cloudfront_client.create_invalidation(
            DistributionId=aws_distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': len(paths),
                    'Items': paths
                },
                'CallerReference': 'unique-id-{}'.format(int(round(time.time() * 1000)))
            }
        )
        #print(f"Invalidation Request Path: {path}")
        #print(f"Invalidation Request ID: {invalidation_request['Invalidation']['Id']}")

    except Exception as e:
        print(e)
        raise Exception(e)

def get_content_type(file_name):

    lower_file_name = file_name.lower()

    if lower_file_name.endswith(".json"): return "application/json"
    elif lower_file_name.endswith(".mp4"): return "video/mp4"
    elif lower_file_name.endswith(".webm"): return "video/webm"
    elif lower_file_name.endswith(".webp"): return "image/webp"
    
    return mimetypes.guess_type(file_name)[0]


def remove_surrounding_slashes(input_string):
    # 문자열이 빈 문자열이거나 None인 경우 처리
    if not input_string:
        return input_string

    # 문자열이 처음과 끝에 슬래시로 둘러싸여 있는지 확인하고 제거
    if input_string.startswith("/") and input_string.endswith("/"):
        return input_string[1:-1]
    elif input_string.startswith("/"):
        return input_string[1:]
    elif input_string.endswith("/"):
        return input_string[:-1]
    else:
        return input_string

def delete_gcs (info, file_array) :

    key_path = f"{const.PATH_KEY}/{const.CONF['keys']['gcs']}"
    credentials = service_account.Credentials.from_service_account_file(key_path)
    client = storage.Client(credentials=credentials)
    bucket = client.get_bucket(info["bucket"])

    for file_name in file_array :
        try:
            target = file_name.replace(info["path_url"], "")
            target = f"{info['path_cloud']}{target}"

            blob = bucket.blob(target)
            blob.delete()

        except Exception as e:
            print(e)

def delete_s3 (info, file_array) :

    s3_info = load_json_file(f"{const.PATH_KEY}/{const.CONF['keys']['s3']}")
    
    session = boto3.Session(region_name=s3_info["aws_region_name"])
    s3 = session.client('s3', 
                    aws_access_key_id=s3_info["aws_access_key_id"],
                    aws_secret_access_key=s3_info["aws_secret_access_key"])

    bucket = info["bucket"]

    for file_name in file_array :
        try:
            target = file_name.replace(info["path_url"], "")
            target = f"{info['path_cloud']}{target}"

            s3.delete_object(Bucket=bucket, Key=target)
            
        except Exception as e:
            print(e)

def delete_server (info, file_array) :

    for file_name in file_array :
        try:
            delete_file(f"{info['asset_path']}/{file_name}")
        except Exception as e:
            print(e)
        
