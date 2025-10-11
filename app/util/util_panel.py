import sys
import json
import math
import importlib
import ast
from pathlib import Path
from collections import defaultdict
from collections.abc import Iterable

from app.conf import const, log
from app.util import util_db, util_param, util_response, util_library, util_async, util_file

def get_panel_db (params:object) :

    if ".i" not in params : return None

    param = {"grp": params[".g"], "idx": params[".i"], "level":params["@level"]}

    query = const.SQLS["panel_view"]
    if "entity" in params :
        query = const.SQLS["panel_update"]
   
    rows = util_db.select_db(const.CONF["start_db"]["idx"], query, param)
    if "data" not in rows and len(rows["data"]) == 0 : return None

    return rows["data"][0]

def get_panel (panel:object, panel_json:object, params:object) :

    final_res = {}
    final_res["status"] = "ok"
    final_res["grp"] = params[".g"]
    final_res["pid"] = params[".i"]
    final_res["title"] = panel["title"]

    if "info" in panel_json : final_res["info"] = panel_json["info"]
    if "form" in panel_json : final_res["form"] = get_panel_form(panel_json, params)
    if "html" in panel_json : final_res["html"] = panel_json["html"]
    
    # widget & chart must be called in order because widget's .m value affects the behavior of chart.
    if "widget" in panel_json : final_res["widget"] = get_panel_widget(panel_json, params)
    if "chart" in panel_json : final_res["chart"] = get_panel_chart(panel_json, params)
    if "work" in panel_json : 
        final_res["work"] = get_panel_work(panel_json["work"], params)

    if "action" in panel_json : 
        final_res["action"] = panel_json["action"]
        for item in final_res["action"] :
            if "query" in item : del item["query"]
            if "return" in item : del item["return"]
            if "completed" in item : del item["completed"]

            item["run"] = False
            if item["async"] == True :
                ajob_params = {"pidx": final_res["pid"], "entity":"action", "mode":"execute", "target":item["name"]}
                ajob_query = const.SQLS["ajob_list"]
                ajob_res = util_db.select_db(const.CONF["start_db"]["idx"], ajob_query, ajob_params)
                if len(ajob_res["data"]) > 0 and ajob_res["data"][0]["status"] == 1 : item["run"] = True

    if ".t" in params and params[".t"] == "excel" :
        final_res["title"] = panel["title"]
        return util_response.response_excel(final_res)
    
    elif ".t" in params and params[".t"] == "sample" :
        final_res["title"] = f"{panel['title']}.insert"
        final_res["chart"]["heads"] = util_library.get_obj_array(final_res["chart"]["insert"], "name", params["target"])["columns"]
        final_res["chart"]["values"] = []
        return util_response.response_excel(final_res)
    
    elif ".t" in params and params[".t"] == "code" :
        final_res["title"] = f"{panel['title']}.insert.code"
 
        arr = []
        for head in final_res["chart"]["heads"]:
            if "values" in head:
                arr.append([f"{head['name']}.code"])
                tmp_arr = util_library.get_arr(head["values"]["data"])
                for row in tmp_arr:
                    row = util_library.shift_array_right(row)
                    arr.append(row)
                arr.append([])

        final_res["chart"]["values"] = arr
        final_res["chart"]["heads"] = []

        return util_response.response_excel(final_res)

    else :
        
        if "chart" in final_res :
            final_res["meta"] = {}
            final_res["meta"]["trans_obj"] = [
                # important : order & '*' can use only once
                # convert an array into an object.
                "obj.chart.operate",
                "obj.chart.operate.*.columns",
                "obj.chart.execute",
                "obj.chart.execute.*.columns",
                "obj.chart.insert",
                "obj.chart.insert.*.columns",
                "obj.chart.heads",
                "obj.chart.ops",
                #"obj.form.items"
            ]

            
        if isinstance(final_res, Iterable) and final_res.get("chart", {}).get("heads") :
            for head in final_res["chart"]["heads"] :
                if head["type"] == "int" or head["type"] == "float" :
                    if head["type"] == "int" : 
                        if "point" not in head : head["point"] = 0 
                    head["type"] = "number"

        return final_res


def get_panel_form (panel_json:object, params:object) :

    if "form" not in panel_json : return None
    res = panel_json["form"]
    
    if res["execute"] : 
        for item in res["execute"] :
            if "query" in item : del item["query"]
    
    if "heads" in res :
        for item in res["heads"] :

            if "default" in item :
                if item["default"] is None : item["default"] = None
                elif isinstance(item["default"], str) and len(item["default"]) > 0 :
                    if item["default"][0] == "@" : item["default"] = util_param.parse_date_define(item["default"])
                    else : item["default"] = item["default"]
                else : item["default"] = item["default"]

            if "values" in item and "query" in item["values"] :
                set_query_values( panel_json, item["values"], params )

    return res

def get_panel_widget (panel_json:object, params:object) :

    if "widget" not in panel_json : return None

    datasource = panel_json["datasource"]
    res = panel_json["widget"]

    for item in res :
        
        if item["type"] == "list" :
            
            this_datasource = datasource
            if "datasource" in item : this_datasource = item["datasource"]

            res_db = util_db.select_db(this_datasource, item["query"], params)
            item["data"] = res_db["data"]
            del item["query"]

            # widget & chart have dependancy
            # if ".m" not in params or params[".m"] != "view" : del panel_json["chart"]

        else :
            if "query" in item :
                
                item["data"] = {}
                this_datasource = datasource
                if "datasource" in item : this_datasource = item["datasource"]
                
                res_db = util_db.select_db(this_datasource, item["query"]["base"], params)
                if item["type"] == "index" :
                    item["data"]["base"] = res_db["data"][0][next(iter(res_db["data"][0]))]
                else :
                    item["data"]["base"] = res_db["data"]
                
                res_db = util_db.select_db(this_datasource, item["query"]["target"], params)
                if item["type"] == "index" :
                    item["data"]["target"] = res_db["data"][0][next(iter(res_db["data"][0]))]
                else :
                    item["data"]["target"] = res_db["data"]

                del item["query"]

        if "view" in item : del item["view"]

    return res
            
def get_panel_chart (panel_json:object, params:object) :

    if "chart" not in panel_json : return None

    res = panel_json["chart"]

    mode = ""
    if ".m" in params and params[".m"] != "" : mode = params[".m"]

    if mode == "view" : panel_json["chart"]["query"] = []
    elif mode != "view" and ( "query" not in panel_json["chart"] or len(panel_json["chart"]["query"]) ) == 0 : return None


    if "list" in res :

        if "query" in res["list"] : 
            offset = int(params[".o"]);    
            db_idx = get_db_idx(panel_json, res["list"])
            res_db = util_db.select_db(db_idx, res["list"]["query"], params)
            total = list(res_db["data"][0].values())[0]
            res["list"]["total"] = total
            res["list"]["page_total"] = math.ceil(total / res["list"]["size"])
            res["list"]["page"] = math.floor( offset / res["list"]["size"]) + 1
            
            del  res["list"]["query"]

    if "operate" in res :
        for item in res["operate"]:
            if "query" in item : del item["query"]

            if "act" in item :
                for act in item["act"] : 
                    if "query" in act : del act["query"]

    if "execute" in res :
        for item in res["execute"]:
            if "query" in item : del item["query"]
            if "postwork" in item : del item["postwork"]

    if "insert" in res :
        for item in res["insert"]:
            if "query" in item : del item["query"]
            if "postwork" in item : del item["postwork"]
            if "prework" in item : del item["prework"]
            if "post" in item : del item["post"]
            if "image" in item : del item["image"]
            if "type" in item and item["type"] == "excel" :
                del item["ecolumns"]

    if "note" in res :
        for note in res["note"] :
            db_idx = get_db_idx(panel_json, note)
            res_db = util_db.select_db(db_idx, note["query"], params)
            del note["query"] 

            if len(res_db["data"]) > 0 and "text" in note: 
                note["text"] = util_db.get_parsed_query(note["text"], res_db['data'][0])

    if "search" in res :
        for k, v in res["search"].items() :
            if "case" in v : del v["case"]

    if "conditions" in res :

        for key in res["conditions"] : 

            val = res["conditions"][key]

            if "values" in val and "query" in val["values"]:
                set_query_values (panel_json, val["values"], params)

            if "default" in val and isinstance(val["default"], str) and len(val["default"]) > 0 and val["default"][0] == "@" :

                if val["default"] == "@first" : 
                    val_key = list(val["values"]["data"])[0]
                    val["default"] = val["values"]["data"][val_key]

                elif val["default"] == "@last" : 
                    val_key = list(val["values"]["data"])[-1]
                    val["default"] = val["values"]["data"][val_key]


    call_db = True
    if "dependency" in res and mode != "view" :
        for val in res["dependency"] : 
            if val not in params or val == "" :
                call_db = False
                break

    if call_db and "query" in res :

        call_db_idx = get_db_idx(panel_json, panel_json["chart"])

        ttl = 0
        if "ttl" in panel_json["chart"] : ttl = panel_json["chart"]["ttl"]
        if ".c" in params : ttl = 0

        res_db = util_db.select_db(call_db_idx, res["query"][0], params, ttl)

        data = res_db["data"]
        res["last_update"] = res_db["last_update"]
        
        if "join" in res :

            for join in res["join"] :
                join_db_idx = get_db_idx(panel_json, join)
                res_join_db = util_db.select_db(join_db_idx, join["query"][0], params, ttl)
                
                for row in data :
                    join_obj = {}
                    for row_join in res_join_db["data"] : 
                        is_same = True
                        for k, v in join["key"].items():
                            if row[k] != row_join[v] :
                                is_same = False
                                break

                        for join_k, jon_v in row_join.items() : 
                            if join_k not in row : 
                                if is_same : join_obj[join_k] = jon_v    
                    row.update(join_obj)

                del join["query"]

        if "pivot" in res :

            unit = ""
            if "unit" in res["pivot"] : unit = res["pivot"]["unit"]

            tmp_obj = {}
            sum_obj = {}

            for row in data :
                if "k" not in row:
                    row['k'] = row['col']
                    row['v'] = row['val'] if row['val'] is not None else 0
                    if isinstance(row['v'], str) : row['v'] = float(row['v'])

                if f"{row['x']}" not in tmp_obj : tmp_obj[f"{row['x']}"] = {}
                tmp_obj[f"{row['x']}"][f"{row['k']}"] = row["v"]

                if f"{row['k']}" not in sum_obj : sum_obj[f"{row['k']}"] = row["v"]
                else : sum_obj[f"{row['k']}"] += row["v"]

            tmp_arr = []
            for k, v in tmp_obj.items() : 
                v["x"] = k
                tmp_arr.append(v)

            k_arr = sorted(sum_obj, key=sum_obj.get, reverse=True)

            res["heads"] = [{ "name":"x", "type":"string" }]
            for k in k_arr :

                head_obj = { "name":f"{k}", "type":"float" }
                if unit != "" : head_obj["unit"]= unit 
                res["heads"].append(head_obj)
           
            data = tmp_arr

        res["values"] = json_adjust_type (res["heads"], data)

        if "list" in res and res["list"]["type"] == "group" : 
            
            group_index = []
            for item in res["list"]["columns"]:
                seq = util_library.get_index_array(res["heads"], "name", item)
                if seq == -1 : raise Exception(f"invalid group column : '{item}' is not existed")
                group_index.append(seq)

            sort = [] if "sort" not in res["list"] else res["list"]["sort"]
            sort_index = []
            for item in sort:
                seq = util_library.get_index_array(res["heads"], "name", item)
                if seq == -1 : raise Exception(f"invalid sort column : '{item}' is not existed")
                sort_index.append(seq)

            res["values"] = group_sort(res["values"], group_index, sort_index)
            #print (json.dumps(res["values"],indent=4))

    if "query" in res : del res["query"]

    if "heads" in res :
        for val in res["heads"]:
            if "values" in val and "query" in val["values"] :
                set_query_values (panel_json, val["values"], params)
            if "flow" in val : del val["flow"]["query"]

    if "view" in res : 
        for view_item in res["view"] : del (view_item["query"])

    if "agent" in res : 
        source_str = ','.join(map(str, res['agent']['source']))
        prompt_query = f"select idx,title, json_prompt_value from prompt where idx in ({source_str}) and live='Y' and levelv >= '{params['@level']}'"
        res_agent = util_db.select_db(const.CONF["start_db"]["idx"], prompt_query)

        prompt_obj = []
        for row in res_agent['data']:
            tmp_json = json.loads(row['json_prompt_value'])
            tmp = {}
            tmp['idx'] = row['idx']
            tmp['title'] = row['title']
            tmp['source'] = tmp_json['llm']['source']
            tmp['name'] = tmp_json['llm']['name']
            prompt_obj.append(tmp)

        res['agent'] = prompt_obj

    return res


def get_panel_work(panel_json:object, params:object) :

    if panel_json["mode"] == "sql":
        db_info = util_db.get_db(panel_json["datasource"])
        panel_json["database"] = db_info["type"]
        if "items" in panel_json:
            for item in panel_json["items"]:
                if "datasource" in item:
                    db_info = util_db.get_db(item["datasource"])
                    item["database"] = db_info["type"]

    elif panel_json["mode"] == "file":
        for item in panel_json["items"]:
            context = util_file.load_file(item["file"])
            item["context"] = context
            del(item["file"])
            
    return panel_json

def group_sort(data, group, sort=None) :

    res = []

    if sort is None :
        res = sorted (data, key=lambda x: tuple(x[i] for i in group))
    else :
        res = group_and_sort(data, group, sort)

    return res

def group_and_sort(data, group_indices, sort_indices):

    def group_data(data, group_indices):
        """Recursive function to group data based on group indices."""
        if not group_indices:
            return data
        
        grouped = defaultdict(list)
        for row in data:
            key = tuple(row[i] for i in group_indices[:1])  # Group by the first index
            grouped[key].append(row)
        
        return {key: group_data(value, group_indices[1:]) for key, value in grouped.items()}

    def flatten_tree(tree):
        """Flatten the grouped tree structure into a sorted array."""
        if not isinstance(tree, dict):
            return tree
        flat = []
        for key in sorted(tree.keys()):  # Sort keys lexicographically
            flat.extend(flatten_tree(tree[key]))
        return flat

    def sort_leaf(data, sort_indices):
        """Sort a flat list of rows by sort indices."""
        return sorted(data, key=lambda x: tuple(x[i] for i in sort_indices))

    # Perform grouping
    grouped_tree = group_data(data, group_indices)
    # Flatten and sort the grouped data
    flat_data = flatten_tree(grouped_tree)
    return sort_leaf(flat_data, sort_indices)


def get_view (params:object) :

    query = const.SQLS["view"]
    view_res = util_db.select_db(const.CONF["start_db"]["idx"], query, params)
    view_data = view_res["data"][0]
    view_json = json.loads(view_data["json_view_value"])

    ttl = 0
    if "ttl" in view_json["chart"] : ttl = view_json["chart"]["ttl"]
    call_db_idx = view_json["datasource"]

    res_db = util_db.select_db(call_db_idx, view_json["chart"]["query"][0], params, ttl)
    values = json_adjust_type (view_json["chart"]["heads"], res_db["data"])

    final_res = {}
    final_res["status"] = "ok"
    final_res["grp"] = params[".g"]
    final_res["pid"] = params[".i"]
    final_res["title"] = view_data["title"]
    final_res["chart"] = view_json["chart"]
    final_res["chart"]["last_update"] = res_db["last_update"]
    final_res["chart"]["values"] = values

    del (final_res["chart"]["query"])
    
    return final_res

async def execute_panel (panel_json:object, params:object):

    data_source = panel_json["datasource"]

    if util_db.get_db(data_source)["permit"] != "0302" : 
        return util_response.error("this DB is not 'read-write' type")
    
    is_async = False
    pk_arr = list( get_chart_keys (panel_json).keys() )

    if "entity" in params and "mode" in params :
        if params["entity"] == "action" :
            pass
        elif params["entity"] == "form" :
            pass
    else :
        if "old" in params["@data"] :
            if params["mode"] == "operate" or params["mode"] == "execute" :
                target_obj = util_library.get_obj_array (panel_json["chart"][params["mode"]], "name", params["target"])
                if "force" not in target_obj or target_obj["force"] == False :  
                    if is_different(params["@data"]["old"], params["@data"]["new"]) == False :
                        return util_response.error("no changing data")
        
        is_valid_post(panel_json, params, params["@data"]["new"])

    data = []
    split = None
    
    if  params["entity"]  == "chart" :

        if params["mode"] == "operate" or params["mode"] == "execute" : 

            data = params["@data"]["new"]
            data = get_exec_data (data, params)

            target_obj = util_library.get_obj_array (panel_json["chart"][params["mode"]], "name", params["target"])
            if "target-sub" in params :
                target_obj = util_library.get_obj_array (target_obj["act"], "name", params["target-sub"])

            if "split" in target_obj : split = target_obj["split"]

            if params["mode"] == "execute" : clear_files (panel_json, params)

        elif params["mode"] == "insert" : 

            data = params["@data"]["new"]
            data = get_exec_data (data, params)
            target_obj = util_library.get_obj_array (panel_json["chart"][params["mode"]], "name", params["target"])
            if "split" in target_obj : split = target_obj["split"]

        elif params["mode"] == "flow" : 

            data = params["@data"]["new"]
            data = get_exec_data (data, params)
            target_obj = util_library.get_obj_array(panel_json["chart"]["heads"], "name", params["target"])["flow"]

        heads = panel_json["chart"]["heads"]

    elif params["entity"] == "form" : 

        data = params["@data"]["new"]
        data = get_exec_data (data, params)
        target_obj = util_library.get_obj_array(panel_json["form"]["execute"], "name", params["target"])

    elif  params["entity"]  == "action" :

        data = params["@data"]["new"]
        data = get_exec_data (data, params)
        target_obj = util_library.get_obj_array(panel_json["action"], "name", params["target"])
        if "forward" in target_obj : params["forward"] = target_obj["forward"]
        if "async" in target_obj and target_obj["async"] == True : is_async = True

    run_type = True
    if "run" in params and params["run"] == "test" : run_type = False
    if "datasource" in target_obj : data_source = target_obj["datasource"]

    if is_async == False :
        query_arr = target_obj["query"]
        res_arr = util_db.execute_db(data_source, query_arr, data, run_type, split)
        
        if 'postwork' in target_obj:
            is_ok = True
            for row in res_arr:
                if row['result'] != True:
                    is_ok = False
            if is_ok:
                run_postwork(target_obj['postwork'], params, res_arr)

        log.log_info('audit', params)

    else :
        res_arr = None
        target_obj["datasource"] = data_source
        target_obj["@ip"] = params["@ip"]
        target_obj["@id"] = params["@id"]
        target_obj["@level"] = params["@level"]

        await util_async.call(target_obj, data)

    pkeys = []
    for item in params["@data"]["new"]:
        pkey_obj = {}
        for pk in pk_arr :
            if pk in item : pkey_obj[pk] = item[pk]
        pkeys.append(pkey_obj)

    final_res = {}
    final_res["status"] = "ok"
    final_res["grp"] = params[".g"]
    final_res["pid"] =  params[".i"]
    final_res["entity"] = params["entity"]
    final_res["mode"] = params["mode"]
    final_res["target"] = params["target"]
    final_res["execute"] = pkeys
    final_res["ext"] = res_arr
    final_res["run"] = "real" if run_type else "test"
 
    if "forward" in params : final_res["forward"] = params["forward"]
    if params["entity"]  == "action" : final_res["msg"] = target_obj["return"]

    return final_res



async def execute_work (panel_json:object, params:object):

    if (params["mode"] == "file"):
        file = ""
        for row in panel_json["work"]["items"]:
            if row["name"] == params["target"]:
                file = row["file"] 
                break
        util_file.write_file(params["@data"]["new"][0]["context"], file)

    final_res = {}
    final_res["status"] = "ok"
    final_res["grp"] = params[".g"]
    final_res["pid"] =  params[".i"]
    final_res["entity"] = params["entity"]
    final_res["mode"] = params["mode"]
    final_res["target"] = params["target"]

    return final_res


def is_different (data1, data2) : 

    local_cnt = 0 
    for data in data1:
        if data != data2[local_cnt] : return True
        local_cnt += 1

    return False

def get_exec_data (data, params) :

    if data is None or len(data) < 1 : data=[{}]

    res_arr = []
    filtered_params = {k: v for k, v in params.items() if k != "@data" and k != "@custom"}
    for row in data :
        merged_object = {**filtered_params, **row}
        res_arr.append(merged_object)

    return res_arr

def get_db_idx (panel_obj:object, item:object) :
    call_db_idx = panel_obj["datasource"]
    if "datasource" in item : call_db_idx = item["datasource"]

    return call_db_idx

def set_query_values (panel_obj:object, values_obj:object, params:object) :

    db_idx = get_db_idx (panel_obj, values_obj)
    values_res = util_db.select_db(db_idx, values_obj["query"], params, 0, True)
    values_obj["data"] = util_library.get_obj(values_res["data"]["data"])
    values_obj["length"] = len(values_res["data"]["cols"]) - 1

    del values_obj["query"] 

def json_adjust_type(info, data):
    trans_arr = []
    for row in data:
        localCnt = 0
        tmp_arr = []
        for col in info:
            if col["name"] not in row : 
                tmp_arr.append(None)
            elif col["type"] == "string" and "display" in col and col["display"] == "blind":
                tmp_arr.append("⁕⁕⁕⁕")
            else:
                tmp_arr.append(row[col["name"]])
            localCnt += 1
        trans_arr.append(tmp_arr)
    return trans_arr

def get_chart_keys (panel_obj) : 
    res = {}
    if util_library.exist_key ( panel_obj, ["chart", "heads"] ) :    
        for obj in panel_obj["chart"]["heads"]:
            if "display" in obj and obj["display"] == "key" :
                res[obj["name"]] = obj
    return res

def gen_json (post, data:object) : 

    res = {}

    res["datasource"] = int(post["datasource"])
    res["chart"] = {}
    res["chart"]["type"] = "table"
    res["chart"]["ttl"] = 0
    res["chart"]["height"] = 400
    res["chart"]["query"] = [post["query"].replace("\n", " ")]
    res["chart"]["join"] = []

    res["chart"]["heads"] = []
    for key, type in data.items() :
        
        tmp_obj = {}
        tmp_obj["name"] = key
        tmp_obj["alias"] = key
        tmp_obj["type"] = type
        res["chart"]["heads"].append(tmp_obj)

    res["chart"]["note"] = []
    res["chart"]["defaults"] = {}
    res["chart"]["conditions"] = {}
    res["chart"]["operate"] = []
    res["chart"]["execute"] = []
    res["chart"]["insert"] = []
    res["chart"]["dchart"] = []
    res["chart"]["chart"] = []
    res["chart"]["search"] = {}

    res["action"] = []

    return json.dumps(res)

def clear_files (panel_json, params) :

    if "uploads" in panel_json["chart"] :
        for key, val in panel_json["chart"]["uploads"].items() :
            i = 0 
            for row in params["@data"]["new"] :
                old = params["@data"]["old"][i][key]
                new = row[key]
                if new != old : 
                    old_arr = old.split(",")
                    new_arr = new.split(",")
                    files = [item for item in old_arr if item not in new_arr]

                    if val["type"] == "gcs" : 
                        util_file.delete_gcs(val, files)
                    elif val["type"] == "s3" : 
                        util_file.delete_s3(val, files)
                    else : 
                        val["asset_path"] = const.PATH_DATA_ASSET
                        util_file.delete_server(val, files)
                i += 1


def get_values(panel_json:object, params:object):
    
    values = {}
    if params["entity"] in panel_json and "heads" in panel_json[params["entity"]]:
        filtered_params = {k: v for k, v in params.items() if k != "@data" and k != "@custom"}
        if "@custom" in params : 
            merged_object = {**filtered_params, **params["@custom"]}
            filtered_params = merged_object

        for head in panel_json[params["entity"]]["heads"]:
            if "values" in head:
                if "data" in head["values"] : 
                    values[head["name"]] = [f"{value}" for key, value in head["values"]["data"].items()]
                elif "query" in head["values"] : 
                    db_idx = get_db_idx(panel_json, head)
                    res_db = util_db.select_db(db_idx, head["values"]["query"], is_raw=True)
                    values[head["name"]] = [cols[-1] for cols in res_db["data"]["data"]]
    
    return values


def is_valid_post(panel_json, params, data) :
    
    define_obj = {}

    entity = params["entity"]
    if params["entity"] == "action" : entity = "chart"

    defined_values = get_values(panel_json, params)

    for row in panel_json[entity]["heads"] :

        define_obj[row["name"]] = {}
        define_obj[row["name"]]["type"] = row["type"]
        define_obj[row["name"]]["alias"] = row["name"]
        define_obj[row["name"]]["alias"] = row["alias"] if "alias" in row else row["name"]
       
        if "values" in row :
            if row["name"] in defined_values :
                define_obj[row["name"]]["values"] = defined_values[row["name"]]

        elif "validation" in row : 
            define_obj[row["name"]]["code"] = row["validation"]

    if "search" in panel_json[entity] :
        for k, v in panel_json[entity]["search"].items() :
            define_obj[k] = v

    row_cnt = 0
    for row in data :
        for k, v in row.items() :

            if define_obj[k]["type"] == "int" or  define_obj[k]["type"] == "float" or  define_obj[k]["type"] == "number" : 
                val = f"{v}"
                val = val.replace(",", "")
                val = val.replace(",", "")
                if val != "" :
                    try : 
                        if define_obj[k]["type"] == "int" : 
                            val = int(val)
                            row[k] = val
                            
                        if define_obj[k]["type"] == "float" or define_obj[k]["type"] == "number" : 
                            val = float(val)
                            row[k] = val
                    except Exception as e: raise Exception(f"invalid data : '{val}' is not a {define_obj[k]["type"]}")
            
            value_step_1 = True
            if "values" in define_obj[k] :
                if v not in define_obj[k]["values"] : value_step_1 = False
    
            if value_step_1 == False :  
                srt_v = f"{v}"
                srt_v_arr = srt_v.split(",")
                for vv in srt_v_arr :
                    if vv not in define_obj[k]["values"] : 
                        raise Exception(f"invalid data : '{define_obj[k]['alias']}'")

            elif "code" in define_obj[k] :
                for name, code in define_obj[k]["code"].items() :

                    if name == "case" :
                        v_str = f"{v}"
                        code = code.replace ("${"+k+"}",v_str)        
                        if eval(code) == False : raise Exception(f"invalid data : {name} of '{define_obj[k]['alias']}'")

                    elif name == "max_length" :
                        v_str = f"{v}"
                        if len(v_str) > code : raise Exception(f"invalid data : {name} of '{define_obj[k]['alias']}'")

                    elif name == "min_length" :
                        v_str = f"{v}"
                        if len(v_str) < code : raise Exception(f"invalid data : {name} of '{define_obj[k]['alias']}'")

        row_cnt += 1


def run_postwork(fnc_list, params, results):
    
    fnc_path = Path(__file__).resolve().parent.parent.parent.parent / "mir_function"
    if str(fnc_path) not in sys.path:
        sys.path.append(str(fnc_path))

    for fnc in fnc_list:
        tree = ast.parse(fnc, mode="eval")
        call_node = tree.body

        import_file = call_node.func.value.id
        func_name = call_node.func.attr

        module_file = fnc_path / f"{import_file}.py"
        spec = importlib.util.spec_from_file_location(import_file, module_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        func = getattr(module, func_name)

        args = []
        for arg in call_node.args:
            if isinstance(arg, ast.Constant):
                args.append(arg.value)
            elif isinstance(arg, ast.Name):
                if arg.id == "params":
                    args.append(params)
                elif arg.id == "results":
                    args.append(results)
                else:
                    raise ValueError(f"Unknown variable: {arg.id}")
            else:
                raise ValueError(f"Unsupported argument type: {ast.dump(arg)}")

        func(*args)

    log.log_info('audit', f"[postwork]\t{params['@id']}\t{json.dumps(fnc_list)}")


def get_custom_workspace(key):
    if key not in const.CUSTOM_WS:
        raise Exception("invalid access")

    res = {}
    custom = const.CUSTOM_WS[key]
    if custom["mode"] == "edit":
        res["i"] = int(key)
        res["mode"] = custom["mode"]
        res["format"] = custom["format"]
        res["text"] = util_file.load_file(custom["target"])

    return res
