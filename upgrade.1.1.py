"""
# Here is the database addition script for version 2.

# To delete the database added in version 2, please refer to the instructions below.
delete from panel where idx = 23;
delete from menu where idx = 110;
drop table prompt;

# commands
source ../bin/activate
python upgrade.py

"""

import sys
sys.path.append('./app/util')
from app.util import util_db

sql = """
CREATE TABLE prompt (
  idx int(11) NOT NULL AUTO_INCREMENT,
  grp int(11) NOT NULL,
  live varchar(1) DEFAULT 'Y' COMMENT 'use Y/N',
  title varchar(50) DEFAULT NULL COMMENT 'prompt title',
  levelv varchar(4) DEFAULT '0150' COMMENT 'view permit,0110:super,0120:admin,0130:manager,0140:operator,0150:viewer,0180:partner',
  levelu varchar(4) DEFAULT '0150' COMMENT 'update/new permit,0110:super,0120:admin,0130:manager,0140:operator,0150:viewer,0180:partner',
  share int(1) DEFAULT 0,
  updated timestamp NOT NULL DEFAULT current_timestamp(),
  json_prompt_value text DEFAULT NULL,
  PRIMARY KEY (idx),
  UNIQUE KEY grp (grp,title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
;
INSERT INTO menu(idx,grp,menu1,menu2,arrange,levelv,levelu,share) VALUES (110,1, 'Commons Admin', 'Prompt', 65,'0120','0120',1)
;
INSERT INTO panel(grp,midx,idx,title,arrange,levelv,levelu,share,json_panel_value) VALUES (1,110,23,'Prompt List',10,'0110','0110',1,
'{"datasource":1,"chart":{"type":"table","query":["SELECT idx AS pkey, idx, title, live, levelu, levelv, json_prompt_value FROM prompt WHERE share = 1 ORDER BY idx DESC"],"heads":[{"name":"idx","alias":"id","type":"int"},{"name":"title","type":"string"},{"name":"live","type":"string","display":"choice","default":"Y","values":{"data":{"yes":"Y","no":"N"}}},{"name":"levelv","alias":"view level","type":"string","display":"choice","default":"0130","values":{"query":"select name as k, concat(code1,code2) as v from code where code1=\\'01\\' order by 2"}},{"name":"levelu","alias":"update level","type":"string","display":"choice","default":"0130","values":{"query":"select name as k, concat(code1,code2) as v from code where code1=\\'01\\' order by 2"}},{"name":"json_prompt_value","type":"string","display":"json","space":"pre-wrap"},{"name":"pkey","type":"int","display":"key"}],"operate":[],"execute":[{"name":"edit","type":"row","columns":[{"name":"title","input":"required"},{"name":"live","input":"required"},{"name":"levelv","input":"required"},{"name":"levelu","input":"required"},{"name":"json_prompt_value","input":"required"}],"query":["UPDATE prompt SET title = #{title}, live = #{live}, levelv = #{levelv}, levelu = #{levelu}, json_prompt_value = #{json_prompt_value} WHERE idx = #{pkey}"]}],"insert":[{"name":"new","columns":[{"name":"title","input":"required"},{"name":"live","input":"required"},{"name":"levelv","input":"required"},{"name":"levelu","input":"required"},{"name":"json_prompt_value","input":"required"}],"bulk":false,"query":["INSERT INTO prompt (grp, title, levelu, levelv, json_prompt_value) VALUES ( #{@grp}, #{title}, #{levelv}, #{levelu}, #{json_prompt_value})"]}]}}')
;
INSERT INTO prompt(idx,grp,title,levelv,levelu,share,json_prompt_value) VALUES (1,1,'Analysis','0120','0120',1,
'{"llm":{"source":"google","name":"gemini-2.5-flash"},"system":"You are a friendly expert skilled in data analysis and report writing.","user":"You will be provided with a JSON string, and your task is to analyze and process it according to the instructions or context contained within the string.\\\\nIf no specific instructions are given, follow the standard procedure outlined below:\\\\n\\\\nStandard Analysis Procedure\\\\n1. Parse the JSON string accurately.\\\\n    → The \\\\"head\\\\" field describes each data field in the \\\\"value\\\\" array of rows.\\\\n2. Identify the data structure.\\\\n    → Determine the columns, rows, and data types (e.g., numerical, categorical).\\\\n3. Analyze the data.\\\\n    → Focus on identifying key metric changes, clear trends, anomalies, summary statistics, etc.\\\\n4. Summarize in a report format.\\\\n    → Generate a clean and concise result report.\\\\n5. If the JSON includes questions to answer or transformations to perform, apply logical reasoning to complete the task.\\\\n\\\\nOutput Format\\\\n\\\\n- Follow the report template below.\\\\n- Output the result in Markdown format, and ensure the result is written in ${@lang}.\\\\n- Present key metrics in table format, where applicable.\\\\n\\\\n# Analysis Report\\\\n\\\\n## 1. Daily Summary Analysis\\\\n### 1-1. Key Metric Changes (Row-by-Row Comparison)\\\\n### 1-2. Summary of Analysis\\\\n\\\\n## 2. Comprehensive Insights and Recommendations\\\\n### 2-1. Key Insights\\\\n### 2-2. Recommendations\\\\n\\\\nAdditional Notes\\\\n- Assume full access to the JSON data to produce accurate and reliable output.\\\\n- If the analysis goal or transformation request is unclear or missing, ask for additional information to clarify the task.\\\\n- If any data appears missing, treat it as not yet updated, not as truly missing.\\\\n    → In this case, omit any suggestions or comments related to missing data.\\\\n\\\\nPlease analyze the following data and provide insights. data=\\'${data}\\'"}')
;
"""

util_db.import_db_mysql(0, sql)

print(f"++ The database addition for version 1.1.0 has been completed.")


