
import mysql.connector

from app.conf import const
from app.util import util_library, util_file

def get_db_info(idx, conf_file = None) :

    if conf_file is None : conf_file = const.FILE_CONF

    conf = util_file.load_json_file(conf_file)
    sql = f"select *, db as 'database', pwd as password from source where idx={idx}"
    return select(conf["start_db"], sql)[0]


def select (db_info:object, sql:str, params:object = None) :

    timezone_offset = util_library.get_timezone_offset(db_info["timezone"])
    conn = mysql.connector.connect(**{ "host": db_info["host"], "port": db_info["port"], "database": db_info["database"], "user":db_info["user"], "password":db_info["password"],"use_unicode":True, "charset":"utf8mb4", "collation":"utf8mb4_general_ci", })
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SET time_zone = '{timezone_offset}'")


    if params is None : params = {}
    cursor.execute (sql, params)

    result = cursor.fetchall()

    cursor.close()
    conn.close()

    return result

def execute (db_info:object, sqls:object, params:object = None) :

    timezone_offset = util_library.get_timezone_offset(db_info["timezone"])
    conn = mysql.connector.connect(**{ "host": db_info["host"], "port": db_info["port"], "database": db_info["database"], "user":db_info["user"], "password":db_info["password"],"use_unicode":True, "charset":"utf8mb4", "collation":"utf8mb4_general_ci", })
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SET time_zone = '{timezone_offset}'")

    if params is None : params = [{}]

    try:
        for param in params :
            for sql in sqls :
                cursor.execute(sql, param)
        conn.commit()

    except Exception as e:
        print(e)
        conn.rollback()

    finally:
        if cursor: cursor.close()
        if conn.is_connected(): conn.close()

