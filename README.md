# mir Project Overview  
The mir project is designed to provide an admin tool based on **MySQL** or **MariaDB**.  

## Key Features  

### 1. Database Management and Dashboard  
- Perform basic **CRUD operations** using **DB queries** and **JSON-based configurations**.  
- Create **data-driven dashboards** utilizing **Table, Line, and Bar charts**.  

### 2. Registration Forms and External Integration  
- Provide **registration forms** for user input.  
- Support integration with external APIs (e.g., file uploads to GCP, AWS, etc.).

## Quick Start  
In advance, create a database user to be used during the setup process.
```bash
    % python3 -m venv env_mir

    % cd env_mir

    % source ./bin/activate

    % git clone https://github.com/ozian-dev/mir.git

    % cd mir

    % python -m pip install --upgrade pip

    % python -m pip install -r ./requirements.txt

    % python ./setup.py  
    Input 'App name' (ex: mir, default:mir): 
    Input 'App version' (ex: 1.0, default:1.0): 
    Input 'mir DB' server type (ex: mariadb, mysql, default:mariadb): 
    Input 'mir DB' server host (ex: 127.0.0.1, default:127.0.0.1): 
    Input 'mir DB' server port (ex: 3306, default:3306): 
    Input 'mir DB' user (ex: user, default:root): 
    Input 'mir DB' password (ex: password, default:test): 
    Input 'mir DB' database name (ex: mir, default:mir_db_[random 6-characters]): 
    Input your time zone (ex: Asia/Seoul, default:Asia/Seoul): 
    Input your charset (ex: utf8mb4, default:utf8mb4): 
    Input your collation (ex: utf8mb4_general_ci, default:utf8mb4_general_ci): 
    Input main color css (ex: blue/red/green/black, default:'blue'): 
    Input your custom css (ex: https://example.com/css/example.css, default:''): 
    Do you use custom favicon.ico file (y/n) (default:'n'): 
    If further modifications are needed, please edit the './_conf/conf.json' file.
    ++ mir_db_zk14sg mir main DB is done.
    ++ mir_db_zk14sg mir zetetic DB is done.
    ++ mir_db_zk14sg database is created.

    % ./start.sh dev 7000
```

## Documentation
You can find the full mir Project [documentation(ko)](https://ozian.notion.site/mir-project-ko-580d071c99954078876446fae3285fe4), including the 'getting started' guide.

## License
This project is licensed under the MIT License

## Hashtags
#mir #AdminTool #MySQL #MariaDB #CRUD #JSON #Dashboard #DataVisualization #RegistrationForms #APIs #Integration #GCP #AWS
