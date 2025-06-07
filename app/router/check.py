
from fastapi import APIRouter, Request
from app.util import util_db, util_param, util_response, util_panel
from app.conf import const

import re
import logging
logger = logging.getLogger()

router = APIRouter()

@router.get("/datasource")
async def check(request: Request):
    
    query_params = dict(request.query_params)
    datasource_idx = int(query_params.get('i', -1))

    if datasource_idx == -1 : 
        raise (Exception("")) 
    
    elif datasource_idx == 0 : 
        db_type = "mariadb"
    
    else :
        param = {"idx": datasource_idx}
        query = const.SQLS["db_type"]

        rows = util_db.select_db(const.CONF["start_db"]["idx"], query, param)

        if len(rows["data"]) == 0 : return util_response.error("no datasource")

        db_type = rows["data"][0]["name"]

    final_res = {}
    final_res["status"] = "ok"
    final_res["msg"] = "success"
    final_res["type"] = db_type

    return final_res

@router.post("/query")
async def query (request: Request) :
    post = await request.json()
    return await check_query(request, post)

async def check_query(request: Request, post: object): 
    
    params = util_param.get_init_info(request, post, only_params = True)
    if "pid" not in post : util_response.error("no panel")
    if "query" not in post : util_response.error("no query")
    if "datasource" not in post : util_response.error("no data source")

    # source db get start
    idx = int(post["i"])
    level = params["@level"]
    param = {"idx": idx, "level":level}
    query = const.SQLS["panel"]
    rows = util_db.select_db(const.CONF["start_db"]["idx"], query, param)
    
    if len(rows["data"]) == 0 : return util_response.error("no panel")

    data_source = int(post["datasource"])

    """
    execute_mode = "exec"
    checked_query = post["query"].strip().lower()
    if checked_query.startswith("select") :  execute_mode = "select"
    """
    execute_mode = "select"

    data_arr = []
    if len(post["@data"]["new"]) > 0 : 
        data_arr = util_panel.get_exec_data (post["@data"]["new"], params)


    final_res = {}
    try :
        if execute_mode == "select" :
            
            data = {}
            for col in data_arr[0] :
                if isinstance(data_arr[0][col], str):
                    if data_arr[0][col].strip() != "" : data[col] = data_arr[0][col].strip()
                else : 
                    data[col] = data_arr[0][col]
            data = util_param.trans_type_predefined_params(data)
            db_res = util_db.select_db(data_source, post["query"], data)

            final_res["status"] = "ok"
            final_res["r_code"] = 200
            final_res["msg"] = "success"
            final_res["data"] = db_res["data"]
        
        else :
            data = util_param.trans_type_predefined_params(data_arr[0])
            db_res = util_db.execute_db(data_source, [post["query"]], [data], commit=False)
            final_res["status"] = "ok"
            final_res["r_code"] = 200
            final_res["msg"] = "success"
            final_res["data"] = db_res["data"]

    except Exception as e:
        final_res = util_response.error_notify(str(e), 500)

    final_res["query"] = post["query"]

    if len(post["@data"]["new"]) > 0 :

        final_res["query"] = util_db.get_parsed_query(post["query"], data)
        ptrn = r"%\(([^)]+)\)s"
        matches = re.findall(ptrn, final_res["query"])

        for col in matches :
            if isinstance(data[col], str) : 
                final_res["query"] = \
                    final_res["query"].replace (f"%({col})s", "'" + util_db.get_trans_value(data[col]) + "'")
            else :
                final_res["query"] = \
                    final_res["query"].replace (f"%({col})s", util_db.get_trans_value(data[col]))
        
    return final_res


@router.post("/ajob")
async def tool (request: Request) :
    
    final_res = {}    
    post = await request.json()

    msg = "The status of this job"
    run = "done"
    ajob_params = {"pidx": post["i"], "entity":post["entity"], "mode":post["mode"], "target":post["target"]}
    ajob_query = const.SQLS["ajob_list"]
    ajob_res = util_db.select_db(const.CONF["start_db"]["idx"], ajob_query, ajob_params)
    if len(ajob_res["data"]) > 0 :
        if ajob_res["data"][0]["status"] == 1 : 
            msg = "this job is running."
            run = "run"
        else :
            job_status = "success"
            if ajob_res['data'][0]['status'] == 2 : job_status = "fail"
            msg += f"<br>* job status: {job_status}<br>* time: {ajob_res['data'][0]['ended']}"

    final_res["status"] = "ok"
    final_res["r_code"] = 200
    final_res["msg"] = msg
    final_res["run"] = run
    final_res["i"] = post["i"]
    final_res["entity"] = post["entity"]
    final_res["mode"] = post["mode"]
    final_res["target"] = post["target"]

    return final_res

@router.post("/tool")
async def tool (request: Request) :
    post = await request.json()
    return await check_tool(request, post)

@router.post("/tool")
async def check_tool(request: Request, post: object): 

    res = util_db.type_db_mysql (int(post["datasource"]), post["query"])
    
    final_res = {}
    final_res["status"] = "ok"
    final_res["msg"] = "success"
    final_res["json"] = util_panel.gen_json(post, res)

    return final_res
