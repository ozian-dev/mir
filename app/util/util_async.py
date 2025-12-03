import asyncio
import json

from app.conf import const, log
from app.util import util_db, util_push

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

        res_obj = {
            "action": "async",
            "status": "error",
            "pid": params[0][".i"],
            "task_alias": info["alias"],
            "task_name": f"action.{info["name"]}",
            "msg": str(e),
        }
        log.log_info('async', json.dumps(res_obj))
            
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
        ajob_params = {'idx':info['@ajob_idx']}
        ajob_query = const.SQLS['ajob_update']
        rows = util_db.execute_db(const.CONF['start_db']['idx'], [ajob_query], [ajob_params])

    if params is None or len(params) < 1 : params = [{}]
    
    params[0]['@ip'] = info['@ip']
    params[0]['@id'] = info['@id']
    params[0]['@level'] = info['@level']
    
    log_obj = {}
    log_obj['info'] = info
    log_obj['params'] = params
    log_obj['res'] = res_arr
    log.log_info('root', params[0], log_obj)

    data = {
        'ui': params[0]['@ui'],
        'uid': params[0]['@id'],
        'grp': params[0]['.g'],
        'pid': params[0]['.i'],
        'target': info['name'],
    }

    if util_push.is_activated():
        util_push.send_msg(data, info["completed"])
