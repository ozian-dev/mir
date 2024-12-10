
import json
import calendar
from fastapi import Request
from fastapi import Request
from dateutil.relativedelta import relativedelta
from datetime import timedelta
from app.conf import const
from app.util import util_library, util_panel, util_cipher, util_db

def get_init_info ( request:Request, post:object = None, only_params:bool = False ) : 

    params =  get_predefined_params ( request, post )
    params["@ip"] = util_library.get_client_ip(request)
    if post :
        for key, val in post.items():
            if key not in ["g", "i"] : params[key] = val
    if only_params == True : return params
    
    try: 
        panel = util_panel.get_panel_db(params)
        panel_json = None 
        panel_json = json.loads(panel["json_panel_value"])

    except Exception as e :
        raise Exception("invalid json panel")

    try:
        if "chart" in panel_json :
            if "defaults" in panel_json["chart"] :
                for key, val in panel_json["chart"]["defaults"].items() :
                    if key == "@date" : key = ".date"
                    if key not in params or params[key] == "" : 
                        params[key] = val
                        if isinstance(val, str) and len(val) > 0 and val[0] == "@" :
                            default_query = panel_json["chart"]["conditions"][key]["values"]["query"]
                            default_datasource = panel_json["datasource"]
                            if "datasource" in panel_json["chart"]["conditions"][key]["values"] : 
                                default_datasource = panel_json["chart"]["conditions"][key]["values"]["datasource"]
                            default_values = util_db.select_db(default_datasource, default_query, params)["data"]
                            
                            if val == "@first" : 
                                val_key = list(default_values[0])
                                val = default_values[0][val_key[-1]]
                            elif val == "@last" : 
                                val_key = list(default_values[-1])
                                val = default_values[-1][val_key[-1]]

                            params[key] = val

        params = get_predefined_time_params(params)

    except Exception as e :
        raise Exception("invalid params")

    return panel, panel_json, params

        
def get_predefined_params ( request:Request, post:object = None ) : 

    params = {}

    for item in request.query_params : 
        if request.query_params.get(item).strip() != "" :
            params[f"{item}"] = request.query_params.get(item).strip()
    
    if post != None :
        if "g" in post : params[".g"] = post["g"]
        if "i" in post : params[".i"] = post["i"]

    if ".g" in params :
        enc_str = request.cookies.get(f"{const.APP_NAME}.{params['.g']}.e")
        enc_obj = util_cipher.decrypt_json ( enc_str )

        for k, v in enc_obj.items(): params[f"@{k}"] = v

    return trans_type_predefined_params(params)

def trans_type_predefined_params (params) :

    for k, v in const.PREDEFINED_PARAMS.items() :
        if k in params :
            if v["type"] == "number" : 
                params[k] = float( params[k] )
            elif v["type"] == "int" : 
                params[k] = int( params[k] )
            elif v["type"] == "float" : 
                params[k] = float( params[k] )
            if "values" in v and params[k] not in v["values"] :
                raise Exception("invalid params")
        elif "default" in v:
            params[k] = v["default"]

    return params

def get_predefined_time_params ( obj: object ) : 
    
    params = {}

    for k,v in obj.items() : 
        
        if k == ".date" :
            tmp_obj = parse_date_period( v )
            params["@start_date"] = tmp_obj["start_date"]
            params["@end_date"] = tmp_obj["end_date"]
    
        else : 
            params[k] = v

    return params

def parse_date_period ( date_str ) :

    start_date: str = ""
    end_date: str = ""

    if "~" in date_str :
        tmp_arr = date_str.split("~")
        start_date = tmp_arr[0].strip()
        end_date = tmp_arr[1].strip()
        if ( end_date == "" ) :
            end_date = util_library.get_time("%Y-%m-%d")
    else:
        today = util_library.get_time("%Y-%m-%d")
        yesterday = (util_library.get_time() - timedelta(days=1)).strftime("%Y-%m-%d")

        if date_str == "Today":
            start_date = today
            end_date = today

        elif date_str == "Yesterday":
            start_date = yesterday
            end_date = yesterday

        elif date_str == "2_days_ago":
            start_date = (util_library.get_time() - timedelta(days=2)).strftime("%Y-%m-%d")
            end_date = (util_library.get_time() - timedelta(days=2)).strftime("%Y-%m-%d")

        elif date_str == "Last_7_days":
            start_date = (util_library.get_time() - timedelta(days=7)).strftime("%Y-%m-%d")
            end_date = yesterday

        elif date_str == "Last_30_days":
            start_date = (util_library.get_time() - timedelta(days=30)).strftime("%Y-%m-%d")
            end_date = yesterday

        elif date_str == "Last_90_days":
            start_date = (util_library.get_time() - timedelta(days=90)).strftime("%Y-%m-%d")
            end_date = yesterday

        elif date_str == "This_month":
            start_date = util_library.get_time("%Y-%m-01")
            end_date = today

        elif date_str == "Last_month":
            start_date = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%Y-%m-%d")
            tmp_arr = start_date.split("-")
            first_day, last_day = calendar.monthrange(int(tmp_arr[0]), int(tmp_arr[1]))
            end_date = f"{tmp_arr[0]}-{tmp_arr[1]}-{last_day}"

        elif date_str == "Last_3_months":
            start_date = (util_library.get_time() - relativedelta(months=3)).replace(day=1).strftime("%Y-%m-%d")
            tmp_date = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%Y-%m-%d")
            tmp_arr = tmp_date.split("-")
            first_day, last_day = calendar.monthrange(int(tmp_arr[0]), int(tmp_arr[1]))
            end_date = f"{tmp_arr[0]}-{tmp_arr[1]}-{last_day}"

        elif date_str == "This_year":
            start_date = util_library.get_time().strftime("%Y-01-01")
            end_date = today
            
    return { "start_date": start_date, "end_date": end_date }


def parse_date_define ( date_str ) :

    date_str = date_str.replace("@", "").strip()
    res = date_str

    if date_str == "Today" :
        res = util_library.get_time().strftime("%Y-%m-%d")

    elif date_str == "Yesterday" :
        res = (util_library.get_time() - timedelta(days=1)).strftime("%Y-%m-%d")

    elif date_str == "Tomorrow" :
        res = (util_library.get_time() + timedelta(days=1)).strftime("%Y-%m-%d")

    elif date_str == "Last_month_y" :
        res = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%Y")

    elif date_str == "Last_month_m" :
        res = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%m")

    elif date_str == "Last_month_ym" :
        res = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%Y-%m")

    elif date_str == "Last_month_ymd" :
        res = (util_library.get_time() - relativedelta(months=1)).replace(day=1).strftime("%Y-%m-%d")
        
    elif "_days" in date_str :
        tmpArr = date_str.split("_")
        if tmpArr[1].isdigit():
            res = (util_library.get_time() - timedelta(days=int(tmpArr[1]))).strftime("%Y-%m-%d")

    return res
