import json
from fastapi import APIRouter, Request
from app.util import util_db, util_response, util_panel, util_param, util_agent
from app.conf import const

router = APIRouter()

@router.get("/menu")
async def menu (request: Request) :

    params = util_param.get_init_info(request, only_params = True)

    param = {"grp":params[".g"], "level":params["@level"]}
    query = const.SQLS["menu"]
    rows = util_db.select_db(const.CONF["start_db"]["idx"], query, param)

    final_res = {}
    final_res["status"] = "ok"
    final_res["data"] = rows["data"]

    return final_res

@router.get("/workplace")
async def workplace (request: Request) :

    params = util_param.get_init_info(request, only_params = True)

    param = {"grp":params[".g"], "idx":params[".i"], "level":params["@level"]}
    query = const.SQLS["panel_list"]
    if(params[".i"] != 1) : query += " and live='Y' ";
    query += " order by midx, arrange ";
    rows = util_db.select_db(const.CONF["start_db"]["idx"], query, param)

    final_res = {}
    final_res["data"] = []

    for row in rows["data"]:
        title = row["title"]
        idx = row["idx"]

        tmp_obj = {}
        tmp_obj["title"] = title
        tmp_obj["grp"] = params[".g"]
        tmp_obj["idx"] = idx

        final_res["data"].append(tmp_obj)
        
    final_res["status"] = "ok"
 
    return final_res

@router.get("/panel")
async def panel (request: Request) :

    panel, panel_json, params = util_param.get_init_info(request)
    if panel == None : return util_response.error("no panel")
    res = util_panel.get_panel (panel, panel_json, params)
    if ".t" in params and params[".t"] == "agent" :
        stream = util_agent.startAgent(res, params)
        return stream
    else:
        return res

@router.get("/view")
async def panel (request: Request) :

    params = util_param.get_init_info(request, only_params = True)

    res = util_panel.get_view (params)

    if len(res["chart"]["values"]) == 0 :
        return util_response.error("no view")

    if "chart" in res and "heads" in res["chart"] :
        for head in res["chart"]["heads"] :
            if head["type"] == "int" or head["type"] == "float" :
                if head["type"] == "int" : 
                    if "point" not in head : head["point"] = 0 
                head["type"] = "number"

    return res

@router.post("/chat")
async def chat (request: Request) :
    
    post = await request.json()
    params = util_param.get_init_info(request, post, True)

    if 'target' in params:
        if params['target'] == 'del':
            if params['@id'] in const.CHAT_USER: del (const.CHAT_USER[params['@id']])
            return {'status':'ok', 'msg':'ok'}
        
        elif params['target'] == 'info':
            prompt_json = util_agent.getAgentInfo(params["source"], params['@level'])
            final_res = {}
            final_res['status'] = 'ok'
            final_res['data'] = {}
            final_res['data']['source'] = prompt_json['llm']['source']
            final_res['data']['name'] = prompt_json['llm']['name']

            return final_res
    
    else:
        params['idx'] = params['.i']
        params['level'] = params['@level']
        res_db = util_db.select_db(const.CONF["start_db"]["idx"], const.SQLS["panel"], params)
        if len(res_db) == 0 : return None

        info = {'source':int(params['pmtidx'])}
        stream = util_agent.chatAgent(info, params)
        return stream

@router.post("/execute")
async def execute (request: Request) :
    
    post = await request.json()
    panel, panel_json, params = util_param.get_init_info(request, post)

    if panel == None : return util_response.error("no panel")
    if "@data" not in post or "new" not in post["@data"] : return util_response.error("invalid params")

    return await util_panel.execute_panel (panel_json, params)

@router.get("/search")
async def panel (request: Request) :


    panel, panel_json, params = util_param.get_init_info(request)

    search = panel_json["chart"]["search"][params["target"]]

    case_name = search["option"]["name"]
    case = search["case"][params[case_name]]

    datasource = case["datasource"] if "datasource" in case else case["panel_json"]
    res_db = util_db.select_db (datasource, case["query"], params)

    final_res = {}
    final_res["status"] = "ok"
    final_res["msg"] = "success"
    final_res["data"] = res_db["data"]

    return final_res