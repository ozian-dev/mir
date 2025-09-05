import sys
sys.path.append('../../')

import re
import os
import json
import markdown2
import asyncio
import subprocess

from fastapi.templating import Jinja2Templates
from datetime import datetime
from babel.dates import format_date
from pathlib import Path

from app.conf import const, log
from app.util import util_panel, util_db, util_agent, util_library

template = Jinja2Templates(directory=f"{const.PATH_CONF}/template")

def is_scheduled():
    if 'scheduler' in const.CONF['app'] and const.CONF['app']['scheduler']:
        return True
    else:
        return False
   
def every_hour():

    sql = "select title, schedule, mode, json_job_value from job where live = 'Y'"
    res = util_db.select_db(1, sql)
    for row in res['data']:
        row['json'] = json.loads(row['json_job_value'])
        del(row['json_job_value'])
    const.AGENT_JOB = res['data']

    log.log_info('scheduler', f"[AGENT_JOB] reloaded")


def every_minute():
    
    if 'scheduler' not in const.CONF['app'] or const.CONF['app']['scheduler'] == False: return
    if is_run_process() == False: return
    if is_scheduled() == False: return

    for job in const.AGENT_JOB:
        if util_library.match_cron_time(job['schedule']):
            if const.ASYNC_LOOP:
                if job['mode'] == '0501':
                    const.ASYNC_LOOP.call_soon_threadsafe(
                        lambda job=job: asyncio.create_task(run_job_agent(job))
                    )
                elif job['mode'] == '0502':
                    const.ASYNC_LOOP.call_soon_threadsafe(
                        lambda job=job: asyncio.create_task(run_job_sql(job))
                    )
                elif job['mode'] == '0503':
                    const.ASYNC_LOOP.call_soon_threadsafe(
                        lambda job=job: asyncio.create_task(run_job_script(job))
                    )



async def run_job_agent(job):
    log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] started")

    contexts = {}
    contexts['date'] = format_date(datetime.now(), format='long', locale=const.CONF['locale']['lang'])
    contexts['title'] = f"[REPORT] {job['title']} ({contexts['date']})"
    contexts['panel'] = []

    for panel_item in job['json']['panel']:

        params = {
            '@id': 'super', 
            '@uid': 1, 
            '@lang': const.CONF['locale']['lang'],
            'level': '0110', 
            'idx': panel_item['idx'],
        }
        rows = util_db.select_db(1, const.SQLS["panel"], params)

        panel = rows['data'][0]
        panel_json = json.loads(rows['data'][0]['json_panel_value'])

        params['.o'] = 0
        params['.g'] = panel['grp']
        params['.i'] = panel['idx']
        params['@level'] = params['level']
        panel = util_panel.get_panel (panel, panel_json, params)

        context = {}
        context['title'] = panel['title']
        context['response'] = []

        sql_param = {'idx': panel_item['idx']}
        sql = """
            select
                g.idx as grp,
                m.idx as menu,
                concat ( g.name, ' > ', m.menu1, ' > ', m.menu2, ' > ', p.title ) as navi
            from panel p
            left join ( select idx, menu1, menu2 from menu ) m on m.idx = p.midx 
            left join ( select idx, name from grp ) g on g.idx = p.grp 
            where p.idx = #{idx}
        """
        res_navi = util_db.select_db(const.CONF['start_db']['idx'], sql, sql_param)
        context['navi'] = res_navi['data'][0]['navi']
        context['link'] = f"/?.g={res_navi['data'][0]['grp']}#/rest/workplace?.g={res_navi['data'][0]['grp']}&.i={res_navi['data'][0]['menu']}"
        for prompt_idx in panel_item['prompt']:
            
            panel['chart']['agent'] = {'source': prompt_idx}
            params['pmtidx'] = prompt_idx

            res_agent = util_agent.startAgent (panel, params, 'call')
            
            res_agent['answer'] = markdown2.markdown(
                res_agent['answer'], 
                extras=['tables', 'fenced-code-blocks', 'strike', 'target-blank-links']
            )
            res_agent['answer'] = re.sub(r'<th[^>]*style="text-align:[^"]*"[^>]*>', 
                lambda m: re.sub(r'style="text-align:[^"]*"', 'style="text-align:center;padding:5px;"', m.group(0)), 
                res_agent['answer'])
            res_agent['answer'] = re.sub(r'<td[^>]*style="text-align:[^"]*"[^>]*>', 
                lambda m: re.sub(r'style="text-align:[^"]*"', 'style="text-align:right;padding:5px;"', m.group(0)), 
                res_agent['answer'])
            res_agent['answer'] = re.sub(r"<table>", 
                '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;">', 
                res_agent['answer'])

            context['response'].append(res_agent)

        contexts['panel'].append(context)
    
    body_template = template.env.get_template(f"{job['json']['template']}.html")
    body = body_template.render(**contexts)

    from_email = job['json']['from']
    to_email = job['json']['to']

    util_library.send_email(contexts['title'], body, from_email, to_email)

    log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] commpleted")


async def run_job_sql(job):
    if 'datasource' not in job['json'] : return
    if 'query' not in job['json'] : return

    log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] started")
    try : 
        util_db.execute_db(job['json']['datasource'], job['json']['query'])
        log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] commpleted")

    except Exception as e: 
        log.log_error('scheduler', f"[{const.APP_PID}][{job['title']}] failed\n{e}")


async def run_job_script(job):
    if 'script' not in job['json']:
        return

    log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] started")
    script_path = f"../mir_scheduler/{job['json']['script']}.py"
    
    try:
        result = subprocess.run(
            ["python", script_path],
            shell=False,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if stdout:
            if stdout.strip() != '' :
                log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}][STDOUT] {stdout}")

        if stderr:
            log.log_error('scheduler', f"[{const.APP_PID}][{job['title']}] failed\n{stderr}")
        else:
            log.log_info('scheduler', f"[{const.APP_PID}][{job['title']}] commpleted")

    except subprocess.CalledProcessError as e:
        log.log_error('scheduler', f"[{const.APP_PID}][{job['title']}] failed\n{e.stderr.strip()}")

    except Exception as e:
        log.log_error('scheduler', f"[{const.APP_PID}][{job['title']}] failed\n{e}")


def is_run_process():
    pids_path = Path(const.PATH_DATA_PIDS)
    pids_info = [
        {"pid": f.name, "ctime_ns": f.stat().st_mtime_ns}
        for f in pids_path.glob("*")
        if f.is_file() and not f.name.startswith(".")
    ]

    if const.APP_PID == pids_info[0]['pid'] : 
        log.log_info('scheduler', f"[{const.APP_PID}] run a scheduled job")
        return True
    else : return False
    
