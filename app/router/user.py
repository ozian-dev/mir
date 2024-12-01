import json

from fastapi import APIRouter, Request
from app.util import util_db, util_param, util_auth
from app.conf import const

import logging
logger = logging.getLogger()

router = APIRouter()

@router.get("/check")
async def check(request: Request):
    
    params = util_param.get_init_info(request, only_params = True)
    grp = int(params[".g"])

    if grp < 1 : 
        pass
    else :
        params= {"grp":grp}
        sql = const.SQLS["auth"]
        rows = util_db.select_db(0, sql, params)

    res = {}
    res["status"] = "ok"
    res["data"] = {}
    res["data"]["chpwd"] = False

    if "data" in rows and len(rows["data"]) == 1 :
        obj = json.loads(rows["data"][0]["auth"])
        if obj["type"] == "generic" and "change_pwd" in obj : res["data"]["chpwd"] = True

    return res


@router.post("/chpwd")
async def chpwd(request: Request):

    post = await request.json()
    params = util_param.get_init_info(request, post, only_params = True)

    grp = int(params[".g"])
    if grp < 1 : raise (Exception("")) 

    res = {}
    res["status"] = "fail"

    if "cur_pwd" not in params or "new_pwd1" not in params or "new_pwd2" not in params:
        res["msg"] = "empty parameter"
    elif params["cur_pwd"] == "" or params["new_pwd1"] == "" or params["new_pwd2"] == "":
        res["msg"] = "empty parameter"
    elif params["new_pwd1"] != params["new_pwd2"]:
        res["msg"] = "'confirm new password' is different from 'new password'"
    
    else:
        param = {"id": params["@id"], "pwd": params["cur_pwd"]}

        login_res = await util_auth.check_login (grp, param)
        if login_res == False : 
            res["msg"] = "invalid current password"

        else :
            param = {"id": params["@id"], "pwd": params["new_pwd1"]}
            if util_auth.change_pwd (grp, param) :
                res["status"] = "ok"
                
    return res