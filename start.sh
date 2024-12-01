#!/usr/bin/env bash

env=$1
port=${2:-8000}
workers=${3:-10} # workers 값을 세 번째 인자로 받으며, 기본값은 10
app_path="app.main:app"
log_config="./ini/log.ini"

if [ "$env" == "dev" ]; then
    echo "Starting development environment, port: $port"
elif [ "$env" == "prod" ]; then
    echo "Starting production environment, port: $port, workers: $workers"
else
    echo "./start.sh [dev|prod] [port] [workers]"
    echo "dev|prod: required input"
    echo "port: default value=8000"
    echo "workers: default value = 10, applies only to prod."
    exit 1
fi

pkill -f "uvicorn.*$app_path.*--port.*$port"
if [[ "$OSTYPE" == "darwin"* ]]; then
    pkill -f "Python.app/Contents/MacOS/.*spawn_main"
fi

source ../bin/activate
python -m pip install -r ./requirements.txt

if [ "$env" == "dev" ]; then
    python -m uvicorn $app_path --reload --reload-dir ../ --log-config $log_config --port $port
elif [ "$env" == "prod" ]; then
    python -m uvicorn $app_path --workers $workers --log-config $log_config --port $port > /dev/null 2>&1 &
fi
