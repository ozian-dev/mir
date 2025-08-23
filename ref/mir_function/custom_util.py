import sys
sys.path.append('../mir/')

from pathlib import Path
from app.conf import const
from app.util import util_panel, util_db, util_agent, util_library

def file_touch(file_name,params,results):
    print(params)
    print(results)
    file_path = Path(file_name)
    file_path.touch(exist_ok=True)
