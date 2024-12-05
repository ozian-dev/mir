
import asyncio
import logging
import json

from app.conf import const
from app.util import util_db, util_library

logger = logging.getLogger()

async def execute(info, params, callback):
    try:
        query_arr = info["query"]
        res_arr = await asyncio.to_thread(util_db.execute_db, info["datasource"], query_arr, params)
        await callback(info, params, res_arr)
        
    except Exception as e:
        for cid in const.WS_USER[info["@id"]] :
            res_obj = {
                "status": "error",
                "cid": cid,
                "task_alias": info["alias"],
                "task_name": f"action.{info["name"]}",
                "msg": str(e) ,
            }
            await const.WS_USER[info["@id"]][cid].send_text(json.dumps(res_obj))
            
async def call(info, params: object=None):
    task = asyncio.create_task(execute(info, params, callback))
    return True

async def callback(info, params: object=None, res_arr: object=None) :

    params[0]["@ip"] = info["@ip"]
    params[0]["@id"] = info["@id"]
    params[0]["@level"] = info["@level"]
    
    log_obj = {}
    log_obj["info"] = info
    log_obj["params"] = params
    log_obj["res"] = res_arr

    util_library.log(logger, params[0], log_obj)

    for cid in const.WS_USER[info["@id"]] :

        res_obj = {
            "status": "ok",
            "cid": cid,
            "task_alias": info["alias"],
            "task_name": f"action.{info["name"]}",
            "msg": info["completed"],
        }

        if "forward" in info : res_obj["forward"] = info["forward"]
        await const.WS_USER[info["@id"]][cid].send_text(json.dumps(res_obj))
