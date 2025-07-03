import mysql.connector
import hashlib
import logging
import re
import copy

from decimal import Decimal as decimal
from datetime import date, datetime
from google.cloud import bigquery

from app.util import util_file, util_library
from app.conf import const

logger = logging.getLogger()

def get_start_db (file = None) :
    if file is None :
        if "start_db" in const.CONF : 
            return const.CONF["start_db"]
        else : 
            return util_file.load_json_file(const.FILE_CONF)["start_db"]
    else :
        return util_file.load_json_file(file)["start_db"]

def get_db(i: int):

    if i == 0 : return get_start_db()

    sql = const.SQLS["datasource"]
    result_db = select_db (const.CONF["start_db"]["idx"], sql, {"idx":i})

    if len(result_db["data"][0]) > 0 :
        return result_db["data"][0]
    else : 
        print(f"db idx:{i}")
        raise(Exception("no db"))

## select functions

def select_db (i: int, sql: str, params: object = None, ttl: int = 0, is_raw: bool = False) :

    cache_file_name = get_cache_file_name(i, sql, params)
    res_db = {}

    if is_cached (i, sql, params, ttl, is_raw) :
        res_db = util_file.load_json_file(cache_file_name)
    
    else :
        db_info = get_db(i)

        if db_info["type"] == "mariadb" or db_info["type"] == "mysql" : 
            res_db = select_db_mysql (db_info, sql, params, is_raw)
        elif db_info["type"] == "bigquery" :
            res_db = select_db_bigquery (db_info, sql, params, is_raw)

        if ttl != 0 : util_file.write_json_file(res_db, cache_file_name)

    last_update = "just now"
    if ttl != 0 : last_update = util_file.get_file_modified_time_gap(cache_file_name)
    
    return { "data" : res_db, "last_update" : last_update }

def select_db_mysql (db_info: object, sql: str, params: object = None, is_raw: bool = False) :

    timezone_offset = util_library.get_timezone_offset(db_info["timezone"])
    conn = mysql.connector.connect(**{ "host": db_info["host"], "port": db_info["port"], "database": db_info["database"], "user":db_info["user"], "password":db_info["password"],"use_unicode":True, "charset":db_info["charset"], "collation":db_info["collation"], })
    cursor = conn.cursor()
    cursor.execute(f"SET time_zone = '{timezone_offset}'")

    if params is None : params = {}
    params_copied = copy.deepcopy(params)
    if "@data" in params_copied : del params_copied["@data"]
    if "@custom" in params_copied : del params_copied["@custom"]
        
    sql = get_parsed_query(sql, params_copied)
    cursor.execute (sql, params_copied)

    rows = cursor.fetchall()
    columns = cursor.column_names

    if is_raw : 
        return {"data":rows, "cols":columns}

    result = get_result (columns, rows)

    cursor.close()
    conn.close()

    return result


def select_db_bigquery (db_info: object, sql: str, params: object = None, is_raw: bool = False) :

    service_account_path = f"{const.PATH_KEY}/{db_info['user']}"
    client = bigquery.Client.from_service_account_json(service_account_path)

    sql = get_parsed_query(sql, params)
    query_job = client.query(sql)

    result = query_job.result()
    result_list = []

    for row in result:
        row_dict = {
            key: float(value) if isinstance(value, decimal) else value
            for key, value in row.items()
        }
        result_list.append(row_dict)

    return result_list


## execute functions

def execute_db (i: int, sqls: object, params: object = None, commit: bool = True, split: object = None, prework: object = None) :
    db_info = get_db(i)
    return execute_db_mysql (db_info, sqls, params, commit, split, prework)

'''
    예약어 :

    @db_id_{loop_cnt} -> sqls level 임
    @sys_seq -> post["data"] level 임

'''
def execute_db_mysql (db_info: object, sqls: object, params: object = None, commit: bool = True, split: object = None, prework: object = None) :

    # table update 와 같은 경우, 여러 data 가 올수 있다. 즉, post 의 data 항목이 array 로 되어있다.
    if params is None : params = [{}]

    timezone_offset = util_library.get_timezone_offset(db_info["timezone"])
    conn = mysql.connector.connect(**{ "host": db_info["host"], "port": db_info["port"], "database": db_info["database"], "user":db_info["user"], "password":db_info["password"],"use_unicode":True, "charset":db_info["charset"], "collation":db_info["collation"], })
    cursor = conn.cursor()
    cursor.execute(f"SET time_zone = '{timezone_offset}'")

    try :
        if prework is not None :
            for param in prework["params"]:
                for sql in prework["query"] :
                    sql = get_parsed_query(sql, param)
                    cursor.execute(sql, param)

        result_arr = []
        data_cnt = 0
        
        for param in params:
            if param is not None : param["@sys_seq"] = data_cnt * 10 + 10
            sql_cnt = 0
            for sql in sqls :
                if sql.strip():
                    if split and f"{sql_cnt}" in split :
                        cloned_param = param.copy()
                        split_obj = {}
                        for column in split[f"{sql_cnt}"] :
                            split_str = f"{cloned_param[column]}"
                            split_values = split_str.split(",")
                            split_obj[column] = split_values
                            values_cnt = len(split_values)

                        values_cnt = len(split_obj[split[f"{sql_cnt}"][0]])
                        for i in range (values_cnt) :
                            for k, v in split_obj.items() : cloned_param[k] = v[i]
                            sql_new = get_parsed_query(sql, cloned_param)
                            cursor.execute(sql_new, cloned_param)
                        result_arr.append({"result": True})

                    else :
                        sql = get_parsed_query(sql, param)
                        cursor.execute(sql, param)
                        db_id = cursor.lastrowid
                        db_cnt = cursor.rowcount
                        result_arr.append({"result": True, "db_id": db_id, "db_cnt": db_cnt})
                        if db_id > 0 :
                            if params[data_cnt] is None : params[data_cnt] = {}
                            params[data_cnt][f"@db_id_{sql_cnt}"] = db_id
                sql_cnt += 1
            data_cnt += 1

        if commit : conn.commit()
        else : conn.rollback()

    except Exception as e:
        print(e)
        conn.rollback()
        raise Exception(e)
    
    finally :
        cursor.close()
        conn.close()

    return result_arr


def get_result ( columns, data ) :
    
    result = []
    for row in data:
        tmp = {}
        for i, value in enumerate(row) :
            if ( value is None) :
                tmp[columns[i]] = value
            elif isinstance(value, (date, datetime)) :
                tmp[columns[i]] = str(value)
            elif isinstance(value, (decimal)) :
                tmp[columns[i]] = float(value)
            elif isinstance(value, bytearray) :
                tmp[columns[i]] = value.decode('utf-8')
            else :
                tmp[columns[i]] = value
        result.append(tmp)

    return result


def get_mysql_field_type(code):
    if code == mysql.connector.FieldType.TINY:
        return "int"
    elif code == mysql.connector.FieldType.SHORT:
        return "int"
    elif code == mysql.connector.FieldType.LONG:
        return "int"
    elif code == mysql.connector.FieldType.FLOAT:
        return "float"
    elif code == mysql.connector.FieldType.DOUBLE:
        return "float"
    elif code == mysql.connector.FieldType.DECIMAL:
        return "float"
    elif code == mysql.connector.FieldType.NEWDECIMAL:
        return "float"
    elif code == mysql.connector.FieldType.LONGLONG:
        return "int"
    elif code == mysql.connector.FieldType.INT24:
        return "int"
    elif code == mysql.connector.FieldType.BLOB:
        return "string"
    elif code == mysql.connector.FieldType.TINY_BLOB:
        return "string"
    elif code == mysql.connector.FieldType.MEDIUM_BLOB:
        return "string"
    elif code == mysql.connector.FieldType.LONG_BLOB:
        return "string"
    else:
        return "string"


def type_db_mysql (i: int, sql: str, params: object = None) :
    
    db_info = get_db(i)

    conn = mysql.connector.connect(**{ "host": db_info["host"], "port": db_info["port"], "database": db_info["database"], "user":db_info["user"], "password":db_info["password"],"use_unicode":True, "charset":"utf8mb4", "collation":"utf8mb4_general_ci", })
    cursor = conn.cursor()

    sql = get_parsed_query(sql, params)
    cursor.execute (sql, params)
    cursor.fetchall()

    res = {}
    for column in cursor.description:
        res[column[0]] = get_mysql_field_type(column[1])

    cursor.close()
    conn.rollback()
    conn.close()

    return res

def get_parsed_query (query: str, params: object = None) :

    if params is None : params = {}

    ptrn1 = r"\[\[\[(.*?)\]\]\]"
    match_arr1 = re.findall(ptrn1, query)

    for match_str in match_arr1 :
        origin_str = f"{match_str}"

        # check ${} style
        ptrn2 = r"\$\{(.*?)\}"
        match_arr2 = re.findall(ptrn2, match_str)

        if len(match_arr2) > 0 :
            replace_cnt2 = 0 
            for match_str2 in match_arr2 :
                if match_str2 in params : 
                    match_str = match_str.replace(f"${{{match_str2}}}", get_trans_value(params[match_str2]))
                    replace_cnt2 += 1

            if  len(match_arr2) == replace_cnt2 :
                query = query.replace(f"[[[{origin_str}]]]", match_str)
            else :
                query = query.replace(f"[[[{origin_str}]]]", "")

        # check #{} style
        ptrn3 = r"\#\{(.*?)\}"
        match_arr3 = re.findall(ptrn3, match_str)

        if len(match_arr3) > 0 :
            replace_cnt3 = 0 
            for match_str3 in match_arr3 :
                if match_str3 in params : 
                    match_str = match_str.replace(f"#{{{match_str3}}}", f"%({match_str3})s")
                    replace_cnt3 += 1

            if len(match_arr3) > 0 and len(match_arr3) == replace_cnt3 :
                query = query.replace(f"[[[{origin_str}]]]", origin_str)
            else :
                query = query.replace(f"[[[{origin_str}]]]", "")

    ptrn_final = r"\$\{(.*?)\}"
    match_final = re.findall(ptrn_final, query)
    for match_str in match_final :
        if match_str in params : 
            query = query.replace(f"${{{match_str}}}", get_trans_value(params[match_str]))

    ptrn_final = r"\#\{(.*?)\}"
    match_final = re.findall(ptrn_final, query)

    for match_str in match_final :
        if match_str in params : 
            query = query.replace(f"#{{{match_str}}}", f"%({match_str})s")

    return query

def get_trans_value(val) :
    val = str(val)
    val = val.replace("\\", "\\\\")
    val = val.replace("'", "\\'")
    return val

def get_hash_key (sql: str) :

    hash_object = hashlib.sha256()
    hash_object.update(sql.encode())
    hash_key = hash_object.hexdigest()

    return hash_key

def get_cache_file_name (i: int, sql: str, params: object = None, is_raw: bool = False) :

    parsed_sql = get_parsed_query(sql, params)
    if params is not None:
        for key, val in params.items(): 
            parsed_sql = parsed_sql.replace(f"%({key})s", f"{val}")

    hash_key = get_hash_key (parsed_sql) + f"{is_raw}"
    cache_file_name = const.PATH_DATA_CACHE + "/" + str(i)

    if (util_file.check_make_directory(cache_file_name)) : 
        cache_file_name = cache_file_name+ "/" + hash_key
        return cache_file_name
    else : 
        return ""

def is_cached(i: int, sql: str, params: object = None, ttl: int = 0, is_raw: bool = False) :
    
    if ttl == 0 : return False

    cache_file_name = get_cache_file_name(i, sql, params, is_raw)
    gap = util_file.get_file_modified_time_gap(cache_file_name, True)

    if gap == "none" : return False
    elif gap < ttl : return True
    else : return False


def import_db_mysql(i: int, sql: str):
    db_info = get_db(i)

    conn = mysql.connector.connect(
        host=db_info["host"],
        port=db_info["port"],
        database=db_info["database"],
        user=db_info["user"],
        password=db_info["password"],
        use_unicode=True,
        charset="utf8mb4",
        collation="utf8mb4_general_ci",
    )
    cursor = conn.cursor()
    

    try :

        # Execute multi query
        result_arr = []
        for result in cursor.execute(sql, multi=True):
            if result.with_rows:
                result_arr.extend(result.fetchall())
            else:
                res_obj = {"rowcount": result.rowcount, "statement": result.statement}
                result_arr.append(res_obj)
        conn.commit()

    except Exception as e:
        print(e)
        conn.rollback()
        raise Exception(e)
    
    finally :
        cursor.close()
        conn.close()
    
    return result_arr