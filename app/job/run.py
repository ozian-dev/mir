import sys
sys.path.append('../../')

import json
import markdown2
import asyncio
import subprocess

from fastapi.templating import Jinja2Templates
from datetime import datetime
from babel.dates import format_date
from app.conf import const, log
from app.util import util_panel, util_db, util_agent, util_library

template = Jinja2Templates(directory=f"{const.PATH_CONF}/template")

"""
DROP TABLE IF EXISTS job;
CREATE TABLE job (
    idx int(11) NOT NULL AUTO_INCREMENT,
    title varchar(50) DEFAULT NULL COMMENT 'job title',
    schedule varchar(50) DEFAULT NULL COMMENT 'crontab schedule format',
    mode varchar(4) NOT NULL DEFAULT '0501',
    json_job_value text DEFAULT NULL,
    live varchar(1) DEFAULT 'Y' COMMENT 'use Y/N',
    updated timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (idx)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
;
insert into job (title, schedule, mode, json_job_value) values
('Daily Report', '0 * * * *', '0501', '{"panel":[{"idx":115,"prompt":[1,1]},{"idx":115,"prompt":[1,1]}],"from":"no-reply@tpmn.io","to":"hyunwoo@tpmn.io","template":"default"}')
;

INSERT INTO code(code1,code2,name) VALUES('05','01','agent');
INSERT INTO code(code1,code2,name) VALUES('05','02','sql');
INSERT INTO code(code1,code2,name) VALUES('05','03','script');
"""


def isScheduled():
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

    if isScheduled() == False:
        return

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
    log.log_info('scheduler', f"[{job['title']}] started.")

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
        context['res'] = []

        for prompt_idx in panel_item['prompt']:
            
            panel['chart']['agent'] = {'source': prompt_idx}
            
            res_agent = util_agent.startAgent (panel, params, 'call')
            res_agent['res'] = markdown2.markdown(res_agent['response'])
            del(res_agent['response'])

            context['res'].append(res_agent)

        contexts['panel'].append(context)

    body_template = template.env.get_template(f"{job['json']['template']}.html")
    body = body_template.render(**contexts)

    from_email = job['json']['from']
    to_email = job['json']['to']

    util_library.send_email(contexts['title'], body, from_email, to_email)

    log.log_info('scheduler', f"[{job['title']}] commpleted")

async def run_job_sql(job):
    if 'datasource' not in job['json'] : return
    if 'query' not in job['json'] : return

    log.log_info('scheduler', f"[{job['title']}] started.")
    try : 
        util_db.execute_db(job['json']['datasource'], job['json']['query'])
        log.log_info('scheduler', f"[{job['title']}] commpleted")

    except Exception as e: 
        log.log_error('scheduler', f"[{job['title']}] failed\n{e}")


async def run_job_script(job):
    if 'script' not in job['json']:
        return

    log.log_info('scheduler', f"[{job['title']}] started.")
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
                log.log_info('scheduler', f"[{job['title']}][STDOUT] {stdout}")

        if stderr:
            log.log_error('scheduler', f"[{job['title']}] failed\n{stderr}")
        else:
            log.log_info('scheduler', f"[{job['title']}] commpleted")

    except subprocess.CalledProcessError as e:
        log.log_error('scheduler', f"[{job['title']}] failed\n{e.stderr.strip()}")

    except Exception as e:
        log.log_error('scheduler', f"[{job['title']}] failed\n{e}")