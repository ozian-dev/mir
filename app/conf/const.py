
import os
from app.util import util_file

APP_NAME = "mir"

PATH_CONF = "_conf"
PATH_CONF_CSS = "_conf/style"

FILE_CONF = PATH_CONF + "/conf.json"

PATH_KEY = "_conf/keys"

PATH_DATA = "_data"
PATH_DATA_LOG = PATH_DATA + "/log"
PATH_DATA_CACHE = PATH_DATA + "/cache"
PATH_DATA_ASSET = PATH_DATA + "/asset"
PATH_DATA_UPLOAD = PATH_DATA + "/uploads"
PATH_DATA_TEPM = PATH_DATA + "/temp"

PATH_TEMPLATE = "app/template"
PATH_TEMPLATE_STATIC = PATH_TEMPLATE + "/static"
ALIAS_STATIC = "static"

STYLE = {
    "blue"  : { "main" : "#4A58C0", "sub" : "#6070E0" },
    "red"   : { "main" : "#E54F49", "sub" : "#F46548" },
    "green" : { "main" : "#109D69", "sub" : "#1FBD68" },
    "black" : { "main" : "#444444", "sub" : "#777777" },
}

CONF = {}
try:
    if os.path.exists(FILE_CONF) : 
        CONF = util_file.load_json_file(FILE_CONF)
        if CONF["app"]["name"] == APP_NAME :
            version_file = "./ref/version.txt"
            CONF["app"]["ver"] = util_file.load_file(version_file).strip()
            util_file.write_json_file(CONF, FILE_CONF, 4)
except Exception as e:
    pass

ENV = {}
ENV["path_allows"] = ["/login", "/auth", "/api", "/favicon.ico", "/static", "/ws"]
PREDEFINED_PARAMS = {
    ".g" : { "type": "int" },
    "@grp" : { "type": "int" },
    ".i" : { "type": "int" },
    ".v" : { "type": "int" },
    ".p" : { "type": "string" },
    ".t" : { "type": "string", "values":["excel","csv","sample","code"] },
    ".c" : { "type": "string", "values":["1"] },
    ".m" : { "type": "string", "values":["view"] }, #just for view
    ".n" : { "type": "string" }, #just for view
    ".o" : { "type": "int", "default":0 }, #just for pagenation offset
    ".date" : { "type": "string" },
}

SQLS = {}
SQLS["datasource"] = """
    select timezone, charset, collation, host, port , db as 'database', user, pwd as password, permit, 
    (select name from code where code1='02' and code2 in ( substr(type,3, 2) )) as type
    from source where idx = #{idx}
    """
SQLS["grp"] = """
    select idx, name, start from grp where live = 'Y' order by arrange
    """
SQLS["db_type"] = """
    select name from code where code1='02' and code2 in ( select substr(type,3, 2) from source where idx = #{idx} )
    """
SQLS["panel"] = """
    select midx, idx, title, json_panel_value from panel where idx = #{idx} and levelu >= #{level} 
    """
SQLS["panel_view"] = """
    select midx, idx, title, json_panel_value from panel where idx=${idx} and levelv >= ${level} and (grp=${grp} or share=1)
    """
SQLS["panel_update"] = """
    select midx, idx, title, json_panel_value from panel where idx=${idx} and levelu >= ${level} and (grp=${grp} or share=1)
    """
SQLS["menu"] = """
    select idx, case when share = 1 then #{grp} else grp end as grp, menu1, menu2, link 
    from menu 
    where live='Y' and (grp = #{grp} or share=1) and (levelv >= #{level} or levelu >= #{level}) order by share, arrange
    """
SQLS["panel_list"] = """
    select idx, title 
    from panel 
    where (grp=#{grp} or share=1) and midx=#{idx} and (levelv >= #{level} or levelu >= #{level})
    """
SQLS["auth"] = """
    select name, auth from grp where idx=#{grp} and live = 'Y'
    """
SQLS["view"] = """
    select title, json_view_value from view where idx=${.v} and live='Y' and levelv >= ${@level}
    """


WS_USER = {}


def make_env() :

    util_file.make_directory (PATH_KEY)
    util_file.make_directory (PATH_DATA)
    util_file.make_directory (PATH_DATA_LOG)
    util_file.make_directory (PATH_DATA_CACHE)
    util_file.make_directory (PATH_DATA_ASSET)
    util_file.make_directory (PATH_DATA_UPLOAD)
    util_file.make_directory (PATH_DATA_TEPM)
