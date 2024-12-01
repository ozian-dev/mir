import importlib
import sys
from os.path import dirname, abspath
from fastapi import APIRouter, Request
from app.conf import const

router = APIRouter()

@router.post("/{call_custom}")
async def post_custom (request: Request, call_custom: str) :

    root_dir = dirname(dirname(dirname(dirname(abspath(__file__)))))
    sys.path.append(root_dir)

    module_name = f"{const.APP_NAME}_custom.{call_custom}"
    module = dynamic_import(module_name)

    return await module.run(request)

@router.get("/{call_custom}")
async def get_custom (request: Request, call_custom: str) :

    root_dir = dirname(dirname(dirname(dirname(abspath(__file__)))))
    sys.path.append(root_dir)

    module_name = f"{const.APP_NAME}_custom.{call_custom}"
    module = dynamic_import(module_name)

    return await module.run(request)

def dynamic_import(module_name):
    return importlib.import_module(module_name)
