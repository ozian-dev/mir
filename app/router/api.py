import importlib
import sys
import json
from os.path import dirname, abspath
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from app.util import util_db
from app.conf import const

router = APIRouter()

@router.post("/{call_api}")
async def post_api (request: Request, call_api: str) :

    if call_api == "group" : return get_group()
    
    root_dir = dirname(dirname(dirname(dirname(abspath(__file__)))))
    sys.path.append(root_dir)

    module_name = f"{const.APP_NAME}_api.{call_api}"
    module = dynamic_import(module_name)

    return await module.run(request)

@router.get("/{call_api}")
async def get_api (request: Request, call_api: str, response: Response):

    if call_api == "group" : return get_group()
    """
    elif call_api == "g1r1p" : 
        origin = request.headers.get("origin")
        host = request.headers.get("host", "")
        if host and ("localhost" in host or "127.0.0.1" in host):
            headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Allow-Credentials": "true",
            }
            return JSONResponse(content=get_group(), headers=headers)
        else: raise(Exception("invalid access"))
    """

    root_dir = dirname(dirname(dirname(dirname(abspath(__file__)))))
    sys.path.append(root_dir)

    module_name = f"{const.APP_NAME}_api.{call_api}"
    module = dynamic_import(module_name)

    return await module.run(request)

def dynamic_import(module_name):
    return importlib.import_module(module_name)

def get_group() :

    sql = const.SQLS["grp"]
    rows = util_db.select_db(0, sql)
    rows["status"] = "ok"
    return rows