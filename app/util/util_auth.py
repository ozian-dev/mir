import re
import json
import bcrypt
import hashlib
import httpx
import copy

from app.util import util_db, util_cipher
from app.conf import const

async def check_login ( group: int, params: object) :

    if "id" not in params or "pwd" not in params : return False

    param_grp = {"grp":group}
    query = "select name, auth from grp where live = 'Y' and idx = #{grp}"
    res = util_db.select_db(0, query, param_grp)

    if "data" in res and len(res["data"][0]) > 0 :

        login_info =  json.loads(res["data"][0]["auth"])

        if check_patten (login_info, "id", params["id"]) == False : return False
        if check_patten (login_info, "pwd", params["pwd"]) == False : return False

        if login_info["type"] == "generic" : 
            login_res = await check_login_generic ( login_info, params)

        elif login_info["type"] == "custom" :

            login_res = await check_login_custom (login_info, params)

        else : return False

    else : return False

    if isinstance(login_res, dict) : 
        login_res["grp"] = group
        login_res["grp_name"] = res["data"][0]["name"]
    return login_res


async def check_login_generic(info, params) :

    res = util_db.select_db(info["datasource"], info["login_check"]["query"], params)
    is_valid_user = False

    if "data" in res and len(res["data"]) == 1:
        enc_info = res["data"][0]
        if "encryption" in info and info["encryption"] != "" :

            if info["encryption"] == "bcrypt" :
                is_valid_user = bcrypt.checkpw(params["pwd"].encode('utf-8'), enc_info["pwd"].encode('utf-8'))

            elif info["encryption"] == "md5" :
                if enc_info["pwd"] == hashlib.md5(params["pwd"].encode()).hexdigest() :
                    is_valid_user = True

            else :
                if enc_info["pwd"] == params["pwd"] :
                    is_valid_user = True

    if is_valid_user :
        del enc_info["pwd"]
        return enc_info
    
    return False

async def check_login_custom(info, params) :
    if "url_login" in info :
        async with httpx.AsyncClient() as client:
            response = await client.post(info["url_login"], data=params)
            if response.status_code == 200:
                obj = json.loads(response.text)
                if obj["status"] == "ok" : return obj["data"]

    return False


def change_pwd (group: int, params: object) :

    if "id" not in params or "pwd" not in params : return False

    is_res = False

    param_grp = {"grp":group}
    query = const.SQLS["auth"]
    res = util_db.select_db(0, query, param_grp)

    if "data" in res and len(res["data"]) > 0 :

        login_info =  json.loads(res["data"][0]["auth"])

        if check_patten (login_info, "pwd", params["pwd"]) == False : return False

        if login_info["type"] == "generic" :

            if "encryption" in  login_info and  login_info["encryption"] != "" :
                new_pwd = params["pwd"]

                if  login_info["encryption"] == "bcrypt" :
                    new_pwd = bcrypt.hashpw(new_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') 

                elif  login_info["encryption"] == "md5" :
                    new_pwd == hashlib.md5(new_pwd.encode()).hexdigest()

                params["pwd"] = new_pwd
                res_db = util_db.execute_db( login_info["datasource"], [ login_info["change_pwd"]["query"]], [params])
                is_res = True

    return is_res

def is_login ( group: int, cookies: object = None) :

    if cookies is None : return None
    if f"{const.APP_NAME}.{group}.l" not in cookies : return False
    if f"{const.APP_NAME}.{group}.e" not in cookies : return False

    if f"{const.APP_NAME}.{group}.i" not in cookies : return False
    if f"{const.APP_NAME}.{group}.l" not in cookies : return False

    try:
        obj = util_cipher.decrypt_json(cookies[f"{const.APP_NAME}.{group}.e"])
    except :
        return False

    if obj["id"] != cookies[f"{const.APP_NAME}.{group}.i"] or obj["level"] != cookies[f"{const.APP_NAME}.{group}.l"] : 
        return False

    return True

def check_patten (info, target, str) :

    if "validation" in info :

        type_arr = []
        special_chars = ""

        if target in info["validation"] :
            
            if "length" in info["validation"][target] : 
                if "max" in info["validation"][target]["length"] : 
                    if len(str) > info["validation"][target]["length"]["max"] : return False
                if "min" in info["validation"][target]["length"] : 
                    if len(str) < info["validation"][target]["length"]["min"] : return False

            if "general" in info["validation"][target] : 
                type_arr.extend(info["validation"][target]["general"])

            if "custom" in info["validation"][target] :
                type_arr.append("custom")
                special_chars = info["validation"][target]["custom"]
                type_arr.extend(info["validation"][target]["general"])

            if info["validation"][target]["match"] == "only" : return check_only_patten (type_arr, str, special_chars)
            elif info["validation"][target]["match"] == "all" : return check_all_patten (type_arr, str, special_chars)
            else : return False

    return True

def check_all_patten (type_arr:object, str, special_chars="") :

    for type in type_arr:
        if type == "alphabet" : 
            if bool(re.search(r'[a-z]', str)) == False : return False
        elif type == "capital" : 
            if bool(re.search(r'[A-Z]', str)) == False : return False
        elif type == "number"  : 
            if bool(re.search(r'[0-9]', str)) == False : return False
        elif type == "custom" and special_chars != "" : 
            pattern = f"[{re.escape(special_chars)}]"
            if bool(re.search(pattern, str)) == False : return False
    
    return True


def check_only_patten (type_arr:object, str, special_chars="") : 

    cloned_str = copy.copy(str)

    for type in type_arr:

        if type == "alphabet" : 
            cloned_str = re.sub(r'[a-z]', '', cloned_str)
        elif type == "capital" : 
            cloned_str = re.sub(r'[A-Z]', '', cloned_str)
        elif type == "number"  : 
            cloned_str = re.sub(r'[0-9]', '', cloned_str)
        elif type == "custom" and special_chars != "" : 
            pattern = f"[{re.escape(special_chars)}]"
            cloned_str = re.sub(pattern, '', cloned_str)

    if len(cloned_str) == 0 : return True
    else : return False
    

