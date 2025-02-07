"""

# Upon initial installation, users must be pre-created as follows.
# your_username: DB user ID
# your_password: DB user password
# your_database: Name of the database to be created

CREATE USER IF NOT EXISTS 'your_username'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database.* TO 'your_username'@'%';
FLUSH PRIVILEGES;

"""

import sys
import os
import shutil
import uuid

import random
import string

sys.path.append('./app/util')
from app.util import util_file, util_db

APP = "mir"
with open("./ref/version.txt", "r") as file:
    VER = file.read().strip()
LANG = "en"

conf_file = '_conf/conf.json'
log_file = '_data/log'
main_sql_file = 'db/sql.main.txt'
zetetic_sql_file = 'db/sql.zetetic.txt'

util_file.make_directory('_conf')
util_file.make_directory('_conf/keys')
util_file.make_directory(log_file)

conf = {}

def set_main (db_info) :

    sql = util_file.load_file (main_sql_file)
    sql = sql.replace ("<<<<APP>>>>", APP)
    sql += f"""
    insert into source(type, timezone, charset, collation, name, host, port, user, pwd, db, permit) 
    values('0201','{db_info['timezone']}','{db_info['charset']}','{db_info['collation']}','{APP} DB','{db_info['host']}',{db_info['port']},'{db_info['user']}','{db_info['password']}','{db_info['database']}','{db_info['permit']}');
    """
    util_db.import_db_mysql(0, sql)
    print(f"++ {db_info['database']} main DB is done.")

def set_zetetic (db_info) :

    sql = util_file.load_file (zetetic_sql_file)
    util_db.import_db_mysql(0, sql)
    print(f"++ {db_info['database']} zetetic DB is done.")

# Receive input from the user
if os.path.isfile(conf_file) is False:

    start_db = {}

    input_app = input(f"Input 'App name' (ex: mir, default:mir): ")
    if input_app != "" : APP = input_app

    input_ver = input(f"Input 'App version' (ex: 1.0, default:1.0): ")
    if input_ver != "" : VER = input_ver

    input_lang = input(f"Input the language you want to use. (ex: ko, default:en): ")
    if input_lang != "" : LANG = input_lang

    start_db['type'] = input(f"Input '{APP} DB' server type (ex: mariadb, mysql, default:mariadb): ")
    if start_db['type'] == "": start_db['type'] = "mariadb"

    start_db['host'] = input(f"Input '{APP} DB' server host (ex: 127.0.0.1, default:127.0.0.1): ")
    if start_db['host'] == "": start_db['host'] = "127.0.0.1"

    start_db['port'] = input(f"Input '{APP} DB' server port (ex: 3306, default:3306): ")
    if start_db['port'] == "": start_db['port'] = 3306
    else : start_db['port'] = int(start_db['port'])

    start_db['user'] = input(f"Input '{APP} DB' user (ex: user, default:root): ")
    if start_db['user'] == "": start_db['user'] = "root"

    start_db['password'] = input(f"Input '{APP} DB' password (ex: password, default:test): ")
    if start_db['password'] == "": start_db['password'] = "test"

    db_name = APP.replace(" ", "_").lower() + "_db"
    start_db['database'] = input(f"Input '{APP} DB' database name (ex: {APP}, default:{db_name}_[random 6-characters]): ")
    if start_db['database'] == "": 
        seed = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        start_db['database'] = f"{db_name}_{seed}"

    input_timezone = input("Input your timezone (ex: Asia/Seoul, default:Asia/Seoul): ")
    if input_timezone != "" : timezone = input_timezone
    else : timezone = "Asia/Seoul"

    input_charset = input("Input your charset (ex: utf8mb4, default:utf8mb4): ")
    if input_charset != "" : charset = input_charset
    else : charset = "utf8mb4"

    input_collation = input("Input your collation (ex: utf8mb4_general_ci, default:utf8mb4_general_ci): ")
    if input_collation != "" : collation = input_collation
    else : collation = "utf8mb4_general_ci"

    input_color = input("Input color template (ex: red/green/blue/black, default:'blue'): ")
    if input_color != "" : color = input_color
    else : input_color = "blue"

    inpust_css = input("Input your custom css (ex: https://example.com/css/example.css, default:''): ")
    if inpust_css != "" : css = inpust_css
    else : css = ""

    custom_favicon = input("Do you use custom favicon.ico file (y/n) (default:'n'): ")
    if custom_favicon != "y" : custom_favicon = "n"

    print("If further modifications are needed, please edit the './_conf/conf.json' file.")

    start_db['permit'] = "0302"
    start_db['timezone'] = timezone
    start_db['charset'] = charset
    start_db['collation'] = collation
    start_db['idx'] = 0

    conf["start_db"] = start_db
    conf["enc_key"] = str(uuid.uuid4()).replace("-", "")
    conf["timezone"] = timezone
    conf["style"] = { "css" : [css], "color" : input_color }
    conf["app"] = {}
    conf["app"]["name"] = APP
    conf["app"]["ver"] = VER
    conf["locale"] = {}
    conf["locale"]["lang"] = LANG
    conf["keys"] = {}
    conf["keys"]["gcs"] = "google.gcs.key.json"
    conf["keys"]["s3"] = "aws.s3.token.json"
    conf["keys"]["fcm"] = "google.fcm.key.json"


    if custom_favicon == "y" :
        conf["style"]["favicon"] = "./_conf/style"

    util_file.write_json_file(conf, conf_file, 4)
    
    db_info = {}
    db_info["host"] = start_db['host']
    db_info["port"] = start_db['port']
    db_info["database"] = ""
    db_info["user"] = start_db['user']
    db_info["password"] = start_db['password']
    db_info["timezone"] = start_db['timezone']
    db_info["charset"] = start_db['charset']
    db_info["collation"] = start_db['collation']

    sql = f"CREATE DATABASE IF NOT EXISTS {start_db['database']}"    
    util_db.execute_db_mysql(db_info, [sql])

    conf = util_file.load_json_file(conf_file)
    db_info = util_db.get_start_db(conf_file)

    set_main (db_info)
    set_zetetic (db_info)

    print(f"++ {db_info['database']} database is created.")

    api_path = f"../mir_api"
    if not os.path.exists(api_path):
        os.makedirs(api_path)
    shutil.copy("./ref/sample_login.py", f"{api_path}/")

    custom_path = f"../mir_custom"
    if not os.path.exists(custom_path):
        os.makedirs(custom_path)
    shutil.copy("./ref/sample_custom.py", f"{custom_path}/")

else:

    conf = util_file.load_json_file(conf_file)
    db_info = util_db.get_start_db(conf_file)

    APP = conf["app"]["name"]
    LANG = conf["locale"]["lang"]

    is_reset_main = input(f"1. Would you like to reset the main database? (y/n) ")
    if is_reset_main == "y" : set_main (db_info)

    is_reset_zetetic = input("2. Would you like to reset the zetetic database? (y/n) ")
    if is_reset_zetetic == "y" : set_zetetic (db_info)
