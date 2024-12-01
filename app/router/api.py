import importlib
import sys
from os.path import dirname, abspath
from fastapi import APIRouter, Request
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
async def get_api (request: Request, call_api: str) :

    if call_api == "group" : return get_group()
    
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