
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
        if params is not None and '@ajob_idx' in info :
            ajob_params = {"idx":info["@ajob_idx"]}
            ajob_query = const.SQLS["ajob_update_fail"]
            rows = util_db.execute_db(const.CONF["start_db"]["idx"], [ajob_query], [ajob_params])

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

    ajob_data = params[0]
    ajob_params = {"pidx":ajob_data[".i"], "entity":ajob_data["entity"], "mode":ajob_data["mode"], "target":ajob_data["target"]}
    ajob_query = const.SQLS["ajob_list"]
    rows = util_db.select_db(const.CONF["start_db"]["idx"], ajob_query, ajob_params)

    if len(rows["data"]) > 0 and rows["data"][0]["status"] == 1 :
        raise (Exception(f"process is running : from {rows['data'][0]['started']}"))
    else :
        ajob_query = const.SQLS["ajob_insert"]
        rows = util_db.execute_db(const.CONF["start_db"]["idx"], [ajob_query], [ajob_params])
        info["@ajob_idx"] = rows[0]['db_id']

        task = asyncio.create_task(execute(info, params, callback))
    
    return True

async def callback(info, params: object=None, res_arr: object=None) :

    if params is not None and '@ajob_idx' in info :
        ajob_params = {"idx":info["@ajob_idx"]}
        ajob_query = const.SQLS["ajob_update"]
        rows = util_db.execute_db(const.CONF["start_db"]["idx"], [ajob_query], [ajob_params])

    if params is None or len(params) < 1 : params = [{}]

    params[0]["@ip"] = info["@ip"]
    params[0]["@id"] = info["@id"]
    params[0]["@level"] = info["@level"]
    
    log_obj = {}
    log_obj["info"] = info
    log_obj["params"] = params
    log_obj["res"] = res_arr

    util_library.log(logger, params[0], log_obj)

    """
    # Socket communication is currently blocking
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
    """
